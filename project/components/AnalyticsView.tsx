'use client'

import { useEffect } from 'react'
import { trackView, EntityType } from '../lib/analytics'

interface AnalyticsViewProps {
  entityType: EntityType
  entityId?: number
}

/**
 * Fires a single analytics "view" event on mount, then renders nothing.
 *
 * This lets a server component record a page view without itself becoming a
 * client component — just render <AnalyticsView entityType="homepage" /> inside
 * it. Tracking is fire-and-forget and never affects render.
 */
export default function AnalyticsView({ entityType, entityId }: AnalyticsViewProps) {
  useEffect(() => {
    trackView(entityType, entityId)
    // Fire once on mount; trackView itself de-dupes per page-load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
