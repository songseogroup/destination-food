'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import ListingCard, { ListingCardSkeleton, ListingCardProps } from './ListingCard'

export interface PromoBandProps {
  /** Big accent line, e.g. "Save 10%". */
  highlight?: string | null
  /** Headline, e.g. "Savour Winter". */
  title: string
  /** Italic second line, e.g. "Through Whisky". */
  subtitle?: string | null
  ctaLabel?: string | null
  linkUrl?: string | null
  /** Ribbon stamped on every card in the band, e.g. "Winter Special". */
  badgeLabel?: string | null
  items: ListingCardProps[]
  loading?: boolean
  onCtaClick?: () => void
  className?: string
}

/**
 * Campaign promo band: a copy block beside a row of discounted listing cards.
 *
 * Modelled on byFood's "Save 10% / Savor Summer Through Food" band. The cards
 * are the same ListingCard used everywhere else — it already carries the badge,
 * discount ribbon, strikethrough price and wishlist heart the reference uses,
 * so the band is a layout around existing parts rather than a second card
 * implementation that would drift.
 *
 * Sits on a warm gold wash so it reads as promotional against the cream page
 * without needing a hard border.
 */
export default function PromoBand({
  highlight,
  title,
  subtitle,
  ctaLabel,
  linkUrl,
  badgeLabel,
  items,
  loading = false,
  onCtaClick,
  className = '',
}: PromoBandProps) {
  const cta = ctaLabel?.trim() || 'Explore now'

  return (
    <section
      className={`overflow-hidden rounded-3xl bg-whisky-50 ring-1 ring-whisky-100 ${className}`}
      aria-label={`${highlight ? `${highlight} — ` : ''}${title}`}
    >
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(200px,15rem)_1fr] lg:items-center lg:gap-8 lg:p-8">
        {/* ---------- Copy block ---------- */}
        <div className="text-center lg:text-left">
          {highlight && (
            <p className="font-display text-3xl font-bold leading-none text-whisky-600 lg:text-4xl">
              {highlight}
            </p>
          )}
          <h2 className="mt-2 font-display text-2xl font-bold leading-tight text-ink lg:text-3xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 font-display text-xl italic text-charcoal-600 lg:text-2xl">
              {subtitle}
            </p>
          )}

          {linkUrl ? (
            <Link href={linkUrl} onClick={onCtaClick} className="btn-primary mt-5">
              {cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <button type="button" onClick={onCtaClick} className="btn-primary mt-5">
              {cta}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ---------- Cards ---------- */}
        {/*
          Horizontal scroll on small screens rather than a wrapping grid — a
          promo band that reflows into a tall stack stops reading as a band.
        */}
        <div className="-mx-6 overflow-x-auto px-6 pb-1 lg:mx-0 lg:overflow-visible lg:px-0 scrollbar-hide">
          <div className="grid auto-cols-[15rem] grid-flow-col gap-4 lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-3">
            {loading
              ? [1, 2, 3].map((i) => <ListingCardSkeleton key={i} />)
              : items.slice(0, 3).map((item) => (
                  <ListingCard
                    key={item.href}
                    {...item}
                    badge={
                      badgeLabel
                        ? { label: badgeLabel, icon: <Sparkles className="h-3 w-3" /> }
                        : item.badge
                    }
                  />
                ))}
          </div>
        </div>
      </div>
    </section>
  )
}
