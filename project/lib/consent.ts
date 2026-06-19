/**
 * Cookie consent state — persisted in localStorage.
 *
 * The user can accept/reject each category. We always honor "essential" since
 * the platform doesn't work without it (auth tokens, cart state, etc).
 *
 * Bump CONSENT_VERSION when the categories or wording change, so existing
 * visitors are re-asked.
 */

export const CONSENT_VERSION = 1
const STORAGE_KEY = 'dw_cookie_consent_v1'

export interface ConsentChoices {
  essential: true // always on
  analytics: boolean
  marketing: boolean
  decidedAt: string // ISO timestamp
  version: number
}

export function getConsent(): ConsentChoices | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentChoices
    if (parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function setConsent(choices: { analytics: boolean; marketing: boolean }) {
  if (typeof window === 'undefined') return
  const record: ConsentChoices = {
    essential: true,
    analytics: choices.analytics,
    marketing: choices.marketing,
    decidedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  window.dispatchEvent(new CustomEvent('dw:consent-changed', { detail: record }))
}

export function clearConsent() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('dw:consent-changed'))
}

/**
 * Guard analytics / marketing pixels behind this — they will silently
 * no-op until the user has granted permission for that category.
 */
export function isAnalyticsAllowed(): boolean {
  return !!getConsent()?.analytics
}

export function isMarketingAllowed(): boolean {
  return !!getConsent()?.marketing
}

/**
 * Lightweight in-app event tracker. By default it just logs to the console;
 * once you wire Google Analytics / Plausible / etc., have them subscribe to
 * the dw:track event. Calls are dropped if analytics consent is not given.
 */
export function track(eventName: string, props?: Record<string, any>) {
  if (typeof window === 'undefined') return
  if (!isAnalyticsAllowed()) return
  const payload = { event: eventName, props: props || {}, at: new Date().toISOString() }
  // eslint-disable-next-line no-console
  console.debug('[track]', payload)
  window.dispatchEvent(new CustomEvent('dw:track', { detail: payload }))
}
