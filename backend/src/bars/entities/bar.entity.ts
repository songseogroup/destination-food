import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('bars')
export class Bar {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviews: number;

  @Column()
  location: string;

  @Column()
  image: string;

  @Column({ default: true })
  isOpen: boolean;

  @Column()
  priceRange: string;

  @Column('json')
  specialties: string[];

  @Column('json', { nullable: true })
  products: string[];

  @Column('json', { nullable: true })
  mediaGallery: string[];

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column('json', { nullable: true })
  operatingHours: Record<string, string>;

  @Column({ type: 'int', default: 48 })
  refundWindowHours: number;

  // Optional per-guest reservation deposit charged at booking time. When null,
  // customers can reserve a table without paying upfront. When set, the bar
  // booking modal computes `bookingDepositPerGuest × guests` and charges via
  // Stripe before creating the order.
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  bookingDepositPerGuest: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
