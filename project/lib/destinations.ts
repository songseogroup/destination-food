import type { DestinationData } from '../components/DestinationView'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export interface DestinationIndex {
  cities: { city: string; country: string | null; count: number }[]
  countries: { country: string; count: number }[]
}

/**
 * Server-side fetches for the destination pages.
 *
 * These pages exist to be indexed and shared, so they render on the server —
 * which means the data has to be fetched here, not in a client effect. Revalidated
 * hourly: a new listing appearing on a city page within the hour is fine, and it
 * keeps every crawl from hitting the database.
 */
const REVALIDATE_SECONDS = 3600

export async function fetchDestinationIndex(): Promise<DestinationIndex | null> {
  try {
    const res = await fetch(`${API_BASE}/destinations`, {
      next: { revalidate: REVALIDATE_SECONDS },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    // The API being down shouldn't crash the page — the caller renders an
    // honest empty state instead of a stack trace.
    return null
  }
}

export async function fetchDestination(
  kind: 'city' | 'country',
  value: string,
): Promise<DestinationData | null> {
  const path =
    kind === 'country'
      ? `${API_BASE}/destinations/country/${encodeURIComponent(value)}`
      : `${API_BASE}/destinations/${encodeURIComponent(value)}`
  try {
    const res = await fetch(path, { next: { revalidate: REVALIDATE_SECONDS } })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/** "sydney" -> "Sydney", "new-south-wales" -> "New South Wales" */
export function unslug(slug: string): string {
  return decodeURIComponent(slug)
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

/** "Sydney" -> "sydney" */
export function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-')
}
