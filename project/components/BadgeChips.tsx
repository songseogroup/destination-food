import { BADGE_TOOLTIP, badgeIcon, badgeLabel, ListingBadge } from '../lib/badges'

/**
 * The row of earned badges on a listing.
 *
 * Small and gold, and every chip carries the same "awarded based on community
 * ratings and activity" tooltip — the spec's reassurance that these can't be
 * bought. Renders nothing when a listing has none, so it's safe to drop in
 * anywhere.
 */
export default function BadgeChips({
  badges,
  size = 'sm',
  className = '',
}: {
  badges: ListingBadge[]
  size?: 'sm' | 'md'
  className?: string
}) {
  if (!badges || badges.length === 0) return null

  const pad = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'
  const icon = size === 'md' ? 'h-4 w-4' : 'h-3 w-3'

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map((b) => {
        const Icon = badgeIcon(b.type)
        return (
          <span
            key={`${b.type}-${b.entityId}`}
            title={BADGE_TOOLTIP}
            className={`inline-flex items-center gap-1 rounded-full border border-whisky-200 bg-whisky-50 font-medium text-whisky-800 ${pad}`}
          >
            <Icon className={`${icon} text-whisky-600`} />
            {badgeLabel(b)}
          </span>
        )
      })}
    </div>
  )
}
