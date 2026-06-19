import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  // Existing — fired by the Stripe service
  BOOKING_RECEIVED = 'booking_received',
  BOOKING_CONFIRMED = 'booking_confirmed',
  REFUND_PROCESSED = 'refund_processed',
  KYC_INCOMPLETE = 'kyc_incomplete',
  PAYOUT_APPROVED = 'payout_approved',
  PAYOUT_REJECTED = 'payout_rejected',
  PAYOUT_PAID = 'payout_paid',
  PAYOUT_FAILED = 'payout_failed',
  // New — lifecycle / admin events
  WELCOME = 'welcome',
  VENDOR_REGISTERED = 'vendor_registered',
  KYC_VERIFIED = 'kyc_verified',
  ID_UPLOADED = 'id_uploaded',
  GENERIC = 'generic',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
  ARCHIVED = 'archived',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  // Either userId (owner / admin / super_admin) or customerId is set per row, never both.
  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  customerId: number;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.UNREAD })
  status: NotificationStatus;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'boolean', default: false })
  emailSent: boolean;

  @Column({ type: 'boolean', default: false })
  pushSent: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
