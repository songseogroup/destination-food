import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review, ReviewEntityType } from './entities/review.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../stripe/entities/notification.entity';
import { CreateReviewDto, OwnerReplyDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Bar) private barRepo: Repository<Bar>,
    @InjectRepository(Distillery) private distilleryRepo: Repository<Distillery>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Customer) private customerRepo: Repository<Customer>,
    private notificationsService: NotificationsService,
  ) {}

  private async getEntityAndOwner(
    type: ReviewEntityType,
    id: number,
  ): Promise<{ entity: Bar | Distillery | Event; ownerUserId: number | null }> {
    let entity: any;
    if (type === ReviewEntityType.BAR) entity = await this.barRepo.findOne({ where: { id } });
    else if (type === ReviewEntityType.DISTILLERY)
      entity = await this.distilleryRepo.findOne({ where: { id } });
    else entity = await this.eventRepo.findOne({ where: { id } });

    if (!entity) {
      throw new NotFoundException(`${type} not found`);
    }
    return { entity, ownerUserId: entity.userId || null };
  }

  async create(customerId: number, dto: CreateReviewDto): Promise<Review> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const { entity, ownerUserId } = await this.getEntityAndOwner(dto.entityType, dto.entityId);

    const review = this.reviewRepo.create({
      customerId,
      customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Anonymous',
      entityType: dto.entityType,
      entityId: dto.entityId,
      rating: dto.rating,
      comment: dto.comment,
      isHidden: false,
    });

    const saved = await this.reviewRepo.save(review);

    // Recompute aggregate on the entity.
    await this.recomputeAggregate(dto.entityType, dto.entityId);

    // Fire-and-forget notification to the owner.
    if (ownerUserId) {
      this.notificationsService
        .create({
          userId: ownerUserId,
          type: NotificationType.GENERIC,
          title: `New ${dto.rating}-star review`,
          message: `${saved.customerName} reviewed your listing: "${this.truncate(dto.comment, 100)}"`,
          metadata: {
            reviewId: saved.id,
            entityType: dto.entityType,
            entityId: dto.entityId,
            rating: dto.rating,
          },
        })
        .catch(() => undefined);
    }

    return saved;
  }

  async listPublic(entityType: ReviewEntityType, entityId: number, limit = 50, offset = 0) {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { entityType, entityId, isHidden: false },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
    return { items, total };
  }

  async listForOwner(userId: number, userRole: UserRole) {
    // Bar/Distillery/Event owners get reviews for their own listings only.
    // SuperAdmin sees everything via the admin route.
    let entityType: ReviewEntityType | null = null;
    let repo: Repository<any> | null = null;
    if (userRole === UserRole.BAR) {
      entityType = ReviewEntityType.BAR;
      repo = this.barRepo;
    } else if (userRole === UserRole.DISTILLERY) {
      entityType = ReviewEntityType.DISTILLERY;
      repo = this.distilleryRepo;
    } else if (userRole === UserRole.EVENT_HOST || userRole === UserRole.TOUR_OPERATOR) {
      entityType = ReviewEntityType.EVENT;
      repo = this.eventRepo;
    } else {
      return [];
    }
    const owned = await repo.find({ where: { userId } });
    if (owned.length === 0) return [];
    const ids = owned.map((x) => x.id);
    return this.reviewRepo
      .createQueryBuilder('r')
      .where('r.entityType = :t', { t: entityType })
      .andWhere('r.entityId IN (:...ids)', { ids })
      .orderBy('r.createdAt', 'DESC')
      .getMany();
  }

  async listAllForAdmin(filter: { hidden?: boolean }) {
    const where: any = {};
    if (typeof filter.hidden === 'boolean') where.isHidden = filter.hidden;
    return this.reviewRepo.find({ where, order: { createdAt: 'DESC' }, take: 200 });
  }

  async setOwnerReply(reviewId: number, userId: number, dto: OwnerReplyDto): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    const { ownerUserId } = await this.getEntityAndOwner(review.entityType, review.entityId);
    if (ownerUserId !== userId) {
      throw new ForbiddenException('You can only reply to reviews on your own listing');
    }
    review.ownerReply = dto.ownerReply;
    review.ownerReplyAt = new Date();
    return this.reviewRepo.save(review);
  }

  async setHidden(reviewId: number, hidden: boolean): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    review.isHidden = hidden;
    const saved = await this.reviewRepo.save(review);
    await this.recomputeAggregate(review.entityType, review.entityId);
    return saved;
  }

  async delete(reviewId: number, customerId: number): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.customerId !== customerId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    await this.reviewRepo.delete(reviewId);
    await this.recomputeAggregate(review.entityType, review.entityId);
  }

  private async recomputeAggregate(type: ReviewEntityType, id: number): Promise<void> {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.entityType = :t AND r.entityId = :id AND r.isHidden = false', { t: type, id })
      .getRawOne<{ avg: string | null; count: string }>();

    const avg = result?.avg ? Number(parseFloat(result.avg).toFixed(2)) : 0;
    const count = result?.count ? parseInt(result.count, 10) : 0;

    if (type === ReviewEntityType.BAR) {
      await this.barRepo.update(id, { rating: avg, reviews: count });
    } else if (type === ReviewEntityType.DISTILLERY) {
      await this.distilleryRepo.update(id, { reviews: count });
      // Distillery entity may or may not have a rating column; skip if absent.
    } else {
      await this.eventRepo.update(id, { reviews: count } as any);
    }
  }

  private truncate(s: string, n: number): string {
    return s.length > n ? s.slice(0, n) + '…' : s;
  }
}
