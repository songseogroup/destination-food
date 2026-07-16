/**
 * Display formatting helpers.
 *
 * Money and rating values arrive from the API as strings: `price`/`capacity` are
 * varchar columns on the Event entity, and `rating` is decimal(3,2) which
 * node-postgres serialises as a string. Everything here is defensive about that.
 */

/** Platform currency. The pay plan specifies AUD first, multi-currency later. */
export const CURRENCY = 'AUD'

/** Dates: en-AU gives "Fri, 14 Aug" rather than the US "Aug 14". */
export const LOCALE = 'en-AU'

/**
 * Money is formatted with en-US on purpose. In en-AU, AUD is the *local*
 * currency so Intl renders it as a bare "$89" — indistinguishable from USD for
 * the international audience that browses these listings. en-US renders the same
 * amount as "A$89", which is unambiguous. (byFood does the same thing, showing
 * "US$68.57" rather than "$68.57".)
 */
const CURRENCY_LOCALE = 'en-US'

/**
 * Formats a price for display. Accepts "89", "89.00", 89, "A$89" or junk.
 * Returns null when there is genuinely no price, so callers can omit the row
 * rather than render "A$0".
 */
export function formatPrice(
  value: number | string | null | undefined,
  currency: string = CURRENCY,
): string | null {
  if (value === null || value === undefined || value === '') return null

  // Tolerate values that already carry a symbol or thousands separators.
  const numeric =
    typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))

  if (!Number.isFinite(numeric)) {
    // Not parseable as a number — it's probably already a label like "$$" or
    // "Free". Show it as-is rather than swallowing it.
    return String(value)
  }
  if (numeric <= 0) return null

  return new Intl.NumberFormat(CURRENCY_LOCALE, {
    style: 'currency',
    currency,
    // Whole dollars stay clean (A$89), cents survive when they matter (A$89.50).
    minimumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numeric)
}

/** "Thu 14 Aug" — compact enough for a card meta line. */
export function formatEventDate(date: string | null | undefined): string | null {
  if (!date) return null
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return date
  return new Intl.DateTimeFormat(LOCALE, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(d)
}

/** "6:30 pm" from a "18:30" column. */
export function formatEventTime(time: string | null | undefined): string | null {
  if (!time) return null
  const m = time.match(/^(\d{1,2}):(\d{2})/)
  if (!m) return time
  const d = new Date()
  d.setHours(Number(m[1]), Number(m[2]), 0, 0)
  return new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' }).format(d)
}
