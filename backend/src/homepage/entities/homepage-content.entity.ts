import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * One block on the public homepage.
 *
 * `section` is the stable key the storefront maps to a component (see the
 * registry in project/lib/homepage-sections.ts). `content` is that block's
 * editable copy/config. `order` and `isVisible` let a super admin rearrange and
 * hide blocks without a deploy.
 *
 * Until now the homepage was hardcoded in project/app/page.tsx and this table
 * was never read by the site, so neither ordering nor visibility existed.
 */
@Entity('homepage_content')
export class HomepageContent {
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Stable key. Fixed blocks: 'banner', 'featured_bars', 'featured_distilleries',
   * 'featured_events', 'featured_blogs'. Ad slots are keyed 'ad:<slot>' so
   * several can sit at different positions.
   */
  @Column({ unique: true })
  section: string;

  @Column({ type: 'json' })
  content: Record<string, any>;

  /** Render order, ascending. */
  @Column({ type: 'int', default: 0 })
  order: number;

  /** Hidden blocks keep their copy in the table but are not rendered. */
  @Column({ default: true })
  isVisible: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
