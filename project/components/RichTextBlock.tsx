import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Generic rich-text / CTA band, placeable anywhere on the homepage.
 *
 * Keyed `rich_text` (or `rich_text:<n>` for additional blocks) in the CMS. Every
 * field is optional and falls back to nothing — an empty block renders null so a
 * half-configured row never leaves a blank band on the page.
 *
 * Mirrors the field set in cms-admin RICH_TEXT_SECTION_DEF:
 *   heading, body, ctaLabel, ctaHref, tone (cream|white), align (left|center).
 */
export default function RichTextBlock({ content }: { content: Record<string, any> }) {
  const c = content || {}
  const heading = typeof c.heading === 'string' ? c.heading.trim() : ''
  const body = typeof c.body === 'string' ? c.body.trim() : ''
  const ctaLabel = typeof c.ctaLabel === 'string' ? c.ctaLabel.trim() : ''
  const ctaHref = typeof c.ctaHref === 'string' ? c.ctaHref.trim() : ''
  const tone: 'cream' | 'white' = c.tone === 'white' ? 'white' : 'cream'
  const align: 'left' | 'center' = c.align === 'center' ? 'center' : 'left'

  // Nothing to say — render nothing rather than an empty band.
  if (!heading && !body) return null

  const centered = align === 'center'
  const showCta = !!ctaLabel && !!ctaHref

  return (
    <section className="w-full">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div
          className={`rounded-3xl px-6 py-10 sm:px-10 sm:py-12 ${
            tone === 'cream'
              ? 'bg-whisky-50 ring-1 ring-whisky-100'
              : 'bg-white ring-1 ring-charcoal-200'
          } ${centered ? 'text-center' : 'text-left'}`}
        >
          <div className={`max-w-2xl ${centered ? 'mx-auto' : ''}`}>
            {heading && (
              <h2 className="font-display text-2xl font-bold leading-tight text-ink sm:text-3xl">
                {heading}
              </h2>
            )}
            {body && (
              <p
                className={`whitespace-pre-line leading-relaxed text-charcoal-600 ${
                  heading ? 'mt-4' : ''
                }`}
              >
                {body}
              </p>
            )}
            {showCta && (
              <div className={`mt-6 flex ${centered ? 'justify-center' : 'justify-start'}`}>
                <Link href={ctaHref} className="btn-primary">
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
