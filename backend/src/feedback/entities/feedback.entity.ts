import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FeedbackStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  ARCHIVED = 'archived',
}

export enum FeedbackCategory {
  GENERAL = 'general',
  BUG = 'bug',
  FEATURE_REQUEST = 'feature_request',
  COMPLAINT = 'complaint',
  COMPLIMENT = 'compliment',
}

@Entity('feedback')
@Index(['status'])
@Index(['createdAt'])
export class Feedback {
  @PrimaryGeneratedColumn()
  id: number;

  // Optional — feedback can be submitted by a signed-in customer or anonymously
  @Column({ nullable: true })
  customerId: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ type: 'enum', enum: FeedbackCategory, default: FeedbackCategory.GENERAL })
  category: FeedbackCategory;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'enum', enum: FeedbackStatus, default: FeedbackStatus.NEW })
  status: FeedbackStatus;

  // SuperAdmin private notes (not visible to the submitter)
  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
