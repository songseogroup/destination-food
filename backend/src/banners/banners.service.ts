import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, IsNull, Repository } from 'typeorm';
import { Banner, BannerSlot } from './entities/banner.entity';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(@InjectRepository(Banner) private repo: Repository<Banner>) {}

  async listActive(slot?: BannerSlot): Promise<Banner[]> {
    const qb = this.repo
      .createQueryBuilder('b')
      .where('b.isActive = :a', { a: true })
      .andWhere('(b.startsAt IS NULL OR b.startsAt <= NOW())')
      .andWhere('(b.endsAt IS NULL OR b.endsAt >= NOW())')
      .orderBy('b.priority', 'DESC')
      .addOrderBy('b.createdAt', 'DESC');
    if (slot) qb.andWhere('b.slot = :s', { s: slot });
    return qb.getMany();
  }

  async listAll(slot?: BannerSlot): Promise<Banner[]> {
    const where: any = {};
    if (slot) where.slot = slot;
    return this.repo.find({ where, order: { priority: 'DESC', createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Banner> {
    const b = await this.repo.findOne({ where: { id } });
    if (!b) throw new NotFoundException('Banner not found');
    return b;
  }

  async create(dto: CreateBannerDto): Promise<Banner> {
    const banner = this.repo.create({
      slot: dto.slot,
      title: dto.title,
      subtitle: dto.subtitle,
      imageUrl: dto.imageUrl,
      linkUrl: dto.linkUrl,
      priority: dto.priority ?? 0,
      isActive: dto.isActive ?? true,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });
    return this.repo.save(banner);
  }

  async update(id: number, dto: UpdateBannerDto): Promise<Banner> {
    const banner = await this.findOne(id);
    if (dto.slot !== undefined) banner.slot = dto.slot;
    if (dto.title !== undefined) banner.title = dto.title;
    if (dto.subtitle !== undefined) banner.subtitle = dto.subtitle;
    if (dto.imageUrl !== undefined) banner.imageUrl = dto.imageUrl;
    if (dto.linkUrl !== undefined) banner.linkUrl = dto.linkUrl;
    if (dto.priority !== undefined) banner.priority = dto.priority;
    if (dto.isActive !== undefined) banner.isActive = dto.isActive;
    if (dto.startsAt !== undefined) banner.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) banner.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    return this.repo.save(banner);
  }

  async remove(id: number): Promise<void> {
    const banner = await this.findOne(id);
    await this.repo.remove(banner);
  }

  async incrementImpression(id: number): Promise<void> {
    await this.repo.increment({ id }, 'impressions', 1);
  }

  async incrementClick(id: number): Promise<void> {
    await this.repo.increment({ id }, 'clicks', 1);
  }
}
