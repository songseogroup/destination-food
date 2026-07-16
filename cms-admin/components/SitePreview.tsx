'use client'

import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  ExternalLink,
  Monitor,
  RefreshCw,
  Smartphone,
  Tablet,
} from 'lucide-react'
import { SITE_URL, openSite, siteUrl } from '@/lib/site'

/**
 * Live preview of the storefront.
 *
 * The site is a different origin (:3000 vs the CMS on :3002), so everything
 * here is deliberately hands-off: we can't read `contentWindow.location` or
 * poke at the document without a cross-origin throw. Refreshing therefore
 * remounts the iframe by changing its `key` rather than reassigning its src.
 *
 * The frame can also be refused outright (X-Frame-Options / CSP frame-ancestors
 * on the storefront, which we don't control from here). We can't reliably detect
 * that cross-origin — a refused frame may still fire `load` — so instead of
 * pretending, we surface a fallback after a load timeout and always keep an
 * "Open in new tab" escape hatch on screen.
 */

type Device = 'desktop' | 'tablet' | 'mobile'

const DEVICES: { id: Device; label: string; icon: typeof Monitor; width: string }[] = [
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: '100%' },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: '768px' },
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: '375px' },
]

/** How long to wait before assuming the frame is never going to paint. */
const LOAD_TIMEOUT_MS = 10000

interface SitePreviewProps {
  /** Bump to force a reload — the builder does this after a successful save. */
  refreshToken?: number
  /** Storefront path to preview. */
  path?: string
}

export function SitePreview({ refreshToken = 0, path = '/' }: SitePreviewProps) {
  const [device, setDevice] = useState<Device>('desktop')
  const [nonce, setNonce] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'blocked'>('loading')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A save (or the Refresh button) remounts the frame via its key.
  useEffect(() => {
    if (refreshToken > 0) setNonce((value) => value + 1)
  }, [refreshToken])

  useEffect(() => {
    setStatus('loading')
    timerRef.current = setTimeout(() => {
      setStatus((current) => (current === 'loading' ? 'blocked' : current))
    }, LOAD_TIMEOUT_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [nonce, path])

  const settle = (next: 'ready' | 'blocked') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setStatus(next)
  }

  const activeWidth = DEVICES.find((entry) => entry.id === device)?.width ?? '100%'

  return (
    <div className="card flex h-full flex-col p-0">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal-200 p-4">
        <div>
          <h2 className="section-title">Live preview</h2>
          <p className="mt-0.5 truncate text-xs text-charcoal-500">{siteUrl(path)}</p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-full bg-charcoal-100 p-1"
            role="group"
            aria-label="Preview width"
          >
            {DEVICES.map((entry) => {
              const Icon = entry.icon
              const isActive = entry.id === device
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => setDevice(entry.id)}
                  aria-label={`${entry.label} width`}
                  aria-pressed={isActive}
                  title={entry.label}
                  className={joinClasses(
                    'rounded-full p-1.5 transition-colors',
                    isActive
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-charcoal-500 hover:text-ink'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setNonce((value) => value + 1)}
            className="btn-ghost"
            title="Reload the preview"
          >
            <RefreshCw
              className={joinClasses('h-4 w-4', status === 'loading' && 'animate-spin')}
            />
            Refresh
          </button>

          <button type="button" onClick={() => openSite(path)} className="btn-secondary">
            <ExternalLink className="h-4 w-4" />
            Open
          </button>
        </div>
      </div>

      {/* Frame */}
      <div className="relative flex-1 overflow-auto bg-charcoal-100 p-4">
        {status === 'blocked' ? (
          <PreviewFallback path={path} onRetry={() => setNonce((value) => value + 1)} />
        ) : (
          <div className="mx-auto h-full transition-[width] duration-200" style={{ width: activeWidth }}>
            <iframe
              key={`${nonce}-${path}`}
              src={siteUrl(path)}
              title="Storefront preview"
              className="h-full min-h-[32rem] w-full rounded-xl border border-charcoal-200 bg-white shadow-card"
              onLoad={() => settle('ready')}
              onError={() => settle('blocked')}
            />
          </div>
        )}

        {status === 'loading' ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="pill bg-white shadow-card">Loading preview…</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function PreviewFallback({ path, onRetry }: { path: string; onRetry: () => void }) {
  return (
    <div className="flex h-full min-h-[32rem] items-center justify-center">
      <div className="max-w-sm rounded-2xl border border-charcoal-200 bg-white p-6 text-center shadow-card">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-status-warningSoft text-status-warning">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-base font-semibold text-ink">Preview didn&apos;t load</h3>
        <p className="mt-2 text-sm leading-6 text-charcoal-500">
          The storefront at{' '}
          <span className="font-medium text-charcoal-700">{SITE_URL}</span> didn&apos;t render here.
          It may be offline, or refusing to be framed. Your changes are still saved.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <button type="button" onClick={onRetry} className="btn-secondary">
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <button type="button" onClick={() => openSite(path)} className="btn-primary">
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </button>
        </div>
      </div>
    </div>
  )
}

function joinClasses(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
