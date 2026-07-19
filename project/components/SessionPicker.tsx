'use client'

import { useEffect, useState } from 'react'
import { CalendarClock, Users } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export interface BookableSession {
  id: number
  startsAt: string
  durationMinutes?: number | null
  capacity: number
  bookedCount: number
  remaining: number
  priceOverride?: number | null
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * The session a guest is booking into.
 *
 * Fetches the bookable slots for a listing and lets the guest pick one. It calls
 * back with the chosen session (and null when there are none) so the booking form
 * can send its id and enforce capacity — and so it can hide its own free-text
 * date/time when real sessions exist.
 *
 * Renders nothing while loading or when a listing simply has no sessions, so the
 * old free-text booking flow is untouched for listings that never adopted them.
 */
export default function SessionPicker({
  entityType,
  entityId,
  guests,
  value,
  onChange,
}: {
  entityType: 'bar' | 'distillery' | 'event'
  entityId: number
  guests: number
  value: BookableSession | null
  onChange: (s: BookableSession | null) => void
}) {
  const [sessions, setSessions] = useState<BookableSession[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/sessions/${entityType}/${entityId}/bookable`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: BookableSession[]) => {
        if (!cancelled) setSessions(rows || [])
      })
      .catch(() => {
        if (!cancelled) setSessions([])
      })
    return () => {
      cancelled = true
    }
  }, [entityType, entityId])

  // No sessions on this listing → the form keeps its original date/time fields.
  if (sessions === null || sessions.length === 0) return null

  return (
    <div>
      <label className="label">Choose a session</label>
      <div className="space-y-2">
        {sessions.map((s) => {
          const tooSmall = s.remaining < guests
          const selected = value?.id === s.id
          return (
            <button
              key={s.id}
              type="button"
              disabled={tooSmall}
              onClick={() => onChange(selected ? null : s)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                selected
                  ? 'border-whisky-500 bg-whisky-50'
                  : tooSmall
                    ? 'cursor-not-allowed border-charcoal-200 bg-charcoal-50 opacity-60'
                    : 'border-charcoal-200 hover:border-whisky-300'
              }`}
            >
              <span className="flex items-center gap-2 text-sm text-ink">
                <CalendarClock className="h-4 w-4 text-whisky-600" />
                {fmt(s.startsAt)}
                {s.durationMinutes ? (
                  <span className="text-charcoal-500">· {s.durationMinutes} min</span>
                ) : null}
                {s.priceOverride != null ? (
                  <span className="text-charcoal-500">· ${Number(s.priceOverride).toFixed(2)}</span>
                ) : null}
              </span>
              <span
                className={`flex items-center gap-1 text-xs ${
                  tooSmall ? 'text-status-danger' : 'text-charcoal-500'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                {tooSmall
                  ? `only ${s.remaining} left`
                  : `${s.remaining} spot${s.remaining === 1 ? '' : 's'} left`}
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-xs text-charcoal-500">
        Capacity is enforced — you can only book a session with room for your party.
      </p>
    </div>
  )
}
