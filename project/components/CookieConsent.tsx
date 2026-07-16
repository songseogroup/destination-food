'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'
import { getConsent, setConsent } from '../lib/consent'

export default function CookieConsent() {
  const [show, setShow] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [analytics, setAnalytics] = useState(true)
  const [marketing, setMarketing] = useState(true)

  useEffect(() => {
    // Defer to next tick so SSR/hydration is clean.
    const t = setTimeout(() => setShow(!getConsent()), 100)
    return () => clearTimeout(t)
  }, [])

  if (!show) return null

  const acceptAll = () => {
    setConsent({ analytics: true, marketing: true })
    setShow(false)
  }
  const rejectAll = () => {
    setConsent({ analytics: false, marketing: false })
    setShow(false)
  }
  const savePreferences = () => {
    setConsent({ analytics, marketing })
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur border border-charcoal-200 rounded-2xl shadow-lifted text-ink p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex w-10 h-10 flex-shrink-0 items-center justify-center rounded-xl bg-whisky-100 text-whisky-700">
            <Cookie className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            {!showDetails ? (
              <>
                <h3 className="font-display font-semibold text-ink">We use cookies</h3>
                <p className="text-sm text-charcoal-600 mt-1 leading-relaxed">
                  We use cookies to keep you signed in, remember your cart, and (with your permission) understand how
                  you use the site so we can make it better.{' '}
                  <Link href="/cookies" className="text-whisky-700 hover:text-whisky-600 underline">
                    Learn more
                  </Link>
                  .
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    onClick={acceptAll}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Accept all
                  </button>
                  <button
                    onClick={rejectAll}
                    className="btn-secondary px-4 py-2 text-sm"
                  >
                    Reject non-essential
                  </button>
                  <button
                    onClick={() => setShowDetails(true)}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    Customize
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display font-semibold text-ink">Cookie preferences</h3>
                <p className="text-sm text-charcoal-600 mt-1">
                  Pick which categories you&apos;re happy with. You can change this any time from{' '}
                  <Link href="/cookies" className="text-whisky-700 hover:text-whisky-600 underline">
                    Cookie settings
                  </Link>
                  .
                </p>
                <div className="mt-4 space-y-3">
                  <Category
                    name="Essential"
                    description="Sign-in tokens, cart contents, security — the site doesn't work without these."
                    checked
                    disabled
                  />
                  <Category
                    name="Analytics"
                    description="Helps us understand which pages people use most so we can improve the experience."
                    checked={analytics}
                    onChange={setAnalytics}
                  />
                  <Category
                    name="Marketing"
                    description="Used to show you relevant offers from us and our partners. No third-party ad networks."
                    checked={marketing}
                    onChange={setMarketing}
                  />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={savePreferences}
                    className="btn-primary px-4 py-2 text-sm"
                  >
                    Save preferences
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="btn-ghost px-4 py-2 text-sm"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={rejectAll}
            className="flex-shrink-0 p-1 text-charcoal-400 transition-colors hover:text-ink"
            aria-label="Reject and close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function Category({
  name,
  description,
  checked,
  onChange,
  disabled,
}: {
  name: string
  description: string
  checked: boolean
  onChange?: (next: boolean) => void
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-start gap-3 p-3 rounded-xl border border-charcoal-200 transition-colors ${
        disabled ? 'bg-charcoal-50' : 'cursor-pointer hover:bg-charcoal-50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-charcoal-300 accent-whisky-500"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-ink">
          {name}
          {disabled && <span className="ml-2 text-xs text-charcoal-400">(always on)</span>}
        </p>
        <p className="text-xs text-charcoal-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </label>
  )
}
