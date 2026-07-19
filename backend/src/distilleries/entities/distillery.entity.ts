import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SocialLink } from '../../common/dto/social-link.dto';

@Entity('distilleries')
export class Distillery {
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

  /**
   * City and country, for the destination landing pages.
   *
   * `location` is free text and only happens to hold a bare city name today —
   * the moment someone types "Sydney CBD" it stops matching. These are the
   * fields the destination pages group on. Events already had them; bars and
   * distilleries did not, which is why country pages were impossible.
   */
  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column()
  image: string;

  @Column({ default: true })
  isOpen: boolean;

  @Column()
  priceRange: string;

  @Column('json')
  specialties: string[];

  @Column()
  established: string;

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

  @Column('json', { nullable: true })
  products: string[];

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
