'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Heart, MapPin } from 'lucide-react'
import StarRating from './ui/StarRating'
import BadgeChips from './BadgeChips'

export interface ListingTag {
  label: string
  icon?: React.ReactNode
}

export interface ListingCardProps {
  href: string
  image?: string | null
  title: string
  /**
   * Omit entirely for entity types that carry no rating column (Event today) —
   * the stars row is then not rendered at all. Pass `null` for an entity that
   * *can* be rated but has not been yet, which renders "New".
   */
  rating?: number | string | null
  reviews?: number | string | null
  /** Rendered as "Sydney · 2 hours". Falsy entries are dropped. */
  meta?: (string | null | undefined | false)[]
  tags?: ListingTag[]
  /** e.g. "From " */
  pricePrefix?: string
  /** e.g. "A$89" — already formatted by the caller. */
  price?: string | null
  /** Strikethrough original price, for discounts. */
  originalPrice?: string | null
  /** e.g. "per guest" */
  priceSuffix?: string
  /** Top-left ribbon, e.g. "Featured". */
  badge?: { label: string; icon?: React.ReactNode } | null
  /** Bottom-right of the image, e.g. "28% OFF". */
  discount?: string | null
  status?: 'open' | 'closed' | null
  /** Earned badges (trending, top-rated, etc.). Rendered under the title. */
  listingBadges?: import('../lib/badges').ListingBadge[]
  showFavorite?: boolean
  className?: string
}

/**
 * The single listing card for bars, distilleries, events and tours.
 *
 * This replaces eight near-identical hand-rolled card blocks (three Featured*
 * components plus the inline grids in /bars, /distilleries, /events,
 * /collections). Those had drifted into two different themes and only one of
 * them ever rendered a rating, which is why social proof was missing from the
 * live cards despite `rating`/`reviews` being required fields on every entity.
 */
export default function ListingCard({
  href,
  image,
  title,
  rating,
  reviews,
  meta = [],
  tags = [],
  pricePrefix,
  price,
  originalPrice,
  priceSuffix,
  badge,
  discount,
  status,
  listingBadges,
  showFavorite = true,
  className = '',
}: ListingCardProps) {
  const [favorited, setFavorited] = useState(false)
  const metaLine = meta.filter(Boolean) as string[]

  return (
    // h-full matters: in a grid this Link *is* the grid item and stretches on its
    // own, but inside the carousel it sits in a wrapper div. Without h-full the
    // article's own h-full resolves against auto height and the card shrinks to
    // its content — so a listing with a 1-line title rendered visibly shorter
    // than its neighbours.
    <Link href={href} className={`group block h-full ${className}`}>
      <article className="card-interactive flex h-full flex-col overflow-hidden">
        {/* ---------- Media ---------- */}
        <div className="relative aspect-[4/3] overflow-hidden bg-charcoal-100">
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-charcoal-100 to-charcoal-200">
              <span className="font-display text-2xl text-charcoal-400">DW</span>
            </div>
          )}

          {badge && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-whisky-500 px-3 py-1 text-xs font-semibold text-white shadow-soft">
              {badge.icon}
              {badge.label}
            </span>
          )}

          {status && !badge && (
            <span
              className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold shadow-soft ${
                status === 'open' ? 'bg-status-success text-white' : 'bg-charcoal-700 text-white'
              }`}
            >
              {status === 'open' ? 'Open now' : 'Closed'}
            </span>
          )}

          {showFavorite && (
            <button
              type="button"
              aria-label={favorited ? `Remove ${title} from wishlist` : `Add ${title} to wishlist`}
              aria-pressed={favorited}
              onClick={(e) => {
                // The card is a Link; without this the click navigates away.
                e.preventDefault()
                e.stopPropagation()
                setFavorited((v) => !v)
              }}
              className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-charcoal-600 shadow-soft backdrop-blur transition-colors hover:bg-white hover:text-whisky-600"
            >
              <Heart className={`h-4 w-4 ${favorited ? 'fill-whisky-500 text-whisky-500' : ''}`} />
            </button>
          )}

          {discount && (
            <span className="absolute bottom-0 right-0 rounded-tl-xl bg-status-danger px-2.5 py-1 text-xs font-bold text-white">
              {discount}
            </span>
          )}
        </div>

        {/* ---------- Body ---------- */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          {rating !== undefined && <StarRating rating={rating} reviews={reviews} size="sm" />}

          <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-whisky-700">
            {title}
          </h3>

          {metaLine.length > 0 && (
            <p className="flex items-center gap-1 text-sm text-charcoal-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{metaLine.join(' · ')}</span>
            </p>
          )}

          {listingBadges && listingBadges.length > 0 && (
            <BadgeChips badges={listingBadges} />
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 2).map((tag) => (
                <span key={tag.label} className="pill">
                  {tag.icon}
                  {tag.label}
                </span>
              ))}
            </div>
          )}

          {/* mt-auto pins price to the bottom so ragged card heights still align. */}
          {price && (
            <div className="mt-auto flex items-baseline gap-2 pt-2">
              {pricePrefix && <span className="text-sm text-charcoal-500">{pricePrefix}</span>}
              <span className="font-semibold text-ink">{price}</span>
              {originalPrice && (
                <span className="text-sm text-charcoal-400 line-through">{originalPrice}</span>
              )}
              {priceSuffix && <span className="text-xs text-charcoal-500">{priceSuffix}</span>}
            </div>
          )}
        </div>
      </article>
    </Link>
  )
}

/** Matching skeleton — same footprint, so grids don't reflow when data lands. */
export function ListingCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[4/3] rounded-none" />
      <div className="flex flex-col gap-2.5 p-4">
        <div className="skeleton h-3.5 w-20" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-3.5 w-1/2" />
        <div className="skeleton mt-2 h-4 w-24" />
      </div>
    </div>
  )
}
