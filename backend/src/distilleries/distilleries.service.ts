import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Distillery } from './entities/distillery.entity';
import { CreateDistilleryDto } from './dto/create-distillery.dto';
import { UpdateDistilleryDto } from './dto/update-distillery.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';
import { applyListingVisibility, isStaffRole } from '../common/listing-visibility';

@Injectable()
export class DistilleriesService {
  constructor(
    @InjectRepository(Distillery)
    private distilleryRepository: Repository<Distillery>,
  ) {}

  async create(createDistilleryDto: CreateDistilleryDto, userId?: number, userRole?: UserRole): Promise<Distillery> {
    const distillery = this.distilleryRepository.create(createDistilleryDto);
    // If user is not admin, set userId
    if (userRole !== UserRole.ADMIN && userId) {
      distillery.userId = userId;
    }
    return this.distilleryRepository.save(distillery);
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
  async findMine(userId: number): Promise<{ data: Distillery[]; total: number }> {
    const [data, total] = await this.distilleryRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findAll(paginationDto: PaginationDto, userId?: number, userRole?: UserRole): Promise<{ data: Distillery[]; total: number }> {
    const { page = 1, limit = 10 } = paginationDto;
    const qb = this.distilleryRepository.createQueryBuilder('d').where('d.isActive = :a', { a: true });

    if (userRole !== UserRole.ADMIN && userId) {
      qb.andWhere('d.userId = :uid', { uid: userId });
    } else if (!userRole) {
      qb.leftJoin('users', 'u', 'u.id = d.userId').andWhere(
        '(d.userId IS NULL OR (u.approvalStatus = :approved AND u.isActive = :uActive))',
        { approved: 'approved', uActive: true },
      );
    }

    const [data, total] = await qb
      .orderBy('d.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  async findFeatured(): Promise<Distillery[]> {
    return this.distilleryRepository
      .createQueryBuilder('d')
      .leftJoin('users', 'u', 'u.id = d.userId')
      .where('d.isActive = :a', { a: true })
      .andWhere('(d.userId IS NULL OR (u.approvalStatus = :approved AND u.isActive = :uActive))', {
        approved: 'approved',
        uActive: true,
      })
      .orderBy('d.rating', 'DESC')
      .take(3)
      .getMany();
  }

  async findOne(id: number, userId?: number, userRole?: UserRole): Promise<Distillery> {
    const qb = this.distilleryRepository.createQueryBuilder('d').where('d.id = :id', { id });

    // Staff see everything; the owning vendor sees their own (drafts and all,
    // even while pending approval); everyone else gets the published view. The
    // old check keyed off UserRole.ADMIN alone, which left super_admin on the
    // vendor side and 404'd it on any listing it didn't personally own.
    applyListingVisibility(qb, 'd', userId, userRole);

    const distillery = await qb.getOne();
    if (!distillery) {
      throw new NotFoundException(`Distillery with ID ${id} not found`);
    }
    return distillery;
  }

  async update(id: number, updateDistilleryDto: UpdateDistilleryDto, userId?: number, userRole?: UserRole): Promise<Distillery> {
    const distillery = await this.findOne(id, userId, userRole);

    if (!isStaffRole(userRole) && distillery.userId !== userId) {
      throw new ForbiddenException('You can only update your own distilleries');
    }

    Object.assign(distillery, updateDistilleryDto);
    return this.distilleryRepository.save(distillery);
  }

  async remove(id: number, userId?: number, userRole?: UserRole): Promise<void> {
    const distillery = await this.findOne(id, userId, userRole);

    if (!isStaffRole(userRole) && distillery.userId !== userId) {
      throw new ForbiddenException('You can only delete your own distilleries');
    }

    distillery.isActive = false;
    await this.distilleryRepository.save(distillery);
  }

  async search(query: string): Promise<Distillery[]> {
    return this.distilleryRepository
      .createQueryBuilder('distillery')
      .where(
        '(distillery.name LIKE :query OR distillery.type LIKE :query OR distillery.location LIKE :query)',
        { query: `%${query}%` }
      )
      .getMany();
  }
}
