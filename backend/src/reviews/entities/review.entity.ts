import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ReviewEntityType {
  BAR = 'bar',
  DISTILLERY = 'distillery',
  EVENT = 'event',
}

/**
 * Where a review sits in moderation.
 *
 * This replaces a single `isHidden` boolean, which conflated two very different
 * things: "someone reported this and nobody has looked yet" and "we looked and
 * took it down". A moderator needs to tell those apart — the first is a queue,
 * the second is a decision.
 *
 * PENDING and REMOVED are both invisible publicly and both excluded from the
 * rating average.
 */
export enum ReviewStatus {
  VISIBLE = 'visible',
  /** Reported or auto-flagged; hidden until a moderator rules on it. */
  PENDING = 'pending',
  /** A moderator took it down. */
  REMOVED = 'removed',
}

/** Why the fraud checks pulled a review out of the public listing. */
export enum ReviewFlagReason {
  SAME_ORIGIN_BURST = 'same_origin_burst',
  RATING_SPIKE = 'rating_spike',
  REPORTED = 'reported',
}

@Entity('reviews')
@Index(['entityType', 'entityId'])
@Index(['customerId'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  // Denormalized for fast display — avoids a join on the public GET endpoint.
  @Column({ nullable: true })
  customerName: string;

  @Column({ type: 'enum', enum: ReviewEntityType })
  entityType: ReviewEntityType;

  @Column()
  entityId: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  /**
   * Moderation state. Only VISIBLE reviews appear publicly or count toward the
   * entity's aggregate rating.
   *
   * Replaces the old `isHidden` boolean. That column is left in the database
   * rather than dropped — dropping is irreversible and nothing reads it now —
   * and the migration backfills status from it, so no moderation decision is
   * lost.
   */
  @Index()
  @Column({ type: 'enum', enum: ReviewStatus, default: ReviewStatus.VISIBLE })
  status: ReviewStatus;

  /** Set when the fraud checks flagged this, so a moderator knows why. */
  @Column({ type: 'enum', enum: ReviewFlagReason, nullable: true })
  flagReason: ReviewFlagReason;

  /**
   * A one-way fingerprint of the connection that posted this review.
   *
   * Not the IP address — a salted SHA-256 of it. It exists so we can spot one
   * person posting from one place under several accounts, which is what a
   * fake-review ring looks like. The address itself is never written down and
   * cannot be recovered from this.
   */
  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  originHash: string;

  @Column({ type: 'text', nullable: true })
  ownerReply: string;

  @Column({ type: 'timestamp', nullable: true })
  ownerReplyAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
