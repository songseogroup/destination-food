import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order, OrderStatus } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Customer } from '../customers/entities/customer.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Bar)
    private barRepository: Repository<Bar>,
    @InjectRepository(Distillery)
    private distilleryRepository: Repository<Distillery>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  async create(createOrderDto: CreateOrderDto, customerId: number): Promise<Order> {
    // Validate customer exists and is active
    const customer = await this.customerRepository.findOne({
      where: { id: customerId, isActive: true }
    });
    
    if (!customer) {
      throw new UnauthorizedException('Customer account not found or inactive');
    }

    // Validate that the referenced entity exists
    if (createOrderDto.orderType === 'bar_reservation' && createOrderDto.barId) {
      const bar = await this.barRepository.findOne({ where: { id: createOrderDto.barId } });
      if (!bar) {
        throw new NotFoundException('Bar not found');
      }
    } else if (createOrderDto.orderType === 'distillery_tour' && createOrderDto.distilleryId) {
      const distillery = await this.distilleryRepository.findOne({ where: { id: createOrderDto.distilleryId } });
      if (!distillery) {
        throw new NotFoundException('Distillery not found');
      }
    } else if (createOrderDto.orderType === 'event_booking' && createOrderDto.eventId) {
      const event = await this.eventRepository.findOne({ where: { id: createOrderDto.eventId } });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
    } else {
      throw new BadRequestException('Invalid order type or missing entity ID');
    }

    const order = this.orderRepository.create({
      ...createOrderDto,
      customerId,
      customerName: `${customer.firstName} ${customer.lastName}`,
      customerEmail: customer.email,
      customerPhone: customer.phone || createOrderDto.customerPhone,
      bookingDate: createOrderDto.bookingDate ? new Date(createOrderDto.bookingDate) : null,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Update customer stats
    customer.totalOrders += 1;
    customer.totalSpent = parseFloat((parseFloat(customer.totalSpent.toString()) + createOrderDto.totalAmount).toFixed(2));
    customer.lastOrderDate = new Date();
    await this.customerRepository.save(customer);

    return savedOrder;
  }

  async findAll(paginationDto: PaginationDto, userId?: number, userRole?: UserRole): Promise<{ data: Order[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.bar', 'bar')
      .leftJoinAndSelect('order.distillery', 'distillery')
      .leftJoinAndSelect('order.event', 'event');

    // Role-based filtering
    if (userRole === UserRole.ADMIN) {
      // Admin sees all orders
    } else if (userRole === UserRole.BAR && userId) {
      // Bar owners see only orders for their bars
      queryBuilder.where('bar.userId = :userId', { userId });
    } else if (userRole === UserRole.DISTILLERY && userId) {
      // Distillery owners see only orders for their distilleries
      queryBuilder.where('distillery.userId = :userId', { userId });
    } else if (userRole === UserRole.EVENT_HOST && userId) {
      // Tour operators and event hosts see only orders for their events
      queryBuilder.where('event.userId = :userId', { userId });
    } else {
      // Unauthenticated or invalid role - return empty
      return { data: [], total: 0 };
    }

    const [data, total] = await queryBuilder
      .orderBy('order.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findOne(id: number, userId?: number, userRole?: UserRole): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['bar', 'distillery', 'event'],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    // Check ownership
    if (userRole !== UserRole.ADMIN) {
      if (order.bar && order.bar.userId !== userId) {
        throw new ForbiddenException('You can only access your own orders');
      }
      if (order.distillery && order.distillery.userId !== userId) {
        throw new ForbiddenException('You can only access your own orders');
      }
      if (order.event && order.event.userId !== userId) {
        throw new ForbiddenException('You can only access your own orders');
      }
    }

    return order;
  }

  async updateStatus(id: number, updateOrderDto: UpdateOrderStatusDto, userId?: number, userRole?: UserRole): Promise<Order> {
    const order = await this.findOne(id, userId, userRole);
    
    order.status = updateOrderDto.status;
    if (updateOrderDto.notes) {
      order.specialRequests = updateOrderDto.notes;
    }

    return this.orderRepository.save(order);
  }

  async findByOwner(userId: number, userRole: UserRole): Promise<Order[]> {
    const queryBuilder = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.bar', 'bar')
      .leftJoinAndSelect('order.distillery', 'distillery')
      .leftJoinAndSelect('order.event', 'event');

    if (userRole === UserRole.BAR) {
      queryBuilder.where('bar.userId = :userId', { userId });
    } else if (userRole === UserRole.DISTILLERY) {
      queryBuilder.where('distillery.userId = :userId', { userId });
    } else if (userRole === UserRole.EVENT_HOST) {
      queryBuilder.where('event.userId = :userId', { userId });
    } else {
      return [];
    }

    return queryBuilder.orderBy('order.createdAt', 'DESC').getMany();
  }

  async exportOrdersCsv(userId?: number, userRole?: UserRole): Promise<string> {
    let orders: Order[] = [];
    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      orders = await this.orderRepository.find({
        relations: ['bar', 'distillery', 'event'],
        order: { createdAt: 'DESC' },
      });
    } else if (userId && userRole) {
      orders = await this.findByOwner(userId, userRole);
    }

    const headers = [
      'orderId',
      'customerName',
      'customerEmail',
      'customerPhone',
      'orderType',
      'status',
      'bookingDate',
      'bookingTime',
      'numberOfGuests',
      'totalAmount',
      'isPaid',
      'eventName',
      'distilleryName',
      'barName',
      'createdAt',
    ];

    const escape = (value: any) => `"${(value ?? '').toString().replace(/"/g, '""')}"`;
    const rows = orders.map((order) =>
      [
        order.id,
        order.customerName,
        order.customerEmail,
        order.customerPhone || '',
        order.orderType,
        order.status,
        order.bookingDate ? new Date(order.bookingDate).toISOString().split('T')[0] : '',
        order.bookingTime || '',
        order.numberOfGuests,
        order.totalAmount,
        order.isPaid ? 'yes' : 'no',
        order.event?.name || '',
        order.distillery?.name || '',
        order.bar?.name || '',
        order.createdAt?.toISOString() || '',
      ]
        .map(escape)
        .join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }
}

