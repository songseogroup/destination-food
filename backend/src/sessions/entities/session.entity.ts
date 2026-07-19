import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ReviewEntityType } from '../../reviews/entities/review.entity';

/**
 * A bookable time slot on a listing, with a hard capacity.
 *
 * Until now a customer typed any date and time they liked into a free-text
 * field and there was nothing stopping a tour meant for twelve from taking forty
 * bookings. A session is a real slot an operator opens — "Saturday 2pm, room for
 * 12" — and the booking flow can only sell what's left of it.
 *
 * `bookedCount` is a denormalised running total of guests booked, kept in step
 * with orders inside the same transaction that creates or cancels them. It's the
 * number capacity is checked against, so it has to be accurate — hence the
 * locked read-modify-write in SessionsService rather than a bare increment.
 */
@Entity('sessions')
@Index(['entityType', 'entityId'])
@Index(['startsAt'])
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ReviewEntityType })
  entityType: ReviewEntityType;

  @Column()
  entityId: number;

  /** When the slot begins. Replaces the old free-text date + time. */
  @Column({ type: 'timestamp' })
  startsAt: Date;

  /** How long it runs, for display. Null when open-ended (e.g. a bar sitting). */
  @Column({ type: 'int', nullable: true })
  durationMinutes: number;

  /** Maximum guests across all bookings for this slot. */
  @Column({ type: 'int' })
  capacity: number;

  /** Guests already booked. Never exceeds capacity — that's the whole point. */
  @Column({ type: 'int', default: 0 })
  bookedCount: number;

  /**
   * Per-guest price for this slot, if it differs from the listing's default.
   * Null means "use the listing price". Stored in dollars, like everything else.
   */
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  priceOverride: number;

  /** An operator can close a slot without deleting its booking history. */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
