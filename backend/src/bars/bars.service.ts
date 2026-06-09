import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Bar } from './entities/bar.entity';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';

@Injectable()
export class BarsService {
  constructor(
    @InjectRepository(Bar)
    private barRepository: Repository<Bar>,
  ) {}

  async create(createBarDto: CreateBarDto, userId?: number, userRole?: UserRole): Promise<Bar> {
    const bar = this.barRepository.create(createBarDto);
    // If user is not admin, set userId
    if (userRole !== UserRole.ADMIN && userId) {
      bar.userId = userId;
    }
    return this.barRepository.save(bar);
  }

  async findAll(paginationDto: PaginationDto, userId?: number, userRole?: UserRole): Promise<{ data: Bar[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const qb = this.barRepository.createQueryBuilder('bar').where('bar.isActive = :a', { a: true });

    if (userRole !== UserRole.ADMIN && userId) {
      qb.andWhere('bar.userId = :uid', { uid: userId });
    } else if (!userRole) {
      // Public path — hide bars belonging to non-approved or suspended vendors.
      qb.leftJoin('users', 'u', 'u.id = bar.userId').andWhere(
        '(bar.userId IS NULL OR (u.approvalStatus = :approved AND u.isActive = :uActive))',
        { approved: 'approved', uActive: true },
      );
    }

    const [data, total] = await qb
      .orderBy('bar.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findFeatured(): Promise<Bar[]> {
    return this.barRepository
      .createQueryBuilder('bar')
      .leftJoin('users', 'u', 'u.id = bar.userId')
      .where('bar.isActive = :a', { a: true })
      .andWhere('(bar.userId IS NULL OR (u.approvalStatus = :approved AND u.isActive = :uActive))', {
        approved: 'approved',
        uActive: true,
      })
      .orderBy('bar.createdAt', 'DESC')
      .take(3)
      .getMany();
  }

  async findOne(id: number, userId?: number, userRole?: UserRole): Promise<Bar> {
    const qb = this.barRepository
      .createQueryBuilder('bar')
      .where('bar.id = :id', { id })
      .andWhere('bar.isActive = :a', { a: true });

    if (userRole !== UserRole.ADMIN && userId) {
      qb.andWhere('bar.userId = :uid', { uid: userId });
    } else if (!userRole) {
      qb.leftJoin('users', 'u', 'u.id = bar.userId').andWhere(
        '(bar.userId IS NULL OR (u.approvalStatus = :approved AND u.isActive = :uActive))',
        { approved: 'approved', uActive: true },
      );
    }

    const bar = await qb.getOne();
    if (!bar) {
      throw new NotFoundException(`Bar with ID ${id} not found`);
    }
    return bar;
  }

  async findByUserId(userId: number): Promise<Bar> {
    const bar = await this.barRepository.findOne({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    if (!bar) {
      throw new NotFoundException('No bar found for this user');
    }
    return bar;
  }

  async update(id: number, updateBarDto: UpdateBarDto, userId?: number, userRole?: UserRole): Promise<Bar> {
    const bar = await this.findOne(id, userId, userRole);
    
    // Check ownership for non-admin users
    if (userRole !== UserRole.ADMIN && bar.userId !== userId) {
      throw new ForbiddenException('You can only update your own bars');
    }
    
    Object.assign(bar, updateBarDto);
    return this.barRepository.save(bar);
  }

  async remove(id: number, userId?: number, userRole?: UserRole): Promise<void> {
    const bar = await this.findOne(id, userId, userRole);
    
    // Check ownership for non-admin users
    if (userRole !== UserRole.ADMIN && bar.userId !== userId) {
      throw new ForbiddenException('You can only delete your own bars');
    }
    
    bar.isActive = false;
    await this.barRepository.save(bar);
  }

  async search(query: string): Promise<Bar[]> {
    return this.barRepository
      .createQueryBuilder('bar')
      .where('bar.isActive = :isActive', { isActive: true })
      .andWhere(
        '(bar.name LIKE :query OR bar.type LIKE :query OR bar.location LIKE :query)',
        { query: `%${query}%` }
      )
      .getMany();
  }
}
