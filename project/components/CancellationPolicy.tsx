'use client'

import { useEffect, useState } from 'react'
import { CalendarX } from 'lucide-react'
import { apiService } from '../lib/api'

export interface PolicyTarget {
  type: 'bar' | 'distillery' | 'event'
  itemId: number
  title: string
}

/**
 * What happens if the guest can't make it.
 *
 * Every listing carries a `refundWindowHours` (48 by default) and the refund
 * logic already enforces it — but the customer was never shown it anywhere, so
 * they were agreeing to terms they couldn't read. The client's rules say it must
 * be visible at checkout and in the confirmation.
 *
 * Read fresh from the API rather than from the cart: an item can sit in a cart
 * for days, and the operator may have changed their policy since it went in.
 */
export default function CancellationPolicy({
  items,
  className = '',
}: {
  items: PolicyTarget[]
  className?: string
}) {
  const [windows, setWindows] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(true)

  const key = items.map((i) => `${i.type}:${i.itemId}`).join(',')

  useEffect(() => {
    let cancelled = false
    const unique = Array.from(
      new Map(items.map((i) => [`${i.type}:${i.itemId}`, i])).values(),
    )
    if (unique.length === 0) {
      setLoading(false)
      return
    }

    const fetcher = (i: PolicyTarget) =>
      i.type === 'bar'
        ? apiService.getBar(i.itemId)
        : i.type === 'distillery'
          ? apiService.getDistillery(i.itemId)
          : apiService.getEvent(i.itemId)

    Promise.all(
      unique.map((i) =>
        fetcher(i)
          .then((res) => [`${i.type}:${i.itemId}`, res.data?.refundWindowHours ?? null] as const)
          // A listing we can't read shouldn't invent a policy — leave it unknown
          // and say so, rather than showing a number that might be wrong.
          .catch(() => [`${i.type}:${i.itemId}`, null] as const),
      ),
    )
      .then((pairs) => {
        if (!cancelled) setWindows(Object.fromEntries(pairs))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (loading || items.length === 0) return null

  const unique = Array.from(new Map(items.map((i) => [`${i.type}:${i.itemId}`, i])).values())
  const values = unique.map((i) => windows[`${i.type}:${i.itemId}`])
  const allKnown = values.every((v) => typeof v === 'number')
  const allSame = allKnown && new Set(values).size === 1

  const line = (hours: number) =>
    hours > 0
      ? `Free cancellation up until ${hours} hours before your booking. After that, no refund.`
      : `This booking can't be cancelled for a refund once placed.`

  return (
    <div
      className={`rounded-xl border border-charcoal-200 bg-cream p-4 ${className}`}
      aria-label="Cancellation policy"
    >
      <div className="flex items-start gap-3">
        <CalendarX className="mt-0.5 h-4 w-4 flex-shrink-0 text-whisky-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">Cancellation policy</p>

          {allSame ? (
            <p className="mt-1 text-xs leading-relaxed text-charcoal-600">
              {line(values[0] as number)}
            </p>
          ) : (
            // Each operator sets their own window, so a mixed cart gets them
            // itemised — one blended sentence would be wrong for some of them.
            <ul className="mt-1 space-y-1">
              {unique.map((i) => {
                const hours = windows[`${i.type}:${i.itemId}`]
                return (
                  <li key={`${i.type}:${i.itemId}`} className="text-xs leading-relaxed text-charcoal-600">
                    <span className="font-medium text-charcoal-700">{i.title}:</span>{' '}
                    {typeof hours === 'number'
                      ? line(hours)
                      : 'Policy unavailable — please check with us before booking.'}
                  </li>
                )
              })}
            </ul>
          )}

          <p className="mt-2 text-[11px] text-charcoal-500">
            Refunds typically appear in 5–10 business days.
          </p>
        </div>
      </div>
    </div>
  )
}
