import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SocialLink } from '../../common/dto/social-link.dto';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  date: string;

  @Column()
  time: string;

  @Column()
  location: string;

  // Structured location data
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column()
  image: string;

  @Column()
  price: string;

  @Column()
  capacity: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  category: string;

  @Column({ type: 'text', nullable: true })
  fullDescription: string;

  @Column({ nullable: true })
  organizer: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  contactPhone: string;

  /** Event had no website column at all, unlike Bar and Distillery. */
  @Column({ nullable: true })
  website: string;

  /**
   * Denormalised review aggregate, mirroring Bar and Distillery.
   *
   * The Review entity already supports entityType='event', but Event carried no
   * rating/reviews columns — so event cards could never show the star rating and
   * review count that every other listing type shows. Kept as a denormalised
   * pair for consistency with the other two entities; ReviewsService should
   * recalculate these on review create/delete.
   */
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviews: number;

  @Column('json', { nullable: true })
  requirements: string[];

  @Column('json', { nullable: true })
  mediaGallery: string[];

  @Column({ type: 'int', default: 48 })
  refundWindowHours: number;

  /**
   * Social + external links, e.g. Instagram, Facebook, YouTube, X, and `other`
   * links such as a charity or GoFundMe page (named via `label`).
   * See common/dto/social-link.dto.ts for the shape.
   */
  @Column('json', { nullable: true })
  socialLinks: SocialLink[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isFeatured: boolean;

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
