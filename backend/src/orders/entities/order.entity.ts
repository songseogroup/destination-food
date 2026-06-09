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

