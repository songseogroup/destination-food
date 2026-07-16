'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Instagram, Facebook, Youtube, Mail, MapPin } from 'lucide-react'
import Logo from './Logo'

/** X (formerly Twitter) — lucide dropped its Twitter glyph, so inline it. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

/**
 * Shipped footer copy — the guaranteed fallback. The CMS `site_footer` section
 * can override any of these fields, but a failed/absent fetch must never blank
 * the footer, so these values always render when an override is missing.
 */
const FOOTER_DEFAULTS = {
  tagline:
    'The marketplace for whisky experiences — tastings, distillery tours, bar events and festivals. Book direct, drink well.',
  email: 'hello@destinationwhisky.life',
  location: 'Sydney, Australia',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  youtube: 'https://youtube.com',
  twitter: 'https://x.com',
  copyright: `© ${new Date().getFullYear()} Destination Whisky. All rights reserved.`,
}

type FooterCopy = typeof FOOTER_DEFAULTS

/** Structure is fixed; only these labels/hrefs come from the CMS. */
const SOCIAL_LINKS = [
  { label: 'Instagram', key: 'instagram', Icon: Instagram },
  { label: 'Facebook', key: 'facebook', Icon: Facebook },
  { label: 'YouTube', key: 'youtube', Icon: Youtube },
  { label: 'X', key: 'twitter', Icon: XIcon },
] as const

const EXPLORE = [
  { href: '/bars', label: 'Whisky Bars' },
  { href: '/distilleries', label: 'Distilleries' },
  { href: '/events', label: 'Events' },
  { href: '/collections', label: 'Collections' },
  { href: '/blog', label: 'Journal' },
]

const COMPANY = [
  { href: '/about', label: 'About us' },
  { href: '/feedback', label: 'Send feedback' },
  { href: '/cookies', label: 'Cookie policy' },
]

/** Keep a provided string, else fall back to the shipped default. */
function pick(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback
}

export default function Footer() {
  const [copy, setCopy] = useState<FooterCopy>(FOOTER_DEFAULTS)

  useEffect(() => {
    let cancelled = false
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
    // GET /homepage/site_footer → { section, content } or 404 when never set.
    // On any failure we keep the shipped defaults — the footer never blanks.
    fetch(`${base}/homepage/site_footer`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || typeof data.content !== 'object' || !data.content) return
        const c = data.content
        setCopy({
          tagline: pick(c.tagline, FOOTER_DEFAULTS.tagline),
          email: pick(c.email, FOOTER_DEFAULTS.email),
          location: pick(c.location, FOOTER_DEFAULTS.location),
          instagram: pick(c.instagram, FOOTER_DEFAULTS.instagram),
          facebook: pick(c.facebook, FOOTER_DEFAULTS.facebook),
          youtube: pick(c.youtube, FOOTER_DEFAULTS.youtube),
          twitter: pick(c.twitter, FOOTER_DEFAULTS.twitter),
          copyright: pick(c.copyright, FOOTER_DEFAULTS.copyright),
        })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <footer className="bg-charcoal-900 text-charcoal-300">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Logo className="text-whisky-400" />
            <p className="mt-5 max-w-md leading-relaxed text-charcoal-400">{copy.tagline}</p>

            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ label, key, Icon }) => (
                <a
                  key={label}
                  href={copy[key]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full border border-charcoal-700 text-charcoal-400 transition-colors hover:border-whisky-500 hover:text-whisky-400"
                >
                  <span className="sr-only">{label}</span>
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-display text-base font-semibold text-white">Explore</h4>
            <ul className="space-y-3">
              {EXPLORE.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-charcoal-400 transition-colors hover:text-whisky-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-display text-base font-semibold text-white">Company</h4>
            <ul className="space-y-3">
              {COMPANY.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-charcoal-400 transition-colors hover:text-whisky-400">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Location and email are CMS-overridable via the site_footer section. */}
            <div className="mt-6 space-y-2.5 text-sm">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-whisky-500" />
                {copy.location}
              </p>
              <a
                href={`mailto:${copy.email}`}
                className="flex items-center gap-2 transition-colors hover:text-whisky-400"
              >
                <Mail className="h-4 w-4 shrink-0 text-whisky-500" />
                {copy.email}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-charcoal-800 pt-8 text-sm text-charcoal-500 sm:flex-row">
          <p>{copy.copyright}</p>
          <p>Please enjoy responsibly. 18+</p>
        </div>
      </div>
    </footer>
  )
}
