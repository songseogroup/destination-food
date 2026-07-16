'use client'

import React from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number | string | null | undefined
  /** Renders "(247)" beside the stars when provided. */
  reviews?: number | string | null
  size?: 'sm' | 'md' | 'lg'
  /** 'stars' draws five stars; 'compact' draws one star + the number (card default). */
  variant?: 'stars' | 'compact'
  className?: string
}

const sizeMap = {
  sm: { icon: 'h-3.5 w-3.5', text: 'text-xs' },
  md: { icon: 'h-4 w-4', text: 'text-sm' },
  lg: { icon: 'h-5 w-5', text: 'text-base' },
}

/**
 * `rating` is decimal(3,2) in Postgres and node-postgres hands numerics back as
 * strings ("4.50"), so every consumer must coerce. Doing it here once means call
 * sites can pass the raw API value.
 */
export function toRating(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

function toCount(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function StarRating({
  rating,
  reviews,
  size = 'md',
  variant = 'compact',
  className = '',
}: StarRatingProps) {
  const value = toRating(rating)
  const count = toCount(reviews)
  const { icon, text } = sizeMap[size]

  // No rating yet is a real state for a new listing — say so rather than
  // rendering a misleading zero or a fabricated default.
  if (value === null) {
    return (
      <span className={`inline-flex items-center gap-1.5 ${text} text-charcoal-400 ${className}`}>
        <Star className={icon} strokeWidth={1.75} />
        <span>New</span>
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${className}`}
        aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`}
      >
        <Star className={`${icon} fill-whisky-500 text-whisky-500`} />
        <span className={`${text} font-semibold text-ink`}>{value.toFixed(1)}</span>
        {count > 0 && <span className={`${text} text-charcoal-500`}>({count})</span>}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      aria-label={`Rated ${value.toFixed(1)} out of 5${count ? ` from ${count} reviews` : ''}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${icon} ${
            i <= Math.round(value)
              ? 'fill-whisky-500 text-whisky-500'
              : 'fill-charcoal-200 text-charcoal-200'
          }`}
        />
      ))}
      {count > 0 && <span className={`${text} ml-1 text-charcoal-500`}>({count})</span>}
    </span>
  )
}
