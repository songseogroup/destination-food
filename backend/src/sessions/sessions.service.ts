import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, MoreThan, Repository } from 'typeorm';
import { Session } from './entities/session.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { ReviewEntityType } from '../reviews/entities/review.entity';
import { UserRole } from '../users/entities/user.entity';
import { isStaffRole } from '../common/listing-visibility';

type Kind = ReviewEntityType;

interface UpsertSessionDto {
  entityType: Kind;
  entityId: number;
  startsAt: string;
  durationMinutes?: number;
  capacity: number;
  priceOverride?: number;
  isActive?: boolean;
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session) private sessionRepo: Repository<Session>,
    @InjectRepository(Bar) private barRepo: Repository<Bar>,
    @InjectRepository(Distillery) private distilleryRepo: Repository<Distillery>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    private dataSource: DataSource,
  ) {}

  private repoFor(type: Kind): Repository<Bar | Distillery | Event> {
    if (type === ReviewEntityType.BAR) return this.barRepo as any;
    if (type === ReviewEntityType.DISTILLERY) return this.distilleryRepo as any;
    return this.eventRepo as any;
  }

  /** The listing a session belongs to, and who owns it. */
  private async getListing(type: Kind, id: number): Promise<{ name: string; userId: number | null }> {
    const listing: any = await this.repoFor(type).findOne({ where: { id } as any });
    if (!listing) throw new NotFoundException(`${type} not found`);
    return { name: listing.name, userId: listing.userId ?? null };
  }

  /** An operator may only touch sessions on a listing they own; staff, any. */
  private async assertMayManage(type: Kind, id: number, userId?: number, role?: UserRole) {
    // Always confirm the listing exists — even for staff. Otherwise a session
    // could be opened on a listing id that isn't there, an orphan nothing can
    // ever surface or book.
    const { userId: ownerId } = await this.getListing(type, id);
    if (isStaffRole(role)) return;
    if (!ownerId || ownerId !== userId) {
      throw new ForbiddenException('You can only manage sessions on your own listings.');
    }
  }

  async create(dto: UpsertSessionDto, userId?: number, role?: UserRole): Promise<Session> {
    await this.assertMayManage(dto.entityType, dto.entityId, userId, role);
    if (dto.capacity < 1) throw new BadRequestException('Capacity must be at least 1.');

    const session = this.sessionRepo.create({
      entityType: dto.entityType,
      entityId: dto.entityId,
      startsAt: new Date(dto.startsAt),
      durationMinutes: dto.durationMinutes ?? null,
      capacity: dto.capacity,
      priceOverride: dto.priceOverride ?? null,
      isActive: dto.isActive ?? true,
      bookedCount: 0,
    });
    return this.sessionRepo.save(session);
  }

  async update(
    id: number,
    dto: Partial<UpsertSessionDto>,
    userId?: number,
    role?: UserRole,
  ): Promise<Session> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    await this.assertMayManage(session.entityType, session.entityId, userId, role);

    // Capacity can be raised freely, but it can't be dropped below what's
    // already booked — those guests have a confirmed place.
    if (dto.capacity != null) {
      if (dto.capacity < 1) throw new BadRequestException('Capacity must be at least 1.');
      if (dto.capacity < session.bookedCount) {
        throw new BadRequestException(
          `Capacity can't be below the ${session.bookedCount} already booked.`,
        );
      }
      session.capacity = dto.capacity;
    }
    if (dto.startsAt != null) session.startsAt = new Date(dto.startsAt);
    if (dto.durationMinutes !== undefined) session.durationMinutes = dto.durationMinutes ?? null;
    if (dto.priceOverride !== undefined) session.priceOverride = dto.priceOverride ?? null;
    if (dto.isActive != null) session.isActive = dto.isActive;

    return this.sessionRepo.save(session);
  }

  async remove(id: number, userId?: number, role?: UserRole): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    await this.assertMayManage(session.entityType, session.entityId, userId, role);

    // Refuse to delete a slot people have booked — cancel their bookings first.
    // Silently removing it would strand real reservations.
    if (session.bookedCount > 0) {
      throw new ConflictException(
        'This session has bookings. Cancel them before deleting it, or just deactivate it.',
      );
    }
    await this.sessionRepo.remove(session);
  }

  /** Every session for a listing — the operator's management view. */
  async listForEntity(type: Kind, id: number): Promise<Session[]> {
    return this.sessionRepo.find({
      where: { entityType: type, entityId: id },
      order: { startsAt: 'ASC' },
    });
  }

  /** Upcoming, active, still-has-room sessions — what a customer can book. */
  async listBookable(type: Kind, id: number): Promise<Session[]> {
    const sessions = await this.sessionRepo.find({
      where: { entityType: type, entityId: id, isActive: true, startsAt: MoreThan(new Date()) },
      order: { startsAt: 'ASC' },
    });
    return sessions.filter((s) => s.bookedCount < s.capacity);
  }

  /** Remaining seats, so a caller can show "3 spots left" without the maths. */
  remaining(session: Session): number {
    return Math.max(0, session.capacity - session.bookedCount);
  }

  /**
   * Take `guests` seats on a session, or fail if there aren't that many.
   *
   * This is the one place overselling could happen: two people booking the last
   * seats at the same time would both read "room for 2" and both succeed. So the
   * check and the increment happen under a row lock (SELECT … FOR UPDATE) inside
   * a transaction — the second booking waits for the first to commit, then sees
   * the true remaining count.
   *
   * When a caller passes its own transactional manager (the order-creation
   * transaction), the seats and the order commit together. Called on its own it
   * opens its own transaction — a pessimistic lock requires one, and without it
   * the whole point (blocking a concurrent booking) is lost.
   */
  async reserve(
    sessionId: number,
    guests: number,
    manager?: EntityManager,
    expected?: { entityType: Kind; entityId: number },
  ): Promise<Session> {
    if (!Number.isInteger(guests) || guests < 1) {
      throw new BadRequestException('Number of guests must be a positive whole number.');
    }
    const run = async (m: EntityManager): Promise<Session> => {
      const repo = m.getRepository(Session);
      const session = await repo
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id', { id: sessionId })
        .getOne();

      if (!session) throw new NotFoundException('Session not found');
      // The session must belong to the listing being booked. Without this a
      // booking on one listing could take (and exhaust) capacity on an unrelated
      // listing's session just by passing its id.
      if (expected && (session.entityType !== expected.entityType || session.entityId !== expected.entityId)) {
        throw new BadRequestException("That session doesn't belong to this listing.");
      }
      if (!session.isActive) throw new ConflictException('This session is no longer open for booking.');
      if (session.startsAt <= new Date()) {
        throw new ConflictException('This session has already started.');
      }

      const remaining = session.capacity - session.bookedCount;
      if (guests > remaining) {
        throw new ConflictException(
          remaining <= 0
            ? 'This session is fully booked.'
            : `Only ${remaining} spot${remaining === 1 ? '' : 's'} left on this session.`,
        );
      }

      session.bookedCount += guests;
      return repo.save(session);
    };
    return manager ? run(manager) : this.dataSource.transaction(run);
  }

  /**
   * Give seats back when a booking is cancelled. Never drops below zero.
   *
   * Same transaction rule as reserve(): the pessimistic lock needs one, so this
   * opens its own when a caller doesn't supply a transactional manager.
   */
  async release(sessionId: number, guests: number, manager?: EntityManager): Promise<void> {
    const run = async (m: EntityManager): Promise<void> => {
      const repo = m.getRepository(Session);
      const session = await repo
        .createQueryBuilder('s')
        .setLock('pessimistic_write')
        .where('s.id = :id', { id: sessionId })
        .getOne();
      if (!session) return; // Session gone — nothing to release.
      session.bookedCount = Math.max(0, session.bookedCount - guests);
      await repo.save(session);
    };
    return manager ? run(manager) : this.dataSource.transaction(run);
  }
}
