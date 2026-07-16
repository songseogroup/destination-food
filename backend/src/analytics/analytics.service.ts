import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import {
  AnalyticsEntityType,
  AnalyticsEvent,
  AnalyticsEventType,
} from './entities/analytics-event.entity';
import { TrackEventDto } from './dto/track-event.dto';
import { Bar } from '../bars/entities/bar.entity';
import { Distillery } from '../distilleries/entities/distillery.entity';
import { Event } from '../events/entities/event.entity';
import { Blog } from '../blogs/entities/blog.entity';
import { UserRole } from '../users/entities/user.entity';

interface RequestUser {
  id: number;
  role: string;
}

/** The listing entity types an owner role is allowed to see stats for. */
const OWNER_SCOPE: Record<string, AnalyticsEntityType | undefined> = {
  [UserRole.BAR]: AnalyticsEntityType.BAR,
  [UserRole.DISTILLERY]: AnalyticsEntityType.DISTILLERY,
  [UserRole.EVENT_HOST]: AnalyticsEntityType.EVENT,
  [UserRole.TOUR_OPERATOR]: AnalyticsEntityType.EVENT,
};

const PLATFORM_ROLES = new Set<string>([UserRole.SUPER_ADMIN, UserRole.ADMIN]);

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly events: Repository<AnalyticsEvent>,
    @InjectRepository(Bar) private readonly bars: Repository<Bar>,
    @InjectRepository(Distillery) private readonly distilleries: Repository<Distillery>,
    @InjectRepository(Event) private readonly eventsRepo: Repository<Event>,
    @InjectRepository(Blog) private readonly blogs: Repository<Blog>,
  ) {}

  /** Record one event. Public — the caller is an anonymous site visitor. */
  async track(dto: TrackEventDto): Promise<{ ok: true }> {
    const event = this.events.create({
      eventType: dto.eventType ?? AnalyticsEventType.VIEW,
      entityType: dto.entityType,
      entityId: dto.entityId ?? null,
      sessionId: dto.sessionId?.slice(0, 64) ?? null,
      path: dto.path?.slice(0, 512) ?? null,
      referrer: dto.referrer?.slice(0, 512) ?? null,
    });
    await this.events.save(event);
    return { ok: true };
  }

  /**
   * Dashboard summary, scoped to the caller.
   *
   * Platform roles (super_admin/admin) see everything. An owner sees only their
   * own listings' stats — so this is also the "share basic stats with an
   * event/tour organiser" surface, safely.
   */
  async getSummary(user: RequestUser, days = 30) {
    const since = this.daysAgo(days);
    const isPlatform = PLATFORM_ROLES.has(user.role);

    // Resolve the id set this user is allowed to see, per entity type.
    const owned = isPlatform ? null : await this.ownedIds(user);

    // --- headline totals ---
    const totals = await this.countsByType(since, owned);

    // --- per-listing breakdown (top listings by views) ---
    const perType: Record<string, any[]> = {};
    const typesToReport = isPlatform
      ? [AnalyticsEntityType.BAR, AnalyticsEntityType.DISTILLERY, AnalyticsEntityType.EVENT, AnalyticsEntityType.BLOG]
      : [OWNER_SCOPE[user.role]].filter(Boolean) as AnalyticsEntityType[];

    for (const type of typesToReport) {
      const ids = owned ? owned[type] ?? [] : undefined;
      if (owned && (!ids || ids.length === 0)) {
        perType[type] = [];
        continue;
      }
      perType[type] = await this.topEntities(type, since, ids);
    }

    // --- daily time series (all in-scope views) ---
    const timeseries = await this.dailyViews(since, days, owned);

    return {
      rangeDays: days,
      scope: isPlatform ? 'platform' : 'owner',
      totals, // { views, clicks, byType: { bar: {views,clicks}, ... } }
      topListings: perType, // { bar: [{id,name,views,clicks}], ... }
      timeseries, // [{ date: 'YYYY-MM-DD', views }]
    };
  }

  /** Time series + totals for a single listing. Owners must own it. */
  async getEntityStats(entityType: AnalyticsEntityType, entityId: number, user: RequestUser, days = 30) {
    if (!PLATFORM_ROLES.has(user.role)) {
      const owned = await this.ownedIds(user);
      const ids = owned[entityType] ?? [];
      if (!ids.includes(entityId)) {
        throw new ForbiddenException('You can only view stats for your own listings.');
      }
    }

    const since = this.daysAgo(days);
    const rows = await this.events
      .createQueryBuilder('e')
      .select("to_char(date_trunc('day', e.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(CASE WHEN e.eventType = :view THEN 1 ELSE 0 END)', 'views')
      .addSelect('SUM(CASE WHEN e.eventType = :click THEN 1 ELSE 0 END)', 'clicks')
      .where('e.entityType = :entityType', { entityType })
      .andWhere('e.entityId = :entityId', { entityId })
      .andWhere('e.createdAt >= :since', { since })
      .setParameters({ view: AnalyticsEventType.VIEW, click: AnalyticsEventType.CLICK })
      .groupBy("date_trunc('day', e.createdAt)")
      .orderBy("date_trunc('day', e.createdAt)", 'ASC')
      .getRawMany();

    const totalViews = rows.reduce((s, r) => s + Number(r.views), 0);
    const totalClicks = rows.reduce((s, r) => s + Number(r.clicks), 0);
    const uniqueVisitors = await this.events
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.sessionId)', 'n')
      .where('e.entityType = :entityType', { entityType })
      .andWhere('e.entityId = :entityId', { entityId })
      .andWhere('e.createdAt >= :since', { since })
      .andWhere('e.sessionId IS NOT NULL')
      .getRawOne();

    return {
      entityType,
      entityId,
      rangeDays: days,
      totals: { views: totalViews, clicks: totalClicks, uniqueVisitors: Number(uniqueVisitors?.n ?? 0) },
      timeseries: this.fillDays(rows, days),
    };
  }

  // ---------------------------------------------------------------------------

  /** Owned listing ids per entity type for an owner user. */
  private async ownedIds(user: RequestUser): Promise<Record<string, number[]>> {
    const scope = OWNER_SCOPE[user.role];
    const out: Record<string, number[]> = {};
    if (scope === AnalyticsEntityType.BAR) {
      out.bar = (await this.bars.find({ where: { userId: user.id }, select: ['id'] })).map((b) => b.id);
    } else if (scope === AnalyticsEntityType.DISTILLERY) {
      out.distillery = (await this.distilleries.find({ where: { userId: user.id }, select: ['id'] })).map((d) => d.id);
    } else if (scope === AnalyticsEntityType.EVENT) {
      out.event = (await this.eventsRepo.find({ where: { userId: user.id }, select: ['id'] })).map((e) => e.id);
    }
    return out;
  }

  private async countsByType(since: Date, owned: Record<string, number[]> | null) {
    const qb = this.events
      .createQueryBuilder('e')
      .select('e.entityType', 'entityType')
      .addSelect('SUM(CASE WHEN e.eventType = :view THEN 1 ELSE 0 END)', 'views')
      .addSelect('SUM(CASE WHEN e.eventType = :click THEN 1 ELSE 0 END)', 'clicks')
      .where('e.createdAt >= :since', { since })
      .setParameters({ view: AnalyticsEventType.VIEW, click: AnalyticsEventType.CLICK })
      .groupBy('e.entityType');

    this.applyOwnerScope(qb, owned);

    const rows = await qb.getRawMany();
    const byType: Record<string, { views: number; clicks: number }> = {};
    let views = 0;
    let clicks = 0;
    for (const r of rows) {
      const v = Number(r.views);
      const c = Number(r.clicks);
      byType[r.entityType] = { views: v, clicks: c };
      views += v;
      clicks += c;
    }
    return { views, clicks, byType };
  }

  private async topEntities(entityType: AnalyticsEntityType, since: Date, ids?: number[]) {
    if (ids && ids.length === 0) return [];
    const qb = this.events
      .createQueryBuilder('e')
      .select('e.entityId', 'entityId')
      .addSelect('SUM(CASE WHEN e.eventType = :view THEN 1 ELSE 0 END)', 'views')
      .addSelect('SUM(CASE WHEN e.eventType = :click THEN 1 ELSE 0 END)', 'clicks')
      .where('e.entityType = :entityType', { entityType })
      .andWhere('e.createdAt >= :since', { since })
      .andWhere('e.entityId IS NOT NULL')
      .setParameters({ view: AnalyticsEventType.VIEW, click: AnalyticsEventType.CLICK })
      .groupBy('e.entityId')
      .orderBy('views', 'DESC')
      .limit(10);
    if (ids) qb.andWhere('e.entityId IN (:...ids)', { ids });

    const rows = await qb.getRawMany();
    const entityIds = rows.map((r) => Number(r.entityId));
    const names = await this.namesFor(entityType, entityIds);

    return rows.map((r) => ({
      id: Number(r.entityId),
      name: names[Number(r.entityId)] ?? `#${r.entityId}`,
      views: Number(r.views),
      clicks: Number(r.clicks),
    }));
  }

  private async dailyViews(since: Date, days: number, owned: Record<string, number[]> | null) {
    const qb = this.events
      .createQueryBuilder('e')
      .select("to_char(date_trunc('day', e.createdAt), 'YYYY-MM-DD')", 'date')
      .addSelect('SUM(CASE WHEN e.eventType = :view THEN 1 ELSE 0 END)', 'views')
      .addSelect('SUM(CASE WHEN e.eventType = :click THEN 1 ELSE 0 END)', 'clicks')
      .where('e.createdAt >= :since', { since })
      .setParameters({ view: AnalyticsEventType.VIEW, click: AnalyticsEventType.CLICK })
      .groupBy("date_trunc('day', e.createdAt)")
      .orderBy("date_trunc('day', e.createdAt)", 'ASC');

    this.applyOwnerScope(qb, owned);
    return this.fillDays(await qb.getRawMany(), days);
  }

  /** Restrict a query to an owner's ids across their scoped type. */
  private applyOwnerScope(qb: any, owned: Record<string, number[]> | null) {
    if (!owned) return;
    const types = Object.keys(owned);
    const allIds = types.flatMap((t) => owned[t]);
    if (allIds.length === 0) {
      // Owner has no listings — match nothing rather than everything.
      qb.andWhere('1 = 0');
      return;
    }
    qb.andWhere('e.entityType IN (:...types)', { types });
    qb.andWhere('e.entityId IN (:...allIds)', { allIds });
  }

  private async namesFor(entityType: AnalyticsEntityType, ids: number[]): Promise<Record<number, string>> {
    if (ids.length === 0) return {};
    const repo =
      entityType === AnalyticsEntityType.BAR
        ? this.bars
        : entityType === AnalyticsEntityType.DISTILLERY
          ? this.distilleries
          : entityType === AnalyticsEntityType.EVENT
            ? this.eventsRepo
            : this.blogs;
    const rows: any[] = await repo.find({ where: { id: In(ids) } as any });
    const out: Record<number, string> = {};
    for (const row of rows) out[row.id] = row.name ?? row.title ?? `#${row.id}`;
    return out;
  }

  /**
   * Fill missing days with zeros so a chart has a continuous x-axis.
   *
   * Everything is in UTC to match Postgres `date_trunc('day', …)`, which buckets
   * in the server's timezone (UTC on Supabase). Mixing a local calendar here
   * shifted the axis by a day for anyone east/west of UTC — today's events
   * landed in an off-by-one bucket.
   */
  private fillDays(rows: any[], days: number) {
    const byDate = new Map(rows.map((r) => [r.date, { views: Number(r.views), clicks: Number(r.clicks ?? 0) }]));
    const out: { date: string; views: number; clicks: number }[] = [];
    const start = this.daysAgo(days - 1);
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({ date: key, ...(byDate.get(key) ?? { views: 0, clicks: 0 }) });
    }
    return out;
  }

  /** n days ago at UTC midnight. */
  private daysAgo(n: number): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - n);
    return d;
  }
}
