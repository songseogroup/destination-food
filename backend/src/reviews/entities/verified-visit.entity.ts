import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ReviewEntityType } from './review.entity';

/**
 * An admin vouching that a customer really visited a listing.
 *
 * Reviews are only open to people who booked through Destination Whisky — that
 * is what keeps ratings meaningful and is the rule the client specified. But
 * early on, most real visits predate the platform or were booked by phone, and
 * those guests would be locked out. This is the deliberate, auditable escape
 * hatch: an admin records that they verified the visit, and that customer may
 * review that one listing.
 *
 * It is intentionally per (customer, listing) — never a blanket "this customer
 * can review anything" — and it records who granted it, so an operator can't
 * quietly manufacture praise without an admin's name against it.
 */
@Entity('verified_visits')
@Index(['customerId', 'entityType', 'entityId'], { unique: true })
export class VerifiedVisit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  @Column({ type: 'enum', enum: ReviewEntityType })
  entityType: ReviewEntityType;

  @Column()
  entityId: number;

  /** The admin who vouched. Kept so the grant is attributable. */
  @Column({ nullable: true })
  grantedByUserId: number;

  @Column({ type: 'text', nullable: true })
  note: string;

  @CreateDateColumn()
  createdAt: Date;
}
