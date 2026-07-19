import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Claim, ClaimStatus } from './entities/claim.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { ReviewEntityType } from '../reviews/entities/review.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../stripe/entities/notification.entity';

const VENDOR_ROLES = [
  UserRole.BAR,
  UserRole.DISTILLERY,
  UserRole.TOUR_OPERATOR,
  UserRole.EVENT_HOST,
];

interface SubmitClaimDto {
  entityType: ReviewEntityType;
  entityId: number;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  message?: string;
}

@Injectable()
export class ClaimsService {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    @InjectRepository(Claim) private claimRepo: Repository<Claim>,
    @InjectRepository(Bar) private barRepo: Repository<Bar>,
    @InjectRepository(Distillery) private distilleryRepo: Repository<Distillery>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(User) private userRepo: Repository<User>,
    private notificationsService: NotificationsService,
    private dataSource: DataSource,
  ) {}

  private repoFor(type: ReviewEntityType): Repository<Bar | Distillery | Event> {
    if (type === ReviewEntityType.BAR) return this.barRepo as any;
    if (type === ReviewEntityType.DISTILLERY) return this.distilleryRepo as any;
    return this.eventRepo as any;
  }

  /** The entity class, for grabbing a transactional/locked repository. */
  private entityClass(type: ReviewEntityType) {
    if (type === ReviewEntityType.BAR) return Bar;
    if (type === ReviewEntityType.DISTILLERY) return Distillery;
    return Event;
  }

  private async getListing(type: ReviewEntityType, id: number) {
    const listing = await this.repoFor(type).findOne({ where: { id } as any });
    if (!listing) throw new NotFoundException(`${type} not found`);
    return listing;
  }

  async submit(dto: SubmitClaimDto): Promise<Claim> {
    const listing: any = await this.getListing(dto.entityType, dto.entityId);

    // You can't claim a listing someone already owns — that's a dispute, not a
    // claim, and it goes through support, not this form.
    if (listing.userId) {
      throw new ConflictException(
        'This listing already has an owner. If you believe that\'s a mistake, contact us.',
      );
    }

    const pending = await this.claimRepo.count({
      where: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        claimantEmail: dto.claimantEmail,
        status: ClaimStatus.PENDING,
      },
    });
    if (pending > 0) {
      throw new ConflictException("You've already got a claim pending on this listing.");
    }

    const claim = await this.claimRepo.save(
      this.claimRepo.create({
        entityType: dto.entityType,
        entityId: dto.entityId,
        claimantName: dto.claimantName,
        claimantEmail: dto.claimantEmail,
        claimantPhone: dto.claimantPhone,
        message: dto.message,
        status: ClaimStatus.PENDING,
      }),
    );

    // Tell the admins there's something to review.
    const superAdmins = await this.userRepo.find({ where: { role: UserRole.SUPER_ADMIN } });
    await Promise.all(
      superAdmins.map((sa) =>
        this.notificationsService
          .create({
            userId: sa.id,
            type: NotificationType.GENERIC,
            title: 'New listing claim',
            message: `${dto.claimantName} wants to claim ${listing.name}.`,
            metadata: { claimId: claim.id, entityType: dto.entityType, entityId: dto.entityId },
          })
          .catch(() => undefined),
      ),
    );

    return claim;
  }

  async listForAdmin(status?: ClaimStatus): Promise<Claim[]> {
    const where = status ? { status } : {};
    return this.claimRepo.find({ where, order: { createdAt: 'DESC' }, take: 200 });
  }

  /** The listing a claim is about, so the admin can see what they're approving. */
  async withListing(claim: Claim) {
    const listing: any = await this.repoFor(claim.entityType)
      .findOne({ where: { id: claim.entityId } as any })
      .catch(() => null);
    return {
      ...claim,
      listing: listing ? { id: listing.id, name: listing.name, userId: listing.userId } : null,
    };
  }

  async listForAdminWithListings(status?: ClaimStatus) {
    const claims = await this.listForAdmin(status);
    return Promise.all(claims.map((c) => this.withListing(c)));
  }

  /**
   * Approve a claim and hand the listing over.
   *
   * The claimant must already have an operator account matching the email they
   * claimed with — assigning a listing to an account that can't log in as an
   * operator would grant access to nobody. When there's no such account, the
   * admin is told to invite them first (the existing vendor-invite flow), then
   * approve. This is deliberate: ownership is only ever granted to a real,
   * verifiable operator login.
   */
  async approve(claimId: number, reviewerUserId: number): Promise<Claim> {
    const claim = await this.claimRepo.findOne({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestException('This claim has already been decided.');
    }

    const operator = await this.userRepo.findOne({
      where: { email: claim.claimantEmail },
    });
    if (!operator || !VENDOR_ROLES.includes(operator.role)) {
      throw new BadRequestException(
        `No operator account for ${claim.claimantEmail}. Invite them as a vendor first, then approve this claim.`,
      );
    }

    // Hand over ownership under a row lock on the listing. Two admins approving
    // two different claims on the same unclaimed listing at once would otherwise
    // both see it as unowned and both "win" — the listing ends up owned by one
    // while the other claimant is told it's theirs. The lock serialises them: the
    // second approval waits, then sees an owner and is refused.
    const listingCls = this.entityClass(claim.entityType);
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(listingCls);
      const listing: any = await repo
        .createQueryBuilder('l')
        .setLock('pessimistic_write')
        .where('l.id = :id', { id: claim.entityId })
        .getOne();
      if (!listing) throw new NotFoundException(`${claim.entityType} not found`);
      if (listing.userId) {
        throw new ConflictException('This listing has been assigned an owner since the claim was made.');
      }

      listing.userId = operator.id;
      await repo.save(listing);

      claim.status = ClaimStatus.APPROVED;
      claim.reviewedByUserId = reviewerUserId;
      claim.reviewedAt = new Date();
      await manager.getRepository(Claim).save(claim);
    });

    const listing: any = await this.getListing(claim.entityType, claim.entityId);

    this.notificationsService
      .create({
        userId: operator.id,
        type: NotificationType.GENERIC,
        title: 'Your claim was approved',
        message: `${listing.name} is now yours to manage.`,
        metadata: { claimId: claim.id, entityType: claim.entityType, entityId: claim.entityId },
      })
      .catch(() => undefined);

    this.logger.log(`Claim ${claim.id} approved: ${listing.name} -> user ${operator.id}`);
    return claim;
  }

  async reject(claimId: number, reviewerUserId: number, note?: string): Promise<Claim> {
    const claim = await this.claimRepo.findOne({ where: { id: claimId } });
    if (!claim) throw new NotFoundException('Claim not found');
    if (claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestException('This claim has already been decided.');
    }
    claim.status = ClaimStatus.REJECTED;
    claim.reviewedByUserId = reviewerUserId;
    claim.reviewNote = note;
    claim.reviewedAt = new Date();
    return this.claimRepo.save(claim);
  }
}
