import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { AnalyticsEvent } from '../analytics/entities/analytics-event.entity';

export type ListingKind = 'bar' | 'distillery' | 'event';

export interface DestinationListing {
  kind: ListingKind;
  id: number;
  name: string;
  image: string;
  location: string;
  city: string | null;
  rating: number;
  reviews: number;
  type?: string;
  priceRange?: string;
  price?: string;
  date?: string;
}

/**
 * A minimum before "top rated" means anything.
 *
 * One five-star review from the owner's cousin shouldn't outrank a venue with
 * forty reviews averaging 4.6. Anything under this is ranked by reviews instead.
 */
const MIN_REVIEWS_FOR_TOP_RATED = 3;

@Injectable()
export class DestinationsService {
  constructor(
    @InjectRepository(Bar) private barRepo: Repository<Bar>,
    @InjectRepository(Distillery) private distilleryRepo: Repository<Distillery>,
    @InjectRepository(Event) private eventRepo: Repository<Event>,
    @InjectRepository(AnalyticsEvent) private analyticsRepo: Repository<AnalyticsEvent>,
  ) {}

  /**
   * Only listings the public may see: published, and owned by an approved vendor
   * (or nobody). Mirrors the rule in applyListingVisibility — a destination page
   * must not become a back door to listings the listing pages themselves hide.
   */
  private publicOnly<T>(qb: SelectQueryBuilder<T>, alias: string): SelectQueryBuilder<T> {
    return qb
      .andWhere(`${alias}.isActive = :active`, { active: true })
      .leftJoin('users', 'owner', `owner.id = ${alias}.userId`)
      .andWhere(
        `(${alias}.userId IS NULL OR (owner.approvalStatus = :approved AND owner.isActive = :ownerActive))`,
        { approved: 'approved', ownerActive: true },
      );
  }

  /** Case- and whitespace-insensitive: "sydney" and "Sydney " are one place. */
  private whereField<T>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    field: 'city' | 'country',
    value: string,
  ) {
    return qb.where(`LOWER(TRIM(${alias}.${field})) = :val`, { val: value.trim().toLowerCase() });
  }

  private async fetchKind(
    field: 'city' | 'country',
    value: string,
  ): Promise<DestinationListing[]> {
    const bars = await this.publicOnly(
      this.whereField(this.barRepo.createQueryBuilder('bar'), 'bar', field, value),
      'bar',
    ).getMany();

    const distilleries = await this.publicOnly(
      this.whereField(this.distilleryRepo.createQueryBuilder('d'), 'd', field, value),
      'd',
    ).getMany();

    const events = await this.publicOnly(
      this.whereField(this.eventRepo.createQueryBuilder('e'), 'e', field, value),
      'e',
    ).getMany();

    return [
      ...bars.map(
        (b): DestinationListing => ({
          kind: 'bar',
          id: b.id,
          name: b.name,
          image: b.image,
          location: b.location,
          city: b.city ?? null,
          rating: Number(b.rating) || 0,
          reviews: Number(b.reviews) || 0,
          type: b.type,
          priceRange: b.priceRange,
        }),
      ),
      ...distilleries.map(
        (d): DestinationListing => ({
          kind: 'distillery',
          id: d.id,
          name: d.name,
          image: d.image,
          location: d.location,
          city: d.city ?? null,
          rating: Number(d.rating) || 0,
          reviews: Number(d.reviews) || 0,
          type: d.type,
          priceRange: d.priceRange,
        }),
      ),
      ...events.map(
        (e): DestinationListing => ({
          kind: 'event',
          id: e.id,
          name: e.name,
          image: e.image,
          location: e.location,
          city: e.city ?? null,
          rating: Number(e.rating) || 0,
          reviews: Number(e.reviews) || 0,
          type: e.type,
          price: e.price,
          date: e.date,
        }),
      ),
    ];
  }

  /**
   * Recent interest, from the last 30 days of view events.
   *
   * "Trending" has to mean something that moves — a rating barely changes month
   * to month. Views are the only recent-activity signal we record today; when
   * booking volume is available it belongs in here too.
   */
  private async recentViews(): Promise<Map<string, number>> {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const rows = await this.analyticsRepo
      .createQueryBuilder('a')
      .select('a.entityType', 'entityType')
      .addSelect('a.entityId', 'entityId')
      .addSelect('COUNT(*)', 'views')
      .where('a.createdAt >= :since', { since })
      .andWhere('a.entityId IS NOT NULL')
      .groupBy('a.entityType')
      .addGroupBy('a.entityId')
      .getRawMany();

    return new Map(rows.map((r) => [`${r.entityType}:${r.entityId}`, Number(r.views) || 0]));
  }

  private rank(listings: DestinationListing[], views: Map<string, number>) {
    const byRating = [...listings]
      .filter((l) => l.rating > 0 && l.reviews >= MIN_REVIEWS_FOR_TOP_RATED)
      .sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);

    // Not enough reviewed listings to rank honestly — show the best we have
    // rather than an empty shelf, but never let a lone 5★ pose as "top rated".
    const topRated =
      byRating.length > 0
        ? byRating
        : [...listings].filter((l) => l.rating > 0).sort((a, b) => b.rating - a.rating);

    const mostReviewed = [...listings]
      .filter((l) => l.reviews > 0)
      .sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);

    const trending = [...listings]
      .map((l) => ({ l, v: views.get(`${l.kind}:${l.id}`) || 0 }))
      .filter((x) => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .map((x) => x.l);

    return {
      topRated: topRated.slice(0, 8),
      mostReviewed: mostReviewed.slice(0, 8),
      trending: trending.slice(0, 8),
    };
  }

  async getDestination(field: 'city' | 'country', value: string) {
    const listings = await this.fetchKind(field, value);
    const views = await this.recentViews();
    const { topRated, mostReviewed, trending } = this.rank(listings, views);

    return {
      [field]: value,
      total: listings.length,
      counts: {
        bars: listings.filter((l) => l.kind === 'bar').length,
        distilleries: listings.filter((l) => l.kind === 'distillery').length,
        events: listings.filter((l) => l.kind === 'event').length,
      },
      topRated,
      mostReviewed,
      trending,
      all: listings,
    };
  }

  /** Every destination that actually has something to show, for the index page. */
  async listDestinations() {
    const pull = async (repo: Repository<any>, alias: string) =>
      this.publicOnly(repo.createQueryBuilder(alias), alias)
        .select(`${alias}.city`, 'city')
        .addSelect(`${alias}.country`, 'country')
        .addSelect('COUNT(*)', 'count')
        .andWhere(`${alias}.city IS NOT NULL`)
        .andWhere(`${alias}.city <> ''`)
        .groupBy(`${alias}.city`)
        .addGroupBy(`${alias}.country`)
        .getRawMany();

    const rows = [
      ...(await pull(this.barRepo, 'bar')),
      ...(await pull(this.distilleryRepo, 'd')),
      ...(await pull(this.eventRepo, 'e')),
    ];

    const cities = new Map<string, { city: string; country: string | null; count: number }>();
    for (const r of rows) {
      const key = String(r.city).trim().toLowerCase();
      const existing = cities.get(key);
      const count = Number(r.count) || 0;
      if (existing) {
        existing.count += count;
        existing.country = existing.country || r.country || null;
      } else {
        cities.set(key, { city: String(r.city).trim(), country: r.country || null, count });
      }
    }

    const countries = new Map<string, number>();
    for (const c of cities.values()) {
      if (!c.country) continue;
      countries.set(c.country, (countries.get(c.country) || 0) + c.count);
    }

    return {
      cities: [...cities.values()].sort((a, b) => b.count - a.count),
      countries: [...countries.entries()]
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
