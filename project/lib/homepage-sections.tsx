import React from 'react'
import Banner from '../components/Banner'
import BannerSlot from '../components/BannerSlot'
import FeaturedBars from '../components/FeaturedBars'
import FeaturedDistilleries from '../components/FeaturedDistilleries'
import FeaturedEvents from '../components/FeaturedEvents'
import FeaturedBlogs from '../components/FeaturedBlogs'
import RichTextBlock from '../components/RichTextBlock'
import type { HomepageSection } from './homepage'

/**
 * Section registry — the contract between the CMS builder and the storefront.
 *
 * The CMS stores a stable `section` key plus a `content` blob; this maps each
 * key to the component that renders it. Adding a block to the homepage is a
 * change here plus a row in homepage_content — no edit to app/page.tsx.
 *
 * Keys must stay in sync with SECTION_LIBRARY in
 * cms-admin/components/SectionEditor.tsx — that is where the builder defines
 * the editable fields for each key.
 */

export type SectionRenderer = (content: Record<string, any>) => React.ReactNode

const REGISTRY: Record<string, SectionRenderer> = {
  banner: (content) => <Banner content={content} />,
  featured_bars: (content) => <FeaturedBars content={content} />,
  featured_distilleries: (content) => <FeaturedDistilleries content={content} />,
  featured_events: (content) => <FeaturedEvents content={content} />,
  featured_blogs: (content) => <FeaturedBlogs content={content} />,
}

/** Slots an ad block may occupy. Mirrors the BannerSlot enum on the backend. */
export const AD_SLOTS = ['top_hero', 'mid_inline', 'featured_above', 'right_rail'] as const

export function renderHomepageSection(section: HomepageSection): React.ReactNode {
  // Ad blocks are keyed 'ad:<slot>' so several can sit at different positions.
  // The block's own content is passed down: BannerSlot renders it inline when an
  // image/promo copy is set, and falls back to the live /banners campaign when
  // it's just `{ slot }` (the original, content-less ad block).
  if (section.section.startsWith('ad:')) {
    const slot = section.content?.slot || section.section.slice(3)
    if (!AD_SLOTS.includes(slot)) return null
    return <BannerSlot key={section.section} slot={slot} content={section.content} />
  }

  // Rich-text / CTA blocks are keyed 'rich_text' or 'rich_text:<n>' — the whole
  // family renders through one component, mirroring the CMS 'rich_text' prefix.
  if (section.section === 'rich_text' || section.section.startsWith('rich_text:')) {
    return <RichTextBlock key={section.section} content={section.content || {}} />
  }

  const render = REGISTRY[section.section]
  // An unknown key means the CMS has a block this build doesn't know about
  // (e.g. mid-deploy). Skip it rather than throwing and blanking the homepage.
  if (!render) return null

  return <React.Fragment key={section.section}>{render(section.content || {})}</React.Fragment>
}
