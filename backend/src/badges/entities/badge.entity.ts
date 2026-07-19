import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewEntityType } from '../../reviews/entities/review.entity';

export enum BadgeType {
  /** Recent booking + review activity, over a 30-day window. */
  TRENDING = 'trending',
  /** Most reviews, past a threshold. */
  MOST_REVIEWED = 'most_reviewed',
  /** Highest rated in its city, with enough reviews to mean it. */
  TOP_RATED_IN_CITY = 'top_rated_in_city',
  /** High rating and high volume together — loved, not just liked once. */
  COMMUNITY_FAVOURITE = 'community_favourite',
}

/**
 * An earned badge on a listing.
 *
 * The whole point is that these are computed from real activity and can't be
 * bought or handed out — so there is deliberately no "awardedBy" field and no
 * write path from an operator. The recompute job (BadgeService) is the only
 * thing that creates or removes these rows; if a listing's numbers fall, its
 * next recompute simply doesn't re-award, and the badge is gone.
 *
 * One row per (entityType, entityId, type). "Top rated in Sydney" and "Top rated
 * in Hobart" never collide because a listing is in one city.
 */
@Entity('badges')
@Index(['entityType', 'entityId'])
@Index(['entityType', 'entityId', 'type'], { unique: true })
export class Badge {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ReviewEntityType })
  entityType: ReviewEntityType;

  @Column()
  entityId: number;

  @Column({ type: 'enum', enum: BadgeType })
  type: BadgeType;

  /**
   * Extra context the label needs — e.g. { city: 'Sydney' } for TOP_RATED_IN_CITY.
   * Null for badges that don't need any.
   */
  @Column({ type: 'json', nullable: true })
  context: Record<string, any>;

  /**
   * When this badge lapses if not renewed.
   *
   * The recompute rebuilds the whole set, so a listing that stops qualifying
   * loses the badge on the next run regardless of this date. `expiresAt` is a
   * belt-and-braces backstop and honest display ("awarded this month") — a badge
   * past its expiry is treated as gone even if the job hasn't run.
   */
  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
