import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Bar } from '../../bars/entities/bar.entity';
import { Distillery } from '../../distilleries/entities/distillery.entity';
import { Event } from '../../events/entities/event.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  BAR = 'bar',
  DISTILLERY = 'distillery',
  TOUR_OPERATOR = 'tour_operator',
  EVENT_HOST = 'event_host',
}

export enum VendorApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ 
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.ADMIN 
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: VendorApprovalStatus,
    default: VendorApprovalStatus.APPROVED,
  })
  approvalStatus: VendorApprovalStatus;

  @Column({ nullable: true })
  inviteTokenHash?: string;

  @Column({ type: 'timestamp', nullable: true })
  inviteTokenExpiresAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  passwordSetAt?: Date;

  // Revenue tracking (for restaurants - no Stripe integration)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  availableBalance: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingBalance: number;

  @OneToMany(() => Bar, (bar) => bar.owner)
  bars: Bar[];

  @OneToMany(() => Distillery, (distillery) => distillery.owner)
  distilleries: Distillery[];

  @OneToMany(() => Event, (event) => event.owner)
  events: Event[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
