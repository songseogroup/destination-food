import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AnalyticsEventType {
  VIEW = 'view',
  CLICK = 'click',
}

/**
 * What was viewed/clicked. 'homepage' has no entityId; 'ad' uses the banner id.
 * 'event' covers both events and tours (tours are events with a tour category).
 */
export enum AnalyticsEntityType {
  BAR = 'bar',
  DISTILLERY = 'distillery',
  EVENT = 'event',
  BLOG = 'blog',
  HOMEPAGE = 'homepage',
  AD = 'ad',
}

/**
 * A single page view or click, stored as an event rather than a counter.
 *
 * The platform previously had only counters (Banner.impressions/clicks,
 * Blog.views) — an int that goes up. Counters can show a total but can never
 * answer "views over the last 30 days" or "views per day", which is exactly
 * what an owner needs to share stats about their listing. Storing one row per
 * event makes those time-series queries possible; aggregation happens at read
 * time.
 *
 * Rows are cheap and disposable — this table can be periodically rolled up or
 * pruned without affecting anything else.
 */
@Entity('analytics_events')
// The dashboard's hot query: events for one entity within a date range.
@Index(['entityType', 'entityId', 'createdAt'])
@Index(['createdAt'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: AnalyticsEventType, default: AnalyticsEventType.VIEW })
  eventType: AnalyticsEventType;

  @Column({ type: 'enum', enum: AnalyticsEntityType })
  entityType: AnalyticsEntityType;

  /** Null for homepage; the listing/blog/banner id otherwise. */
  @Column({ type: 'int', nullable: true })
  entityId: number | null;

  /**
   * Anonymous per-visitor id from the client (a random id kept in
   * localStorage). Not a login, not PII — only used to distinguish unique
   * visitors from raw hits. Nullable so a blocked/first-hit client still counts.
   */
  @Column({ nullable: true })
  sessionId: string;

  /** The path the event fired on, e.g. /bars/12. */
  @Column({ nullable: true })
  path: string;

  /** document.referrer, when present. */
  @Column({ nullable: true })
  referrer: string;

  @CreateDateColumn()
  @Index()
  createdAt: Date;
}
