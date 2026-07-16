'use client'

import React, { useEffect, useState } from 'react'
import { apiService } from '../lib/api'
import { formatPrice, formatEventDate } from '../lib/format'
import { Event, Bar, Distillery } from '../lib/types'
import PromoBand from './PromoBand'
import { ListingCardProps } from './ListingCard'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

/**
 * Site-wide promotional band — the same campaign, on every page.
 *
 * This is how byFood keeps its "Save 10% — Savor Summer" band consistent across
 * the whole site: one central campaign config surfaced in the same slot on every
 * listing page, not an ad pasted per-page. The client edits it once in the CMS
 * (homepage builder → "Edit site promo") and it changes everywhere at once.
 *
 * Renders nothing when the config is absent or turned off, so dropping
 * <SitePromoBand /> into a page is always safe.
 */

interface SitePromoConfig {
  enabled?: string // 'no' turns it off
  highlight?: string
  title?: string
  subtitle?: string
  ctaLabel?: string
  ctaHref?: string
  badgeLabel?: string
  /** Which listings fill the band's cards. */
  source?: 'events' | 'bars' | 'distilleries'
  /** Optional campaign discount, e.g. 10 → each card shows "10% OFF" + strikethrough. */
  discountPercent?: number | string
}

function applyDiscount(rawPrice: string | number | null | undefined, pct: number) {
  const original = formatPrice(rawPrice)
  const numeric =
    typeof rawPrice === 'number' ? rawPrice : Number(String(rawPrice ?? '').replace(/[^0-9.]/g, ''))
  if (!original || !pct || !Number.isFinite(numeric) || numeric <= 0) {
    return { price: original, originalPrice: null as string | null, discount: null as string | null }
  }
  return {
    price: formatPrice(numeric * (1 - pct / 100)),
    originalPrice: original,
    discount: `${pct}% OFF`,
  }
}

export default function SitePromoBand({ className = '' }: { className?: string }) {
  const [config, setConfig] = useState<SitePromoConfig | null>(null)
  const [items, setItems] = useState<ListingCardProps[]>([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  // 1. Load the central campaign config.
  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/homepage/site_promo`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((row) => {
        if (cancelled) return
        setConfig(row?.content ?? null)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // 2. Once we have a config, load the cards it wants.
  useEffect(() => {
    if (!config || config.enabled === 'no') return
    let cancelled = false
    const source = config.source || 'events'
    const pct = Number(config.discountPercent) || 0

    const fetcher =
      source === 'bars'
        ? apiService.getBars
        : source === 'distilleries'
          ? apiService.getDistilleries
          : apiService.getEvents

    fetcher({ limit: 3 })
      .then((res: any) => {
        if (cancelled) return
        const rows = res.data?.data || []
        setItems(
          rows.map((row: Event | Bar | Distillery): ListingCardProps => {
            if (source === 'events') {
              const e = row as Event
              const d = applyDiscount(e.price, pct)
              return {
                href: `/events/${e.id}`,
                image: e.image,
                title: e.name,
                meta: [e.location, formatEventDate(e.date)],
                tags: e.category ? [{ label: e.category }] : [],
                pricePrefix: 'From',
                price: d.price,
                originalPrice: d.originalPrice,
                discount: d.discount,
                priceSuffix: 'per guest',
              }
            }
            const v = row as Bar | Distillery
            return {
              href: `/${source}/${v.id}`,
              image: v.image,
              title: v.name,
              rating: v.rating,
              reviews: v.reviews,
              meta: [v.location, v.type],
              status: v.isOpen ? 'open' : 'closed',
              price: v.priceRange,
            }
          }),
        )
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [config])

  if (!ready || !config || config.enabled === 'no') return null
  if (!loading && items.length === 0) return null
  if (!config.title && !config.highlight) return null

  return (
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>
      <PromoBand
        highlight={config.highlight}
        title={config.title || 'Featured this season'}
        subtitle={config.subtitle}
        ctaLabel={config.ctaLabel}
        linkUrl={config.ctaHref}
        badgeLabel={config.badgeLabel}
        items={items}
        loading={loading}
      />
    </div>
  )
}
