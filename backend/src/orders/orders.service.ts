import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order, OrderStatus, OrderType } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Refund, RefundStatus, RefundType } from '../stripe/entities/refund.entity';
import { TransactionLedger, TransactionStatus, TransactionType } from '../stripe/entities/transaction-ledger.entity';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StripeService } from '../stripe/stripe.service';
import { StripeAccountStatus } from '../stripe/entities/stripe-account.entity';
import { NotificationType } from '../stripe/entities/notification.entity';

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
    @InjectRepository(Refund)
    private refundRepository: Repository<Refund>,
    @InjectRepository(TransactionLedger)
    private transactionLedgerRepository: Repository<TransactionLedger>,
    private emailService: EmailService,
    private notificationsService: NotificationsService,
    private stripeService: StripeService,
  ) {}

  /** Returns the listing the order is attached to plus its owner. */
  private async getOrderListing(order: Order) {
    if (order.orderType === OrderType.BAR_RESERVATION && order.barId) {
      const bar = await this.barRepository.findOne({ where: { id: order.barId } });
      return { listing: bar, name: bar?.name || 'Bar', ownerUserId: bar?.userId };
    }
    if (order.orderType === OrderType.DISTILLERY_TOUR && order.distilleryId) {
      const d = await this.distilleryRepository.findOne({ where: { id: order.distilleryId } });
      return { listing: d, name: d?.name || 'Distillery', ownerUserId: d?.userId };
    }
    if (order.orderType === OrderType.EVENT_BOOKING && order.eventId) {
      const e = await this.eventRepository.findOne({ where: { id: order.eventId } });
      return { listing: e, name: e?.name || 'Event', ownerUserId: e?.userId };
    }
    return { listing: null, name: 'your booking', ownerUserId: undefined };
  }

  /**
   * Refuse a booking before it exists if the host can't actually be paid.
   *
   * createPaymentIntent already refuses these — but only after create() has
   * saved the order, emailed the customer "booking received" and notified the
   * owner. The customer ends up holding a confirmation email for a booking that
   * can never be paid for. Checking here means they get one honest error and
   * nothing is written or sent.
   *
   * Only event bookings and distillery tours settle through Stripe Connect; bar
   * reservations don't, so they never reach this.
   */
  private async assertHostCanBePaid(hostUserId: number | undefined, listingName: string) {
    let enabled = false;
    if (hostUserId) {
      try {
        // getAccountStatus re-reads from Stripe rather than trusting our stored
        // column, so a host who finished onboarding a minute ago isn't blocked.
        const account = await this.stripeService.getAccountStatus(hostUserId);
        enabled = account.status === StripeAccountStatus.ENABLED;
      } catch {
        // No Stripe account at all — never onboarded.
        enabled = false;
      }
    }
    if (!enabled) {
      throw new BadRequestException(
        `${listingName} isn't accepting online bookings yet — the host is still finishing their payment setup. Nothing has been charged. Please try again later.`,
      );
    }
  }

  async create(createOrderDto: CreateOrderDto, customerId: number): Promise<Order> {
    // Defensive: a falsy customerId here is almost always a bug in the
    // calling controller (wrong req.user field). TypeORM would otherwise
    // happily return the first active customer for findOne({ id: undefined })
    // and silently save the order with customerId=null.
    if (!customerId || typeof customerId !== 'number') {
      throw new UnauthorizedException('Customer ID missing — please sign in again.');
    }

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
      await this.assertHostCanBePaid(distillery.userId, distillery.name);
    } else if (createOrderDto.orderType === 'event_booking' && createOrderDto.eventId) {
      const event = await this.eventRepository.findOne({ where: { id: createOrderDto.eventId } });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
      await this.assertHostCanBePaid(event.userId, event.name);
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

    // Fire the "we've received your booking" email + in-app notification.
    // The Stripe webhook fires sendBookingConfirmation separately once the
    // owner confirms via /orders/:id/status, so this is just the first
    // touch confirming we got the request.
    const { name: listingName, ownerUserId } = await this.getOrderListing(savedOrder);
    this.emailService
      .sendBookingReceivedToCustomer(
        customer.email,
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'there',
        savedOrder.id,
        listingName,
        savedOrder.totalAmount as any,
      )
      .catch(() => undefined);
    this.notificationsService
      .create({
        customerId: customer.id,
        type: NotificationType.BOOKING_RECEIVED,
        title: 'Booking received',
        message: `Your booking for ${listingName} is pending confirmation. We'll email your ticket once it's confirmed.`,
        metadata: { orderId: savedOrder.id },
      })
      .catch(() => undefined);
    if (ownerUserId) {
      this.notificationsService
        .create({
          userId: ownerUserId,
          type: NotificationType.BOOKING_RECEIVED,
          title: 'New booking received',
          message: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() + ` requested a booking. Confirm or cancel in Orders.`,
          metadata: { orderId: savedOrder.id, customerId: customer.id },
        })
        .catch(() => undefined);
    }

    return savedOrder;
  }

  /** Customer-scoped order listing. */
  async findByCustomer(customerId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { customerId },
      relations: ['bar', 'distillery', 'event'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOneForCustomer(id: number, customerId: number): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id, customerId },
      relations: ['bar', 'distillery', 'event'],
    });
    if (!order) throw new NotFoundException('Booking not found');
    return order;
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
    const previousStatus = order.status;
    const newStatus = updateOrderDto.status;

    // Paid-order safety rules — once a customer has paid, status transitions
    // are restricted so an admin can't silently un-pay a booking. Only the
    // refund pipeline can take money back, and we kick it off automatically
    // on cancel.
    if (order.isPaid) {
      if (newStatus === OrderStatus.PENDING && previousStatus !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'This booking has already been paid for. It cannot be moved back to Pending. ' +
            'Cancel the booking instead — that will trigger a refund automatically.',
        );
      }
    }

    order.status = newStatus;
    if (updateOrderDto.notes) {
      order.specialRequests = updateOrderDto.notes;
    }

    const saved = await this.orderRepository.save(order);

    // Status changed → notify customer (in-app) and email the ticket on confirmation.
    if (previousStatus !== saved.status) {
      const { name: listingName } = await this.getOrderListing(saved);
      if (saved.status === OrderStatus.CONFIRMED) {
        this.emailService
          .sendBookingTicket(
            saved.customerEmail,
            saved.customerName || 'there',
            saved.id,
            listingName,
            saved.totalAmount as any,
            saved.bookingDate ? saved.bookingDate.toString() : '',
            saved.bookingTime || '',
            saved.numberOfGuests || 1,
          )
          .catch(() => undefined);
        this.notificationsService
          .create({
            customerId: saved.customerId,
            type: NotificationType.BOOKING_CONFIRMED,
            title: 'Booking confirmed',
            message: `Your booking for ${listingName} is confirmed — your ticket is on its way to your inbox.`,
            metadata: { orderId: saved.id },
          })
          .catch(() => undefined);
      } else if (saved.status === OrderStatus.CANCELLED) {
        // If the order was paid, automatically queue a full refund for
        // SuperAdmin approval. The owner doesn't have to remember to do it
        // and the customer can't be left out of pocket.
        let refundInitiated = false;
        if (saved.isPaid && (userId || userRole)) {
          try {
            await this.autoCreateRefundForCancellation(saved, userId, userRole);
            refundInitiated = true;
          } catch (err: any) {
            this.notificationsService
              .create({
                userId,
                type: NotificationType.GENERIC,
                title: 'Refund could not be created automatically',
                message: `Couldn't initiate the refund for booking #${saved.id}: ${err.message}. Please request it from Finance.`,
                metadata: { orderId: saved.id },
              })
              .catch(() => undefined);
          }
        }
        this.notificationsService
          .create({
            customerId: saved.customerId,
            type: NotificationType.GENERIC,
            title: 'Booking cancelled',
            message: saved.isPaid
              ? refundInitiated
                ? `Your booking for ${listingName} was cancelled. A full refund is being processed and should land in your account within 5–10 business days.`
                : `Your booking for ${listingName} was cancelled, but the automatic refund failed. Please contact support — we'll sort it out.`
              : `Your booking for ${listingName} was cancelled.`,
            metadata: { orderId: saved.id, refundInitiated },
          })
          .catch(() => undefined);
      }
    }

    return saved;
  }

  /**
   * Insert a pending-approval Refund row when the owner cancels a paid order.
   * Bypasses the customer-facing refund window — the owner is doing this on
   * behalf of the customer so they shouldn't be locked out by it. Inlined here
   * instead of going through StripeService.requestRefund() so we don't
   * accidentally pick up its window check.
   */
  private async autoCreateRefundForCancellation(
    order: Order,
    requestedByUserId?: number,
    requestedByRole?: UserRole,
  ): Promise<void> {
    if (!this.refundRepository || !this.transactionLedgerRepository) return;
    const originalTransaction = await this.transactionLedgerRepository.findOne({
      where: { orderId: order.id, type: TransactionType.PAYMENT, status: TransactionStatus.COMPLETED },
    });
    if (!originalTransaction) {
      throw new Error('No completed payment transaction found for this order');
    }
    const existingRefund = await this.refundRepository.findOne({
      where: { orderId: order.id, status: RefundStatus.COMPLETED },
    });
    if (existingRefund) return;
    const refund = this.refundRepository.create({
      orderId: order.id,
      originalTransactionId: originalTransaction.id,
      type: RefundType.FULL,
      status: RefundStatus.PENDING_SUPER_ADMIN_APPROVAL,
      amount: originalTransaction.amount,
      currency: originalTransaction.currency || 'aud',
      reason:
        requestedByRole === UserRole.SUPER_ADMIN || requestedByRole === UserRole.ADMIN
          ? 'Cancelled by platform admin'
          : 'Cancelled by vendor',
      requestedBy: requestedByUserId,
      requestedAt: new Date(),
    });
    await this.refundRepository.save(refund);
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

