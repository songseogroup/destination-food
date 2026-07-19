import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bar } from '../../bars/entities/bar.entity';
import { Distillery } from '../../distilleries/entities/distillery.entity';
import { Event } from '../../events/entities/event.entity';
import { Customer } from '../../customers/entities/customer.entity';

export enum OrderType {
  BAR_RESERVATION = 'bar_reservation',
  DISTILLERY_TOUR = 'distillery_tour',
  EVENT_BOOKING = 'event_booking',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: OrderType })
  orderType: OrderType;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // Customer Information
  @Column()
  customerName: string;

  @Column()
  customerEmail: string;

  @Column({ nullable: true })
  customerPhone: string;

  // Booking Details
  @Column({ nullable: true })
  barId: number;

  @Column({ nullable: true })
  distilleryId: number;

  @Column({ nullable: true })
  eventId: number;

  @ManyToOne(() => Bar, { nullable: true })
  @JoinColumn({ name: 'barId' })
  bar: Bar;

  @ManyToOne(() => Distillery, { nullable: true })
  @JoinColumn({ name: 'distilleryId' })
  distillery: Distillery;

  @ManyToOne(() => Event, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  // The booked slot, when the listing runs on sessions. Nullable so existing
  // free-text bookings (bookingDate/bookingTime) and listings without sessions
  // keep working exactly as before. When set, capacity was enforced against it.
  @Column({ nullable: true })
  sessionId: number;

  // Booking specifics
  @Column({ type: 'date', nullable: true })
  bookingDate: Date;

  @Column({ nullable: true })
  bookingTime: string;

  @Column({ default: 1 })
  numberOfGuests: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ default: false })
  autoPayoutProcessed: boolean;

  /**
   * When the "how was it?" email went out. Null means never.
   *
   * The scheduler sweeps past bookings every day, so without a marker every
   * eligible booking would be asked again every single morning.
   */
  @Column({ type: 'timestamp', nullable: true })
  reviewRequestSentAt: Date;

  @Column({ type: 'text', nullable: true })
  specialRequests: string;

  // Customer relationship
  @Column({ nullable: true })
  customerId: number;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

