import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewEntityType } from '../../reviews/entities/review.entity';

export enum ClaimStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * A business owner asking to take control of a listing that's already on the site.
 *
 * Listings can exist before their real owner does — seeded by Destination
 * Whisky, or added by an admin. This is how that owner takes them over rather
 * than creating a duplicate: they submit a claim, an admin checks it, and on
 * approval the listing's ownership is assigned to them.
 *
 * The claim is public to submit (the claimant may not have an account yet), so
 * it stores their contact details rather than a user id. Approval is where an
 * operator account is matched or created and the listing is actually handed over
 * — nothing here grants access on its own.
 */
@Entity('claims')
@Index(['entityType', 'entityId'])
@Index(['status'])
export class Claim {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ReviewEntityType })
  entityType: ReviewEntityType;

  @Column()
  entityId: number;

  @Column()
  claimantName: string;

  @Column()
  claimantEmail: string;

  @Column({ nullable: true })
  claimantPhone: string;

  /** Their case for why this listing is theirs. */
  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ type: 'enum', enum: ClaimStatus, default: ClaimStatus.PENDING })
  status: ClaimStatus;

  /** The admin who ruled on it, and why (kept for the audit trail). */
  @Column({ nullable: true })
  reviewedByUserId: number;

  @Column({ type: 'text', nullable: true })
  reviewNote: string;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
