import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ReviewEntityType {
  BAR = 'bar',
  DISTILLERY = 'distillery',
  EVENT = 'event',
}

@Entity('reviews')
@Index(['entityType', 'entityId'])
@Index(['customerId'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  customerId: number;

  // Denormalized for fast display — avoids a join on the public GET endpoint.
  @Column({ nullable: true })
  customerName: string;

  @Column({ type: 'enum', enum: ReviewEntityType })
  entityType: ReviewEntityType;

  @Column()
  entityId: number;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  // SuperAdmin moderation — hidden reviews don't show in public listings or
  // count toward the entity's aggregate rating.
  @Column({ type: 'boolean', default: false })
  isHidden: boolean;

  @Column({ type: 'text', nullable: true })
  ownerReply: string;

  @Column({ type: 'timestamp', nullable: true })
  ownerReplyAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
