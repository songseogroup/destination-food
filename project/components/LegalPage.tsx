'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import Header from './Header'
import Footer from './Footer'

const LEGAL_NAV = [
  { href: '/terms', label: 'Terms of Service' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/refund-policy', label: 'Refunds & Cancellations' },
  { href: '/review-guidelines', label: 'Review Guidelines' },
  { href: '/cookies', label: 'Cookie Policy' },
]

/**
 * Shared chrome for the policy pages.
 *
 * They're read rarely but at tense moments — someone chasing a refund, or
 * deciding whether to trust us with their details. So: one column, generous
 * measure, and every other policy one click away, rather than five pages that
 * each look slightly different.
 */
export default function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string
  /** Plain date string, e.g. "17 July 2026". */
  updated: string
  intro?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <header>
          <h1 className="section-title">{title}</h1>
          <p className="mt-2 text-sm text-charcoal-500">Last updated {updated}</p>
          {intro && <p className="mt-4 text-lg leading-relaxed text-charcoal-700">{intro}</p>}
        </header>

        <article className="prose-whisky mt-8 space-y-6 text-charcoal-700">{children}</article>

        <nav className="mt-12 border-t border-charcoal-200 pt-6" aria-label="Other policies">
          <p className="text-xs uppercase tracking-wider text-charcoal-400">Other policies</p>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            {LEGAL_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-charcoal-600 underline-offset-4 transition-colors hover:text-whisky-700 hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-8 text-sm text-charcoal-600">
          Questions about any of this? Email{' '}
          <a href="mailto:hello@destinationwhisky.life" className="text-whisky-700 underline">
            hello@destinationwhisky.life
          </a>{' '}
          or use our{' '}
          <Link href="/feedback" className="text-whisky-700 underline">
            feedback form
          </Link>
          .
        </p>
      </main>
      <Footer />
    </div>
  )
}

/** A titled section within a policy. */
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-ink">{heading}</h2>
      {children}
    </section>
  )
}
