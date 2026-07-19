import { Flame, Award, Star, Heart, LucideIcon } from 'lucide-react'

export type BadgeType =
  | 'trending'
  | 'most_reviewed'
  | 'top_rated_in_city'
  | 'community_favourite'

export interface ListingBadge {
  entityType: 'bar' | 'distillery' | 'event'
  entityId: number
  type: BadgeType
  context?: { city?: string } | null
}

interface BadgeDef {
  icon: LucideIcon
  label: (ctx?: { city?: string } | null) => string
}

const DEFS: Record<BadgeType, BadgeDef> = {
  trending: {
    icon: Flame,
    label: () => 'Trending this month',
  },
  most_reviewed: {
    icon: Award,
    label: () => 'Most reviewed',
  },
  top_rated_in_city: {
    icon: Star,
    // Falls back gracefully if a city somehow wasn't recorded.
    label: (ctx) => (ctx?.city ? `Top rated in ${ctx.city}` : 'Top rated'),
  },
  community_favourite: {
    icon: Heart,
    label: () => 'Community favourite',
  },
}

export function badgeLabel(b: ListingBadge): string {
  return DEFS[b.type]?.label(b.context) ?? ''
}

export function badgeIcon(type: BadgeType): LucideIcon {
  return DEFS[type]?.icon ?? Award
}

/**
 * The one line every badge shares, spelling out that they're earned, not sold —
 * which is the reassurance the spec asks the tooltip to give.
 */
export const BADGE_TOOLTIP = 'Awarded based on community ratings and activity'

/** Key for looking a listing's badges up in the bulk-fetched set. */
export function badgeKey(entityType: string, entityId: number): string {
  return `${entityType}:${entityId}`
}
