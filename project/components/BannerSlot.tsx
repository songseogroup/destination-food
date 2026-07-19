'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, apiService } from '../lib/api'
import { Event } from '../lib/types'
import { formatPrice, formatEventDate } from '../lib/format'
import PromoBand from './PromoBand'
import { ListingCardProps } from './ListingCard'

type Slot = 'top_hero' | 'right_rail' | 'mid_inline' | 'featured_above'

interface Banner {
  id: number
  slot: Slot
  title: string
  subtitle?: string
  imageUrl?: string
  linkUrl?: string
  /** Promo-band campaign fields — only populated for the featured_above slot. */
  highlight?: string
  ctaLabel?: string
  badgeLabel?: string
}

interface BannerSlotProps {
  slot: Slot
  className?: string
  variant?: 'horizontal' | 'vertical'
  /**
   * Inline ad content from the homepage block (homepage_content.content). When
   * it carries an imageUrl (image slots) or promo copy (featured_above), the
   * block renders THAT instead of fetching /banners. A content-less `{ slot }`
   * block keeps the original /banners behavior — existing ads are unaffected.
   */
  content?: Record<string, any>
}

/**
 * `featured_above` renders as a campaign promo band (copy block + discounted
 * listing cards, byFood-style). Every other slot renders as plain image tiles.
 */
const PROMO_SLOT: Slot = 'featured_above'

const nonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== ''

export default function BannerSlot({
  slot,
  className = '',
  variant = 'horizontal',
  content,
}: BannerSlotProps) {
  const c = content || {}
  // Inline image banner (any slot) vs inline promo copy (featured_above only).
  const hasInlineImage = nonEmpty(c.imageUrl)
  const hasInlinePromo = ['highlight', 'title', 'subtitle', 'ctaLabel', 'badgeLabel'].some((key) =>
    nonEmpty(c[key])
  )
  // Whether this slot is driven by its own inline content this render.
  const usesInline = slot === PROMO_SLOT ? hasInlinePromo : hasInlineImage

  const [banners, setBanners] = useState<Banner[]>([])
  const [promoItems, setPromoItems] = useState<ListingCardProps[]>([])
  const [promoLoading, setPromoLoading] = useState(slot === PROMO_SLOT)

  useEffect(() => {
    // Inline content stands on its own — skip the /banners fetch (and its
    // impression pings) entirely so an inline ad makes no needless request.
    if (usesInline) return
    let cancelled = false
    api
      .get('/banners', { params: { slot } })
      .then((res) => {
        if (cancelled) return
        // /banners returns a bare array today, but every other list endpoint on
        // this API returns { data, total }. If it is ever paginated to match,
        // an unguarded res.data lands a non-array in state and the .map() below
        // throws — taking the whole homepage down, since there is no error
        // boundary above it. Accept either shape.
        const payload = res.data
        const data: Banner[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : []
        setBanners(data)
        // Record impressions for all banners in this slot
        data.forEach((b) => {
          api.post(`/banners/${b.id}/impression`).catch(() => undefined)
        })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [slot, usesInline])

  // The promo band shows real bookable experiences beside the campaign copy.
  useEffect(() => {
    if (slot !== PROMO_SLOT) return
    let cancelled = false

    apiService
      .getEvents({ limit: 3 })
      .then((res) => {
        if (cancelled) return
        const events: Event[] = res.data?.data || []
        setPromoItems(
          events.map((event) => ({
            href: `/events/${event.id}`,
            image: event.image,
            title: event.name,
            // Event carries no rating column, so the prop is omitted entirely —
            // passing null here would render a misleading "New" on every card.
            meta: [event.location, formatEventDate(event.date)],
            tags: event.category ? [{ label: event.category }] : [],
            pricePrefix: 'From',
            price: formatPrice(event.price),
            priceSuffix: 'per guest',
            // No discount/originalPrice: there is no discount field on Event, and
            // inventing one would print a fake saving. See note in PromoBand.
          })),
        )
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setPromoLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [slot])

  const handleClick = (id: number) => {
    api.post(`/banners/${id}/click`).catch(() => undefined)
  }

  // ---------- Promo band ----------
  if (slot === PROMO_SLOT) {
    // Inline promo copy from the CMS block takes precedence over /banners.
    if (hasInlinePromo) {
      // Still gated on having experiences to show — an empty band reads as broken.
      if (!promoLoading && promoItems.length === 0) return null

      return (
        <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
          <PromoBand
            highlight={c.highlight}
            title={typeof c.title === 'string' ? c.title : ''}
            subtitle={c.subtitle}
            ctaLabel={c.ctaLabel}
            linkUrl={c.linkUrl}
            badgeLabel={c.badgeLabel}
            items={promoItems}
            loading={promoLoading}
            // No banner id for inline content → nothing to track a click against.
          />
        </div>
      )
    }

    const promo = banners[0]
    // Nothing to promote, or no experiences to show — render nothing rather
    // than an empty band.
    if (!promo || (!promoLoading && promoItems.length === 0)) return null

    return (
      <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 ${className}`}>
        <PromoBand
          highlight={promo.highlight}
          title={promo.title}
          subtitle={promo.subtitle}
          ctaLabel={promo.ctaLabel}
          linkUrl={promo.linkUrl}
          badgeLabel={promo.badgeLabel}
          items={promoItems}
          loading={promoLoading}
          onCtaClick={() => handleClick(promo.id)}
        />
      </div>
    )
  }

  // ---------- Inline image banner ----------
  // A single tile built from the block's own content — no /banners, no id, so no
  // impression/click tracking (there's nothing to attribute it to).
  if (hasInlineImage) {
    const title = typeof c.title === 'string' ? c.title : ''
    const subtitle = typeof c.subtitle === 'string' ? c.subtitle : ''
    const linkUrl = typeof c.linkUrl === 'string' ? c.linkUrl : ''
    const height = variant === 'vertical' ? 'h-64' : 'h-48'

    const inner = (
      <div className="group relative overflow-hidden rounded-2xl">
        <img
          src={c.imageUrl}
          alt={title}
          className={`w-full ${height} object-cover transition-transform group-hover:scale-105`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-900/30 to-transparent" />
        {(title || subtitle) && (
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {title && <h3 className="font-display text-lg font-semibold text-white">{title}</h3>}
            {subtitle && <p className="mt-1 text-sm text-charcoal-200">{subtitle}</p>}
          </div>
        )}
      </div>
    )
    const wrapped = linkUrl ? (
      <Link href={linkUrl} target="_blank" rel="noopener noreferrer">
        {inner}
      </Link>
    ) : (
      inner
    )

    if (variant === 'vertical') {
      return <aside className={`flex flex-col gap-4 ${className}`}>{wrapped}</aside>
    }
    return (
      <section className={`w-full ${className}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{wrapped}</div>
      </section>
    )
  }

  // ---------- Plain image slots ----------
  if (banners.length === 0) return null

  if (variant === 'vertical') {
    return (
      <aside className={`flex flex-col gap-4 ${className}`}>
        {banners.map((b) => {
          const inner = (
            <div className="group relative overflow-hidden rounded-2xl">
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-900/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display text-lg font-semibold text-white">{b.title}</h3>
                {b.subtitle && <p className="mt-1 text-sm text-charcoal-200">{b.subtitle}</p>}
              </div>
            </div>
          )
          return b.linkUrl ? (
            <Link key={b.id} href={b.linkUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleClick(b.id)}>
              {inner}
            </Link>
          ) : (
            <div key={b.id}>{inner}</div>
          )
        })}
      </aside>
    )
  }

  return (
    <section className={`w-full ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b) => {
            const inner = (
              <div className="group relative overflow-hidden rounded-2xl">
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/85 via-charcoal-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display text-lg font-semibold text-white">{b.title}</h3>
                  {b.subtitle && <p className="mt-1 text-sm text-charcoal-200">{b.subtitle}</p>}
                </div>
              </div>
            )
            return b.linkUrl ? (
              <Link key={b.id} href={b.linkUrl} target="_blank" rel="noopener noreferrer" onClick={() => handleClick(b.id)}>
                {inner}
              </Link>
            ) : (
              <div key={b.id}>{inner}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
