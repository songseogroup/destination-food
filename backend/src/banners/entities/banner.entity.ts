import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum BannerSlot {
  TOP_HERO = 'top_hero',
  RIGHT_RAIL = 'right_rail',
  MID_INLINE = 'mid_inline',
  FEATURED_ABOVE = 'featured_above',
}

@Entity('banners')
export class Banner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: BannerSlot })
  slot: BannerSlot;

  @Column()
  title: string;

  @Column({ nullable: true })
  subtitle: string;

  /**
   * Promo-band campaign fields.
   *
   * A `featured_above` banner renders as a promo band: a copy block on the left
   * (highlight + title + subtitle + CTA) beside a row of discounted listing
   * cards. These three drive that block; every other slot ignores them and
   * still renders as a plain image tile.
   */

  /** The large accent line, e.g. "Save 10%". */
  @Column({ nullable: true })
  highlight: string;

  /** CTA button label, e.g. "Explore Now". Defaults to "Explore now" when unset. */
  @Column({ nullable: true })
  ctaLabel: string;

  /** Ribbon stamped on each card in the band, e.g. "Winter Special". */
  @Column({ nullable: true })
  badgeLabel: string;

  /**
   * imageUrl is optional for promo bands — the cards carry the imagery there —
   * but stays required in practice for the plain image slots.
   */
  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  linkUrl: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startsAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  endsAt: Date;

  @Column({ type: 'int', default: 0 })
  impressions: number;

  @Column({ type: 'int', default: 0 })
  clicks: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
