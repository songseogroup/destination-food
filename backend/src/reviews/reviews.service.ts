import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { In, IsNull, MoreThan, Not, Repository } from 'typeorm';
import { Review, ReviewEntityType, ReviewFlagReason, ReviewStatus } from './entities/review.entity';
import { ReviewReport, ReviewReportReason } from './entities/review-report.entity';
import { VerifiedVisit } from './entities/verified-visit.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Customer } from '../customers/entities/customer.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
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
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(VerifiedVisit) private verifiedVisitRepo: Repository<VerifiedVisit>,
    @InjectRepository(ReviewReport) private reportRepo: Repository<ReviewReport>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
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

  /** The order column that points at this kind of listing. */
  private orderKeyFor(type: ReviewEntityType): 'barId' | 'distilleryId' | 'eventId' {
    if (type === ReviewEntityType.BAR) return 'barId';
    if (type === ReviewEntityType.DISTILLERY) return 'distilleryId';
    return 'eventId';
  }

  /**
   * Only people who actually went may review.
   *
   * Anyone with an account could previously rate anything, which makes the
   * ratings — and the badges and rankings built on them — worth nothing: a
   * competitor could bury a venue, an owner could inflate their own. So a review
   * needs either a real booking through us, or an admin who has vouched for the
   * visit (see VerifiedVisit).
   *
   * CONFIRMED counts, not just COMPLETED: a no-show still had a real booking and
   * the client's rules explicitly let them review afterwards. PENDING and
   * CANCELLED do not — an unpaid, unconfirmed booking is free to create.
   */
  private async assertMayReview(customerId: number, dto: CreateReviewDto): Promise<void> {
    const booked = await this.orderRepo.count({
      where: {
        customerId,
        [this.orderKeyFor(dto.entityType)]: dto.entityId,
        status: In([OrderStatus.CONFIRMED, OrderStatus.COMPLETED]),
      } as any,
    });
    if (booked > 0) return;

    const vouched = await this.verifiedVisitRepo.count({
      where: { customerId, entityType: dto.entityType, entityId: dto.entityId },
    });
    if (vouched > 0) return;

    throw new ForbiddenException(
      "You can only review experiences you've booked through Destination Whisky. If you visited another way, ask us to verify your visit.",
    );
  }

  /**
   * A one-way fingerprint of where a review came from.
   *
   * Salted, so the table can't be reversed with a rainbow table of every IPv4
   * address — which is a real attack against a bare hash, since the whole space
   * is only four billion entries. The salt is a dedicated secret where one is
   * configured; falling back to JWT_SECRET keeps the check working out of the
   * box rather than silently doing nothing.
   */
  private hashOrigin(ip?: string): string | null {
    if (!ip) return null;
    const salt =
      process.env.FRAUD_HASH_SECRET || process.env.JWT_SECRET || 'destination-whisky';
    return createHash('sha256').update(`${salt}:review-origin:${ip}`).digest('hex');
  }

  /**
   * Does this review look like part of a ring?
   *
   * Two signals, both from the client's spec:
   *
   *  - several reviews from one connection in a short window. One person with
   *    three accounts posting from their laptop looks exactly like this.
   *  - a burst of five-star reviews on one listing. Organic praise trickles;
   *    bought praise arrives all at once.
   *
   * Flagged reviews are hidden pending a moderator, not deleted — the check is
   * a heuristic and will sometimes be wrong (a real tasting group posting from
   * one venue's wifi would trip the first one). A person decides.
   */
  private async detectFraud(
    dto: CreateReviewDto,
    originHash: string | null,
  ): Promise<ReviewFlagReason | null> {
    const SIX_HOURS_AGO = new Date(Date.now() - 6 * 60 * 60 * 1000);

    if (originHash) {
      const sameOrigin = await this.reviewRepo.count({
        where: { originHash, createdAt: MoreThan(SIX_HOURS_AGO) },
      });
      // Two is a couple sharing a connection. Three in six hours is a pattern.
      if (sameOrigin >= 2) return ReviewFlagReason.SAME_ORIGIN_BURST;
    }

    if (dto.rating === 5) {
      const recentFiveStars = await this.reviewRepo.count({
        where: {
          entityType: dto.entityType,
          entityId: dto.entityId,
          rating: 5,
          createdAt: MoreThan(SIX_HOURS_AGO),
        },
      });
      if (recentFiveStars >= 4) return ReviewFlagReason.RATING_SPIKE;
    }

    return null;
  }

  async create(customerId: number, dto: CreateReviewDto, ip?: string): Promise<Review> {
    const customer = await this.customerRepo.findOne({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const { entity, ownerUserId } = await this.getEntityAndOwner(dto.entityType, dto.entityId);

    await this.assertMayReview(customerId, dto);

    // One review per customer per listing — otherwise a single guest can stack
    // ratings and move the average on their own.
    const existing = await this.reviewRepo.count({
      where: { customerId, entityType: dto.entityType, entityId: dto.entityId },
    });
    if (existing > 0) {
      throw new BadRequestException("You've already reviewed this listing.");
    }

    const originHash = this.hashOrigin(ip);
    const flagReason = await this.detectFraud(dto, originHash);

    const review = this.reviewRepo.create({
      customerId,
      customerName: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Anonymous',
      entityType: dto.entityType,
      entityId: dto.entityId,
      rating: dto.rating,
      comment: dto.comment,
      originHash,
      flagReason,
      // A flagged review is held back until a moderator rules on it, so a ring
      // can't move a rating in the hours before anyone notices.
      status: flagReason ? ReviewStatus.PENDING : ReviewStatus.VISIBLE,
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

      // And by email — the client's minimum set includes "review published" to
      // the operator, and a reply is worth most while the visit is still recent.
      this.userRepo
        .findOne({ where: { id: ownerUserId } })
        .then((owner) => {
          if (!owner?.email) return;
          return this.emailService.sendReviewPublished(
            owner.email,
            owner.firstName || 'there',
            (entity as any).name || 'your listing',
            dto.rating,
            dto.comment || '',
            saved.customerName,
          );
        })
        .catch(() => undefined);
    }

    return saved;
  }

  async listPublic(entityType: ReviewEntityType, entityId: number, limit = 50, offset = 0) {
    const [items, total] = await this.reviewRepo.findAndCount({
      where: { entityType, entityId, status: ReviewStatus.VISIBLE },
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

  /**
   * Someone flagging a review.
   *
   * The review is pulled from public view straight away rather than after a
   * moderator gets to it. A review that stays up for two days while we decide is
   * two days of a venue being libelled, or of a fake five-star doing its work —
   * and putting it back costs nothing if the report turns out to be nonsense.
   *
   * That does mean reports are a weapon: an operator could report every honest
   * poor review to bury it. Which is why every report is kept with its author
   * (see ReviewReport) — the pattern shows up in the queue.
   */
  async report(
    reviewId: number,
    dto: { reason: ReviewReportReason; note?: string },
    reporter: { customerId?: number; userId?: number },
  ) {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    // Don't re-open a decision a moderator already made.
    if (review.status === ReviewStatus.REMOVED) {
      return { ok: true, alreadyRemoved: true };
    }

    const already = reporter.customerId
      ? await this.reportRepo.count({
          where: { reviewId, reporterCustomerId: reporter.customerId },
        })
      : 0;
    if (already > 0) {
      throw new BadRequestException("You've already reported this review.");
    }

    await this.reportRepo.save(
      this.reportRepo.create({
        reviewId,
        reason: dto.reason,
        note: dto.note,
        reporterCustomerId: reporter.customerId ?? null,
        reporterUserId: reporter.userId ?? null,
      }),
    );

    if (review.status === ReviewStatus.VISIBLE) {
      review.status = ReviewStatus.PENDING;
      review.flagReason = ReviewFlagReason.REPORTED;
      await this.reviewRepo.save(review);
      await this.recomputeAggregate(review.entityType, review.entityId);
    }

    return { ok: true };
  }

  /** The reports behind a flagged review, for the moderator deciding on it. */
  async listReports(reviewId?: number) {
    const where: any = {};
    if (reviewId) where.reviewId = reviewId;
    return this.reportRepo.find({ where, order: { createdAt: 'DESC' }, take: 200 });
  }

  async listVerifiedVisits() {
    return this.verifiedVisitRepo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  async grantVerifiedVisit(
    dto: { customerId: number; entityType: ReviewEntityType; entityId: number; note?: string },
    grantedByUserId: number,
  ) {
    const customer = await this.customerRepo.findOne({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');
    // Throws if the listing doesn't exist, so a typo can't create a dangling grant.
    await this.getEntityAndOwner(dto.entityType, dto.entityId);

    const existing = await this.verifiedVisitRepo.findOne({
      where: { customerId: dto.customerId, entityType: dto.entityType, entityId: dto.entityId },
    });
    if (existing) return existing;

    return this.verifiedVisitRepo.save(
      this.verifiedVisitRepo.create({ ...dto, grantedByUserId }),
    );
  }

  async revokeVerifiedVisit(id: number) {
    const row = await this.verifiedVisitRepo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Verified visit not found');
    await this.verifiedVisitRepo.remove(row);
    return { ok: true };
  }

  async listAllForAdmin(filter: { status?: ReviewStatus; flaggedOnly?: boolean }) {
    const where: any = {};
    if (filter.status) where.status = filter.status;
    // The moderation queue: everything the fraud checks or a report pulled out,
    // which is what a moderator opens this page to deal with.
    if (filter.flaggedOnly) where.flagReason = Not(IsNull());
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

  /**
   * A moderator's ruling.
   *
   * Approving clears the flag as well as the status — otherwise the review would
   * sit in the flagged queue forever, and the next moderator would rule on it
   * again. Any reports against it are marked resolved for the same reason.
   */
  async setStatus(reviewId: number, status: ReviewStatus): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    review.status = status;
    if (status === ReviewStatus.VISIBLE) {
      review.flagReason = null;
    }
    const saved = await this.reviewRepo.save(review);

    await this.reportRepo.update({ reviewId, resolved: false }, { resolved: true });
    // Hiding or restoring a review changes the listing's average, so recompute.
    await this.recomputeAggregate(review.entityType, review.entityId);
    return saved;
  }

  async delete(reviewId: number, customerId: number): Promise<void> {
    const review = await this.reviewRepo.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.customerId !== customerId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
    // Clear any reports first — there's no foreign key doing it, so they'd
    // otherwise linger in the moderation queue pointing at a review that's gone.
    await this.reportRepo.delete({ reviewId });
    await this.reviewRepo.delete(reviewId);
    await this.recomputeAggregate(review.entityType, review.entityId);
  }

  private async recomputeAggregate(type: ReviewEntityType, id: number): Promise<void> {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'count')
      .where('r.entityType = :t AND r.entityId = :id AND r.status = :visible', {
        t: type,
        id,
        visible: ReviewStatus.VISIBLE,
      })
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
