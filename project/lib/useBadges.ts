'use client'

import { useEffect, useState } from 'react'
import { badgeKey, ListingBadge } from './badges'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

/**
 * All active badges, fetched once, as a lookup by listing.
 *
 * Decorating a grid of cards would otherwise be one request per card. The full
 * active-badge set is small — badges only ever land on top listings — so a
 * single fetch and an in-memory map is both cheaper and simpler. A failed fetch
 * just yields an empty map: cards render without badges rather than breaking.
 */
export function useBadges(): (entityType: string, entityId: number) => ListingBadge[] {
  const [byEntity, setByEntity] = useState<Record<string, ListingBadge[]>>({})

  useEffect(() => {
    let cancelled = false
    fetch(`${API_BASE}/badges`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: ListingBadge[]) => {
        if (cancelled) return
        const map: Record<string, ListingBadge[]> = {}
        for (const b of rows || []) {
          const key = badgeKey(b.entityType, b.entityId)
          ;(map[key] ||= []).push(b)
        }
        setByEntity(map)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return (entityType: string, entityId: number) => byEntity[badgeKey(entityType, entityId)] || []
}

/** One listing's badges, for a detail page. */
export function useEntityBadges(
  entityType: 'bar' | 'distillery' | 'event',
  entityId: number | undefined,
): ListingBadge[] {
  const [badges, setBadges] = useState<ListingBadge[]>([])

  useEffect(() => {
    if (!entityId) return
    let cancelled = false
    fetch(`${API_BASE}/badges/${entityType}/${entityId}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: ListingBadge[]) => {
        if (!cancelled) setBadges(rows || [])
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [entityType, entityId])

  return badges
}
