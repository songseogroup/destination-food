/**
 * Public storefront URL.
 *
 * The CMS and the customer site are separate Next apps on separate origins, so
 * any "Preview" affordance must point at an absolute URL. Previously the
 * homepage Preview button did `window.open('/')`, which opened the CMS's own
 * root — and app/page.tsx redirects that straight to /login, so Preview always
 * landed on the admin login screen.
 *
 * Set NEXT_PUBLIC_SITE_URL per environment (e.g. https://destinationwhisky.life).
 * The default matches the local dev server in .claude/launch.json.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '')

/** Builds an absolute storefront URL. `siteUrl('/bars/12')` -> `https://…/bars/12`. */
export function siteUrl(path = '/'): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${SITE_URL}${suffix}`
}

/** Opens a storefront path in a new tab, safely (no reverse-tabnabbing). */
export function openSite(path = '/'): void {
  window.open(siteUrl(path), '_blank', 'noopener,noreferrer')
}

/** Public URL for a listing — used by per-entity Preview buttons. */
export function listingUrl(type: 'bars' | 'distilleries' | 'events', id: number | string) {
  return siteUrl(`/${type}/${id}`)
}
