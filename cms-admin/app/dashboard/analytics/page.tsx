'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { StatTiles, StatTile } from '@/components/analytics/StatTiles'
import { MiniChart } from '@/components/analytics/MiniChart'
import { ListingStatsTable, ListingStatRow } from '@/components/analytics/ListingStatsTable'

type EntityKey = 'bar' | 'distillery' | 'event' | 'blog'

interface TypeTotals {
  views: number
  clicks: number
}

interface AnalyticsSummary {
  rangeDays: number
  scope: 'platform' | 'owner'
  totals: {
    views: number
    clicks: number
    byType: Partial<Record<EntityKey, TypeTotals>>
  }
  topListings: Partial<Record<EntityKey, ListingStatRow[]>>
  timeseries: { date: string; views: number; clicks: number }[]
}

const RANGES = [7, 30, 90]

// entityType -> table title + CMS path segment.
const TYPE_META: { key: EntityKey; title: string; type: 'bars' | 'distilleries' | 'events' | 'blogs' }[] = [
  { key: 'bar', title: 'Bars', type: 'bars' },
  { key: 'distillery', title: 'Distilleries', type: 'distilleries' },
  { key: 'event', title: 'Events', type: 'events' },
  { key: 'blog', title: 'Journal', type: 'blogs' },
]

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)

  const { data, isLoading, isError } = useQuery<AnalyticsSummary>(
    ['analytics-summary', days],
    () => api.get(`/analytics/summary?days=${days}`).then((res) => res.data),
    { keepPreviousData: true },
  )

  const header = (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Analytics</h1>
        <p className="section-description">Views and clicks across your listings.</p>
      </div>
      <div className="inline-flex rounded-full border border-charcoal-200 bg-white p-1 shadow-sm">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setDays(r)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              days === r ? 'bg-whisky-500 text-white shadow-sm' : 'text-charcoal-600 hover:text-ink'
            }`}
          >
            {r} days
          </button>
        ))}
      </div>
    </div>
  )

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        {header}
        <LoadingSpinner />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        {header}
        <div className="card text-center">
          <p className="font-medium text-ink">Couldn&apos;t load analytics</p>
          <p className="mt-2 text-sm text-charcoal-500">
            The analytics service didn&apos;t respond. Try again in a moment or switch the date range.
          </p>
        </div>
      </div>
    )
  }

  const byType = data.totals.byType || {}
  const tiles: StatTile[] = [
    { label: 'Total views', value: data.totals.views },
    { label: 'Total clicks', value: data.totals.clicks },
    ...TYPE_META.filter((m) => byType[m.key]).map((m) => ({
      label: m.title,
      value: byType[m.key]!.views,
      sub: `${byType[m.key]!.clicks.toLocaleString()} clicks`,
    })),
  ]

  const tables = TYPE_META.filter((m) => data.topListings[m.key])

  return (
    <div className="space-y-6">
      {header}

      <StatTiles tiles={tiles} />

      <section className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Views over time</h2>
            <p className="section-description">Daily views across the last {days} days.</p>
          </div>
          <span className="pill-gold">{data.scope === 'platform' ? 'Platform' : 'Your listings'}</span>
        </div>
        <div className="mt-4">
          <MiniChart data={data.timeseries} height={150} metric="views" />
        </div>
      </section>

      {tables.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {tables.map((m) => (
            <ListingStatsTable key={m.key} title={m.title} rows={data.topListings[m.key] || []} type={m.type} />
          ))}
        </div>
      ) : (
        <div className="card text-center text-sm text-charcoal-400">
          No listing activity to show for this date range yet.
        </div>
      )}
    </div>
  )
}
