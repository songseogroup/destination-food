import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum StripeAccountStatus {
  PENDING = 'pending',
  RESTRICTED = 'restricted',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export enum KYCStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('stripe_accounts')
export class StripeAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  stripeAccountId: string;

  @Column({ type: 'enum', enum: StripeAccountStatus, default: StripeAccountStatus.PENDING })
  status: StripeAccountStatus;

  @Column({ type: 'enum', enum: KYCStatus, default: KYCStatus.NOT_STARTED })
  kycStatus: KYCStatus;

  @Column({ type: 'json', nullable: true })
  businessInfo: {
    businessName?: string;
    businessType?: string;
    taxId?: string;
    website?: string;
  };

  @Column({ type: 'json', nullable: true })
  personalInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };

  @Column({ type: 'json', nullable: true })
  bankAccount: {
    accountHolderName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountType?: string;
    country?: string;
    currency?: string;
  };

  @Column({ type: 'json', nullable: true })
  verificationDetails: {
    requirements?: any;
    currentlyDue?: string[];
    eventuallyDue?: string[];
    disabledReason?: string;
    pastDue?: string[];
    uploadedDocuments?: Record<
      string,
      {
        fileId: string;
        uploadedAt: string;
        filename: string;
      }
    >;
  };

  @Column({ nullable: true })
  onboardingLink: string;

  @Column({ nullable: true })
  loginLink: string;

  @Column({ type: 'boolean', default: false })
  payoutsEnabled: boolean;

  @Column({ type: 'boolean', default: false })
  chargesEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
