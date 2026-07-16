'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { listingUrl, siteUrl } from '@/lib/site'

export interface ListingStatRow {
  id: number | string
  name: string
  views: number
  clicks: number
}

type ListingType = 'bars' | 'distilleries' | 'events' | 'blogs'

interface ListingStatsTableProps {
  title: string
  rows: ListingStatRow[]
  type: ListingType
}

/** CMS edit path. Blogs have no per-id detail route, so link to the list. */
function cmsHref(type: ListingType, id: number | string) {
  return type === 'blogs' ? '/dashboard/blogs' : `/dashboard/${type}/${id}`
}

/** Public storefront path. Blogs live at /blog/:id; the rest use listingUrl. */
function previewHref(type: ListingType, id: number | string) {
  if (type === 'blogs') return siteUrl(`/blog/${id}`)
  return listingUrl(type, id)
}

export function ListingStatsTable({ title, rows, type }: ListingStatsTableProps) {
  // API already returns these sorted by views desc; re-sort defensively.
  const sorted = [...rows].sort((a, b) => b.views - a.views)

  return (
    <section className="card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-charcoal-200 px-5 py-4">
        <h3 className="section-title">{title}</h3>
        <span className="pill">
          {sorted.length} listing{sorted.length === 1 ? '' : 's'}
        </span>
      </div>

      {sorted.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-charcoal-400">No activity in this range yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-charcoal-200 text-left text-xs uppercase tracking-wide text-charcoal-500">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 text-right font-semibold">Views</th>
                <th className="px-5 py-3 text-right font-semibold">Clicks</th>
                <th className="px-5 py-3 text-right font-semibold">Links</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.id} className="border-b border-charcoal-100 last:border-0 hover:bg-charcoal-50">
                  <td className="px-5 py-3">
                    <Link href={cmsHref(type, row.id)} className="font-medium text-ink hover:text-whisky-700">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-ink">{row.views.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-charcoal-600">{row.clicks.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={cmsHref(type, row.id)}
                        className="text-xs font-medium text-whisky-700 hover:text-whisky-800"
                      >
                        Edit
                      </Link>
                      <a
                        href={previewHref(type, row.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-charcoal-500 hover:text-ink"
                      >
                        Preview <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ListingStatsTable
