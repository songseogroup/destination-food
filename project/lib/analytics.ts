// Lightweight, fire-and-forget analytics client for the customer site.
//
// Records anonymous page views and clicks against the backend analytics API
// (POST /analytics/track, public, no auth). Every call here is best-effort:
// analytics must NEVER throw, block render, or break a page, so all failures
// are swallowed. Everything is guarded behind a browser check because these
// helpers can be reached from server components.

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

export type EntityType = 'bar' | 'distillery' | 'event' | 'blog' | 'homepage' | 'ad'
type EventType = 'view' | 'click'

const SESSION_KEY = 'dw_session_id'

// Views already fired during this page-load, keyed by `${entityType}:${entityId}`.
// Guards against duplicate sends (e.g. React strict-mode double effects).
const sentViews = new Set<string>()

function isBrowser(): boolean {
  return typeof window !== 'undefined'
}

// Anonymous, per-visitor id. Generated once and persisted in localStorage so
// the same browser reuses it across page-loads. Never identifies the user.
function getSessionId(): string | undefined {
  if (!isBrowser()) return undefined
  try {
    let id = window.localStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      window.localStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    // localStorage can throw (private mode, blocked storage) — tracking still
    // works, just without a stable session id.
    return undefined
  }
}

// Only the fields the API whitelists — it runs forbidNonWhitelisted and 400s on
// anything extra, so never add keys here without a matching backend field.
interface TrackPayload {
  eventType?: EventType
  entityType: EntityType
  entityId?: number
  sessionId?: string
  path?: string
  referrer?: string
}

function send(payload: TrackPayload): void {
  if (!isBrowser()) return
  try {
    const url = `${API_BASE}/analytics/track`
    const body = JSON.stringify(payload)

    // sendBeacon survives navigation (e.g. a click that immediately routes
    // away), so prefer it when available.
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
      return
    }

    fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => undefined)
  } catch {
    // Never let analytics break the page.
  }
}

function track(eventType: EventType, entityType: EntityType, entityId?: number): void {
  if (!isBrowser()) return
  try {
    const payload: TrackPayload = {
      eventType,
      entityType,
      sessionId: getSessionId(),
      path: window.location.pathname,
      referrer: document.referrer,
    }
    // Omit entityId entirely for id-less entities (e.g. homepage). Sending
    // undefined is fine — JSON.stringify drops it — but be explicit.
    if (typeof entityId === 'number' && !Number.isNaN(entityId)) {
      payload.entityId = entityId
    }
    send(payload)
  } catch {
    // Swallow — analytics is best-effort.
  }
}

// Fires at most once per (entityType, entityId) per page-load.
export function trackView(entityType: EntityType, entityId?: number): void {
  const key = `${entityType}:${entityId ?? ''}`
  if (sentViews.has(key)) return
  sentViews.add(key)
  track('view', entityType, entityId)
}

export function trackClick(entityType: EntityType, entityId?: number): void {
  track('click', entityType, entityId)
}
