import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  zipCode: string;

  @Column({ nullable: true })
  country: string;

  @Column({ default: 'customer' })
  role: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  password: string; // Hashed password for customer auth

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  emailVerificationToken: string;

  @Column({ nullable: true })
  passwordResetToken: string;

  @Column({ nullable: true })
  passwordResetExpires: Date;

  // Marketing & Deal Preferences - stored as JSON
  @Column({ type: 'json', nullable: true })
  preferences: {
    dealCategories?: string[]; // ['bars', 'distilleries', 'events', 'tours']
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
    };
    dietaryRestrictions?: string[];
    preferredLocations?: string[];
    preferredPriceRange?: string;
    interests?: string[]; // ['wine', 'whiskey', 'cocktails', 'beer', 'food']
    receiveMarketingEmails?: boolean;
    receivePromotionalDeals?: boolean;
    preferredContactMethod?: 'email' | 'sms' | 'phone';
  };

  @Column({ default: 0 })
  totalOrders: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent: number;

  @Column({ nullable: true })
  lastOrderDate: Date;

  @Column({ nullable: true })
  profileImage: string;

  @OneToMany(() => Order, order => order.customer)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
