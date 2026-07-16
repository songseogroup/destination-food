import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface SectionProps {
  title: string
  subtitle?: string
  /** Renders a "View all" link beside the heading. */
  viewAllHref?: string
  viewAllLabel?: string
  /** Alternates the page rhythm — cream vs white bands. */
  tone?: 'cream' | 'white'
  align?: 'center' | 'left'
  children: React.ReactNode
  className?: string
}

/**
 * Shared section chrome for the homepage bands. Each Featured* component
 * previously hand-rolled its own heading block with slightly different
 * spacing and type sizes.
 */
export default function Section({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = 'View all',
  tone = 'cream',
  align = 'center',
  children,
  className = '',
}: SectionProps) {
  return (
    <section className={`py-16 ${tone === 'white' ? 'bg-white' : 'bg-cream'} ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`mb-10 ${
            align === 'center'
              ? 'text-center'
              : 'flex flex-wrap items-end justify-between gap-4'
          }`}
        >
          <div className={align === 'center' ? '' : 'max-w-2xl'}>
            <h2 className="section-title">{title}</h2>
            {subtitle && (
              <p className={`mt-3 ${align === 'center' ? 'section-subtitle' : 'text-lg text-charcoal-600'}`}>
                {subtitle}
              </p>
            )}
          </div>

          {viewAllHref && align === 'left' && (
            <Link
              href={viewAllHref}
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-whisky-700 transition-colors hover:text-whisky-600"
            >
              {viewAllLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>

        {children}

        {viewAllHref && align === 'center' && (
          <div className="mt-12 text-center">
            <Link href={viewAllHref} className="btn-secondary">
              {viewAllLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}

/** Consistent empty state — replaces four different hand-rolled "Coming Soon" blocks. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    // Centred as a flex column, not with text-center + mx-auto. Tailwind's
    // preflight sets `svg { display: block }`, so a lucide icon is a block box:
    // text-center has no effect on it, and mx-auto on a full-width wrapper div
    // has nothing to centre against. Both left-aligned the icon while the copy
    // stayed centred.
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-charcoal-300 bg-white/60 px-6 py-16 text-center">
      {icon && <div className="mb-4 text-charcoal-300">{icon}</div>}
      <h3 className="font-display text-xl font-semibold text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-md text-charcoal-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/**
 * Standard responsive grid for browse pages (/bars, /distilleries, /events).
 * Four-up at xl to match the carousel rows on the homepage.
 */
export function ListingGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {children}
    </div>
  )
}
