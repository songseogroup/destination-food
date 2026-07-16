'use client'

import { useEffect, useState } from 'react'
import { Cookie, RefreshCw } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { CONSENT_VERSION, ConsentChoices, clearConsent, getConsent, setConsent } from '../../lib/consent'

export default function CookiesPage() {
  const [consent, setStoredConsent] = useState<ConsentChoices | null>(null)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    const existing = getConsent()
    setStoredConsent(existing)
    setAnalytics(existing?.analytics ?? true)
    setMarketing(existing?.marketing ?? true)
  }, [])

  const save = () => {
    setConsent({ analytics, marketing })
    setStoredConsent(getConsent())
  }

  const reset = () => {
    clearConsent()
    setStoredConsent(null)
    setAnalytics(false)
    setMarketing(false)
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-whisky-100 text-whisky-600">
            <Cookie className="h-6 w-6" />
          </div>
          <h1 className="font-display text-3xl font-bold text-ink">Cookie settings</h1>
        </div>
        <p className="mb-10 leading-relaxed text-charcoal-600">
          We use cookies to keep you signed in, remember your cart, and — with your permission — understand how you use
          the site. You can change your preferences any time on this page.
        </p>

        <section className="card mb-8 p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Your preferences</h2>
          <div className="space-y-3">
            <Toggle
              name="Essential"
              description="Sign-in tokens, cart contents, security. The site cannot function without these — they cannot be disabled."
              checked
              disabled
            />
            <Toggle
              name="Analytics"
              description="Anonymous data about which pages are visited and how long for. Helps us improve the site."
              checked={analytics}
              onChange={setAnalytics}
            />
            <Toggle
              name="Marketing"
              description="Used to show you relevant offers from us. We don't sell your data and don't use third-party ad networks."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={save} className="btn-primary px-4 py-2 text-sm">
              Save preferences
            </button>
            <button onClick={reset} className="btn-secondary px-4 py-2 text-sm">
              <RefreshCw className="h-4 w-4" />
              Reset choice
            </button>
            <span className="ml-auto text-xs text-charcoal-500">
              Consent version: v{CONSENT_VERSION}
              {consent?.decidedAt && (
                <>
                  {' · '}Last decided: {new Date(consent.decidedAt).toLocaleString()}
                </>
              )}
            </span>
          </div>
        </section>

        <section className="max-w-none leading-relaxed text-charcoal-600">
          <h2 className="font-display text-xl font-semibold text-ink">What we store</h2>
          <p className="mt-2">
            We only use first-party cookies and localStorage entries set by Destination Whisky itself. We don&apos;t use
            third-party advertising trackers.
          </p>
          {/*
            These names must match the real keys — byfoods_* is the legacy prefix
            kept deliberately, since renaming would sign out every live user.
            See contexts/CustomerAuthContext.tsx and contexts/CartContext.tsx.
          */}
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
            <li>
              <strong className="font-semibold text-ink">byfoods_customer</strong> — your sign-in token and your account
              profile cached locally for faster page loads (essential)
            </li>
            <li>
              <strong className="font-semibold text-ink">byfoods_cart</strong> — what you&apos;ve added to your cart
              (essential)
            </li>
            <li>
              <strong className="font-semibold text-ink">dw_cookie_consent_v1</strong> — your choices on this page
              (essential)
            </li>
          </ul>
          <p className="mt-4">
            If you opt into analytics, we may also load a privacy-friendly analytics script that records anonymized page
            views. No personally identifying information is ever sold or shared with advertising networks.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function Toggle({
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
      className={`flex items-start gap-3 rounded-xl border border-charcoal-200 p-4 transition-colors ${
        disabled ? 'bg-charcoal-50' : 'cursor-pointer hover:border-charcoal-300 hover:bg-charcoal-50'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-charcoal-300 accent-whisky-500"
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">
          {name}
          {disabled && <span className="ml-2 text-xs text-charcoal-500">(always on)</span>}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-charcoal-600">{description}</p>
      </div>
    </label>
  )
}
