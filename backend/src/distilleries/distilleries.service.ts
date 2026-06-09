import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Distillery } from './entities/distillery.entity';
import { CreateDistilleryDto } from './dto/create-distillery.dto';
import { UpdateDistilleryDto } from './dto/update-distillery.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../users/entities/user.entity';

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
    const where: any = { id, isActive: true };
    
    // Non-admin users can only see their own distilleries
    if (userRole !== UserRole.ADMIN && userId) {
      where.userId = userId;
    }
    
    const distillery = await this.distilleryRepository.findOne({ where });
    if (!distillery) {
      throw new NotFoundException(`Distillery with ID ${id} not found`);
    }
    return distillery;
  }

  async update(id: number, updateDistilleryDto: UpdateDistilleryDto, userId?: number, userRole?: UserRole): Promise<Distillery> {
    const distillery = await this.findOne(id, userId, userRole);
    
    // Check ownership for non-admin users
    if (userRole !== UserRole.ADMIN && distillery.userId !== userId) {
      throw new ForbiddenException('You can only update your own distilleries');
    }
    
    Object.assign(distillery, updateDistilleryDto);
    return this.distilleryRepository.save(distillery);
  }

  async remove(id: number, userId?: number, userRole?: UserRole): Promise<void> {
    const distillery = await this.findOne(id, userId, userRole);
    
    // Check ownership for non-admin users
    if (userRole !== UserRole.ADMIN && distillery.userId !== userId) {
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
