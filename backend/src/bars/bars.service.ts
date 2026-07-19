import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Bar } from './entities/bar.entity';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';
import { applyListingVisibility, isStaffRole } from '../common/listing-visibility';

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


  /**
   * The caller's own listings, whatever state they're in.
   *
   * findAll() is the public view: it hides anything inactive and anything owned
   * by a vendor who is still pending approval. An operator's own dashboard can't
   * use that — a self-registered operator starts as `pending`, so their own
   * listing would be invisible to them and they would create it again, and
   * again. This is deliberately unfiltered, and scoped to the caller by userId.
   */
  async findMine(userId: number): Promise<{ data: Bar[]; total: number }> {
    const [data, total] = await this.barRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { data, total };
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
    const qb = this.barRepository.createQueryBuilder('bar').where('bar.id = :id', { id });

    // Staff see everything; the owning vendor sees their own (drafts and all,
    // even while pending approval); everyone else gets the published view.
    applyListingVisibility(qb, 'bar', userId, userRole);

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

    // Staff may edit any listing; a vendor only their own. Testing against
    // UserRole.ADMIN alone left super_admin on the vendor side of this check,
    // so the platform's highest role was refused on every listing it didn't
    // personally own.
    if (!isStaffRole(userRole) && bar.userId !== userId) {
      throw new ForbiddenException('You can only update your own bars');
    }
    
    Object.assign(bar, updateBarDto);
    return this.barRepository.save(bar);
  }

  async remove(id: number, userId?: number, userRole?: UserRole): Promise<void> {
    const bar = await this.findOne(id, userId, userRole);

    if (!isStaffRole(userRole) && bar.userId !== userId) {
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
