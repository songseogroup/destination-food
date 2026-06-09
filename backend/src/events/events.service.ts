import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Event } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto, userId?: number, userRole?: UserRole): Promise<Event> {
    const event = this.eventRepository.create(createEventDto);
    // If user is not admin, set userId
    if (userRole !== UserRole.ADMIN && userId) {
      event.userId = userId;
    }
    return this.eventRepository.save(event);
  }

  async findAll(paginationDto: PaginationDto, userId?: number, userRole?: UserRole): Promise<{ data: Event[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const qb = this.eventRepository.createQueryBuilder('e').where('e.isActive = :a', { a: true });

    if (userRole !== UserRole.ADMIN && userId) {
      qb.andWhere('e.userId = :uid', { uid: userId });
    } else if (!userRole) {
      qb.leftJoin('users', 'u', 'u.id = e.userId').andWhere(
        '(e.userId IS NULL OR (u.approvalStatus = :approved AND u.isActive = :uActive))',
        { approved: 'approved', uActive: true },
      );
    }

    const [data, total] = await qb
      .orderBy('e.date', 'ASC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findFeatured(): Promise<Event[]> {
    return this.eventRepository
      .createQueryBuilder('e')
      .leftJoin('users', 'u', 'u.id = e.userId')
      .where('e.isActive = :a', { a: true })
      .andWhere('e.isFeatured = :f', { f: true })
      .andWhere('(e.userId IS NULL OR (u.approvalStatus = :approved AND u.isActive = :uActive))', {
        approved: 'approved',
        uActive: true,
      })
      .orderBy('e.date', 'ASC')
      .take(3)
      .getMany();
  }

  async findUpcoming(): Promise<Event[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.eventRepository.find({
      where: { isActive: true },
      order: { date: 'ASC' },
    });
  }

  async findOne(id: number, userId?: number, userRole?: UserRole): Promise<Event> {
    const where: any = { id, isActive: true };
    
    // Non-admin users can only see their own events
    if (userRole !== UserRole.ADMIN && userId) {
      where.userId = userId;
    }
    
    const event = await this.eventRepository.findOne({ where });
    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }
    return event;
  }

  async update(id: number, updateEventDto: UpdateEventDto, userId?: number, userRole?: UserRole): Promise<Event> {
    const event = await this.findOne(id, userId, userRole);
    
    // Check ownership for non-admin users
    if (userRole !== UserRole.ADMIN && event.userId !== userId) {
      throw new ForbiddenException('You can only update your own events');
    }
    
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async remove(id: number, userId?: number, userRole?: UserRole): Promise<void> {
    const event = await this.findOne(id, userId, userRole);
    
    // Check ownership for non-admin users
    if (userRole !== UserRole.ADMIN && event.userId !== userId) {
      throw new ForbiddenException('You can only delete your own events');
    }
    
    event.isActive = false;
    await this.eventRepository.save(event);
  }

  async search(query: string): Promise<Event[]> {
    return this.eventRepository
      .createQueryBuilder('event')
      .where('event.isActive = :isActive', { isActive: true })
      .andWhere(
        '(event.name LIKE :query OR event.type LIKE :query OR event.location LIKE :query OR event.category LIKE :query)',
        { query: `%${query}%` }
      )
      .orderBy('event.date', 'ASC')
      .getMany();
  }

  async findByCategory(category: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { category, isActive: true },
      order: { date: 'ASC' },
    });
  }
}
