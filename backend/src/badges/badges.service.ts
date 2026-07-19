import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Badge, BadgeType } from './entities/badge.entity';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Review, ReviewEntityType, ReviewStatus } from '../reviews/entities/review.entity';

type Kind = ReviewEntityType;

interface Candidate {
  entityType: Kind;
  entityId: number;
  city: string | null;
  rating: number;
  reviews: number;
}

/**
 * The thresholds a badge is earned against.
 *
 * Deliberately conservative — a badge no one can trust is worse than no badge.
 * "Top rated" needs enough reviews that one enthusiastic friend can't buy it;
 * "trending" needs real recent movement, not a single booking.
 */
const RULES = {
  MOST_REVIEWED_MIN: 10,
  TOP_RATED_MIN_REVIEWS: 5,
  TOP_RATED_MIN_RATING: 4.5,
  FAVOURITE_MIN_RATING: 4.7,
  FAVOURITE_MIN_REVIEWS: 20,
  TRENDING_MIN_ACTIVITY: 5, // bookings + new reviews in the last 30 days
  TRENDING_TOP_N: 10,
  BADGE_TTL_DAYS: 35, // a touch over a month, so a daily job never leaves a gap
};

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectRepository(Badge) private badgeRepo: Repository<Badge>,
    @InjectRepository(Bar) private barRepo: Repository<Bar>,
    @InjectRepository(Distillery) private distilleryRepo: Repository<Distillery>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
  ) {}

  private orderKey(kind: Kind): 'barId' | 'distilleryId' | 'eventId' {
    if (kind === ReviewEntityType.BAR) return 'barId';
    if (kind === ReviewEntityType.DISTILLERY) return 'distilleryId';
    return 'eventId';
  }

  private async loadCandidates(): Promise<Candidate[]> {
    const map = (rows: any[], kind: Kind): Candidate[] =>
      rows.map((r) => ({
        entityType: kind,
        entityId: r.id,
        city: r.city ?? null,
        rating: Number(r.rating) || 0,
        reviews: Number(r.reviews) || 0,
      }));

    // Only listings the public can see are eligible — a badge on a hidden or
    // unapproved listing would be meaningless, and confusing if it ever showed.
    const [bars, distilleries, events] = await Promise.all([
      this.barRepo.find({ where: { isActive: true } }),
      this.distilleryRepo.find({ where: { isActive: true } }),
      this.eventRepo.find({ where: { isActive: true } }),
    ]);

    return [
      ...map(bars, ReviewEntityType.BAR),
      ...map(distilleries, ReviewEntityType.DISTILLERY),
      ...map(events, ReviewEntityType.EVENT),
    ];
  }

  /** Bookings + new reviews per listing over the last 30 days. */
  private async recentActivity(): Promise<Map<string, number>> {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const activity = new Map<string, number>();

    // Select only the columns we count on — never the whole Order row. Loading
    // the full entity would couple this to every column existing (it broke on a
    // database missing orders.reviewRequestSentAt), and we only need the links.
    const bookings = await this.orderRepo
      .createQueryBuilder('o')
      .select(['o.barId', 'o.distilleryId', 'o.eventId'])
      .where('o.status IN (:...statuses)', {
        statuses: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED],
      })
      .andWhere('o.createdAt > :since', { since })
      .getRawMany();
    for (const o of bookings) {
      let key: string | null = null;
      if (o.o_barId) key = `${ReviewEntityType.BAR}:${o.o_barId}`;
      else if (o.o_distilleryId) key = `${ReviewEntityType.DISTILLERY}:${o.o_distilleryId}`;
      else if (o.o_eventId) key = `${ReviewEntityType.EVENT}:${o.o_eventId}`;
      if (key) activity.set(key, (activity.get(key) || 0) + 1);
    }

    const reviews = await this.reviewRepo
      .createQueryBuilder('r')
      .select(['r.entityType', 'r.entityId'])
      .where('r.status = :visible', { visible: ReviewStatus.VISIBLE })
      .andWhere('r.createdAt > :since', { since })
      .getRawMany();
    for (const r of reviews) {
      const key = `${r.r_entityType}:${r.r_entityId}`;
      activity.set(key, (activity.get(key) || 0) + 1);
    }

    return activity;
  }

  /**
   * Work out which listings earn which badges, right now.
   *
   * Pure over its inputs (no writes) so it can be reasoned about and, later,
   * tested without a database. reconcile() is what persists the result.
   */
  private award(
    candidates: Candidate[],
    activity: Map<string, number>,
  ): Array<{ c: Candidate; type: BadgeType; context: Record<string, any> | null }> {
    const out: Array<{ c: Candidate; type: BadgeType; context: Record<string, any> | null }> = [];

    // Most reviewed — a simple threshold, not a ranking. Several listings can
    // hold it; it says "lots of people have been", not "the most".
    for (const c of candidates) {
      if (c.reviews >= RULES.MOST_REVIEWED_MIN) {
        out.push({ c, type: BadgeType.MOST_REVIEWED, context: null });
      }
    }

    // Community favourite — high rating AND high volume together.
    for (const c of candidates) {
      if (c.rating >= RULES.FAVOURITE_MIN_RATING && c.reviews >= RULES.FAVOURITE_MIN_REVIEWS) {
        out.push({ c, type: BadgeType.COMMUNITY_FAVOURITE, context: null });
      }
    }

    // Top rated in a city — the single best-rated qualifying listing per city.
    const byCity = new Map<string, Candidate[]>();
    for (const c of candidates) {
      if (!c.city) continue;
      if (c.rating < RULES.TOP_RATED_MIN_RATING || c.reviews < RULES.TOP_RATED_MIN_REVIEWS) continue;
      const key = c.city.trim().toLowerCase();
      (byCity.get(key) || byCity.set(key, []).get(key)!).push(c);
    }
    for (const list of byCity.values()) {
      list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
      const winner = list[0];
      out.push({
        c: winner,
        type: BadgeType.TOP_RATED_IN_CITY,
        context: { city: winner.city },
      });
    }

    // Trending this month — the busiest listings by recent activity, past a
    // floor so a quiet month doesn't hand the badge to something with one booking.
    const trending = candidates
      .map((c) => ({ c, score: activity.get(`${c.entityType}:${c.entityId}`) || 0 }))
      .filter((x) => x.score >= RULES.TRENDING_MIN_ACTIVITY)
      .sort((a, b) => b.score - a.score)
      .slice(0, RULES.TRENDING_TOP_N);
    for (const t of trending) {
      out.push({ c: t.c, type: BadgeType.TRENDING, context: null });
    }

    return out;
  }

  /**
   * The recompute. Rebuilds the entire badge set from current numbers.
   *
   * Reconciling (not truncate-and-reinsert) so a badge a listing keeps holds its
   * original createdAt — "held since March" stays true — while badges that are
   * no longer earned are removed. This is what makes "revoked if metrics fall"
   * automatic: nothing special happens on the way down, the badge simply isn't
   * re-awarded.
   */
  async recompute(): Promise<{ awarded: number; revoked: number }> {
    const candidates = await this.loadCandidates();
    const activity = await this.recentActivity();
    const earned = this.award(candidates, activity);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + RULES.BADGE_TTL_DAYS);

    const existing = await this.badgeRepo.find();
    const existingByKey = new Map(existing.map((b) => [`${b.entityType}:${b.entityId}:${b.type}`, b]));
    const earnedKeys = new Set<string>();

    let awarded = 0;
    for (const e of earned) {
      const key = `${e.c.entityType}:${e.c.entityId}:${e.type}`;
      earnedKeys.add(key);
      const row = existingByKey.get(key);
      if (row) {
        row.context = e.context;
        row.expiresAt = expiresAt;
        await this.badgeRepo.save(row);
      } else {
        await this.badgeRepo.save(
          this.badgeRepo.create({
            entityType: e.c.entityType,
            entityId: e.c.entityId,
            type: e.type,
            context: e.context,
            expiresAt,
          }),
        );
        awarded += 1;
      }
    }

    const toRevoke = existing.filter((b) => !earnedKeys.has(`${b.entityType}:${b.entityId}:${b.type}`));
    if (toRevoke.length) {
      await this.badgeRepo.remove(toRevoke);
    }

    this.logger.log(`Badges recomputed: ${earnedKeys.size} held, ${awarded} new, ${toRevoke.length} revoked`);
    return { awarded, revoked: toRevoke.length };
  }

  /** Active badges for one listing (expired ones filtered out defensively). */
  async forEntity(entityType: Kind, entityId: number): Promise<Badge[]> {
    const badges = await this.badgeRepo.find({ where: { entityType, entityId } });
    const now = new Date();
    return badges.filter((b) => b.expiresAt > now);
  }

  /** Every active badge, for decorating listing cards in one fetch. */
  async allActive(): Promise<Badge[]> {
    return this.badgeRepo.find({ where: { expiresAt: MoreThan(new Date()) } });
  }
}
