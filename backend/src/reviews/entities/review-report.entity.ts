import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum ReviewReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  FAKE = 'fake',
  OTHER = 'other',
}

/**
 * Someone telling us a review shouldn't be there.
 *
 * Kept as its own row rather than a counter on the review: three people
 * reporting the same review for three different reasons is information a
 * moderator needs, and a bare count throws it away. It also means a report
 * survives the moderator's decision, so a pattern of one operator reporting
 * every poor review is visible.
 */
@Entity('review_reports')
@Index(['reviewId'])
export class ReviewReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reviewId: number;

  /** Null when reported by someone not signed in. */
  @Column({ nullable: true })
  reporterCustomerId: number;

  /** Set when an operator or admin reports it rather than a customer. */
  @Column({ nullable: true })
  reporterUserId: number;

  @Column({ type: 'enum', enum: ReviewReportReason })
  reason: ReviewReportReason;

  @Column({ type: 'text', nullable: true })
  note: string;

  /** Cleared once a moderator has ruled on the review this belongs to. */
  @Column({ type: 'boolean', default: false })
  resolved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
