/**
 * Homepage layout — fetched server-side so the CMS ordering is in the initial
 * HTML (and therefore indexable), not applied after hydration.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export interface HomepageSection {
  id?: number
  /** Stable key: 'banner', 'featured_bars', … or 'ad:<slot>'. */
  section: string
  content: Record<string, any>
  order: number
  isVisible: boolean
}

/**
 * Shown when the API is unreachable.
 *
 * The homepage is the front door — it must render even if the backend is down,
 * so this mirrors the backend's seeded defaults. Copy lives in the CMS; these
 * are only the fallback ordering and section set.
 */
export const DEFAULT_LAYOUT: HomepageSection[] = [
  { section: 'banner', content: {}, order: 0, isVisible: true },
  { section: 'featured_bars', content: {}, order: 1, isVisible: true },
  { section: 'ad:featured_above', content: { slot: 'featured_above' }, order: 2, isVisible: true },
  { section: 'featured_distilleries', content: {}, order: 3, isVisible: true },
  { section: 'featured_events', content: {}, order: 4, isVisible: true },
  { section: 'featured_blogs', content: {}, order: 5, isVisible: true },
]

/**
 * Fetches the ordered, visible layout.
 *
 * `no-store` because a super admin reordering the homepage expects to see it on
 * the next load — a cached layout would make the builder feel broken.
 */
export async function getHomepageLayout(): Promise<HomepageSection[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/homepage/layout`, { cache: 'no-store' })
    if (!res.ok) return DEFAULT_LAYOUT

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return DEFAULT_LAYOUT

    return (data as HomepageSection[])
      .filter((s) => s && typeof s.section === 'string' && s.isVisible !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  } catch {
    // Backend unreachable — still serve the page.
    return DEFAULT_LAYOUT
  }
}
