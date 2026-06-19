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
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-primary-500/20 text-primary-500 flex items-center justify-center">
            <Cookie className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Cookie settings</h1>
        </div>
        <p className="text-gray-400 leading-relaxed mb-10">
          We use cookies to keep you signed in, remember your cart, and — with your permission — understand how you use
          the site. You can change your preferences any time on this page.
        </p>

        <section className="bg-gray-900 rounded-2xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Your preferences</h2>
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
            <button
              onClick={save}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-lg text-sm"
            >
              Save preferences
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset choice
            </button>
            <span className="text-xs text-gray-500 ml-auto">
              Consent version: v{CONSENT_VERSION}
              {consent?.decidedAt && (
                <>
                  {' · '}Last decided: {new Date(consent.decidedAt).toLocaleString()}
                </>
              )}
            </span>
          </div>
        </section>

        <section className="prose prose-invert max-w-none text-gray-300 leading-relaxed">
          <h2 className="text-xl font-semibold text-white">What we store</h2>
          <p>
            We only use first-party cookies and localStorage entries set by Destination Whisky itself. We don&apos;t use
            third-party advertising trackers.
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-sm">
            <li>
              <strong>auth_token</strong> — your sign-in JWT (essential)
            </li>
            <li>
              <strong>customer</strong> — your account profile cached locally for faster page loads (essential)
            </li>
            <li>
              <strong>cart</strong> — what you&apos;ve added to your cart (essential)
            </li>
            <li>
              <strong>dw_cookie_consent_v1</strong> — your choices on this page (essential)
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
      className={`flex items-start gap-3 p-4 rounded-lg border border-gray-800 ${
        disabled ? 'bg-gray-800/40' : 'cursor-pointer hover:bg-gray-800/40'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-1 h-4 w-4 accent-primary-500 bg-gray-800 border-gray-700 rounded"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">
          {name}
          {disabled && <span className="ml-2 text-xs text-gray-500">(always on)</span>}
        </p>
        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </label>
  )
}
