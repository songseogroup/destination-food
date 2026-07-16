'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, MapPin, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

/**
 * Homepage hero — a client-managed carousel.
 *
 * `content.slides` (from the CMS) is an array of slides, each with its own
 * image + text + optional CTA. The client adds/edits/reorders them in the
 * homepage builder. When there are no slides, the legacy single-hero fields
 * (title/subtitle/backgroundImage/…) render as one slide, so nothing breaks for
 * a banner saved before slides existed.
 *
 * The search box and "popular" chips are constant across slides — they're the
 * marketplace's function, not part of any one promo — so only the image + copy
 * rotate above them.
 */

const DEFAULTS = {
  highlight: "Australia's whisky marketplace",
  title: 'Find your next',
  subtitle: 'great dram',
  description:
    'Book whisky tastings, distillery tours, bar events and festivals — direct with the people who pour them.',
  image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1920&h=1080&fit=crop',
}

export interface HeroSlide {
  image?: string
  highlight?: string
  title?: string
  subtitle?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
}

interface BannerProps {
  content?: {
    /** Carousel slides. When present & non-empty, the hero rotates. */
    slides?: HeroSlide[]
    /** Legacy single-hero fields — used as slide 1 when `slides` is empty. */
    highlight?: string
    title?: string
    subtitle?: string
    description?: string
    backgroundImage?: string
    /** Constant across slides. */
    searchPlaceholder?: string
    popularSearches?: string[]
    /** Set false to hold on the first slide. Default true. */
    autoplay?: boolean
  }
}

const SLIDE_MS = 6000

const slideHasContent = (s: HeroSlide) =>
  !!(s && (s.image || s.title || s.subtitle || s.highlight || s.description))

export default function Banner({ content }: BannerProps = {}) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const popular = content?.popularSearches?.length
    ? content.popularSearches
    : ['Sydney', 'Melbourne', 'Hobart']

  // Resolve slides: CMS slides if any, else one synthesized from legacy fields.
  const slides: HeroSlide[] =
    content?.slides?.filter(slideHasContent).length
      ? content!.slides!.filter(slideHasContent)
      : [
          {
            image: content?.backgroundImage,
            highlight: content?.highlight,
            title: content?.title,
            subtitle: content?.subtitle,
            description: content?.description,
          },
        ]

  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const active = slides[Math.min(index, slides.length - 1)]

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + slides.length) % slides.length),
    [slides.length],
  )

  // Autoplay. Skipped for a single slide, when paused (hover/focus), or when the
  // visitor prefers reduced motion.
  const prefersReducedMotion = useRef(false)
  useEffect(() => {
    prefersReducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  useEffect(() => {
    if (slides.length <= 1) return
    if (paused) return
    if (content?.autoplay === false) return
    if (prefersReducedMotion.current) return
    // `index` is a dep so the timer re-arms after every advance — including a
    // manual dot/arrow click. That guarantees a full SLIDE_MS gap after the user
    // navigates, instead of a pending tick firing right on top of their click.
    const t = setTimeout(() => setIndex((i) => (i + 1) % slides.length), SLIDE_MS)
    return () => clearTimeout(t)
  }, [slides.length, paused, content?.autoplay, index])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    router.push(q ? `/collections?q=${encodeURIComponent(q)}` : '/collections')
  }

  const multi = slides.length > 1

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="relative flex min-h-[38rem] items-center justify-center overflow-hidden lg:min-h-[42rem]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Backgrounds crossfade; all mounted, only the active one visible. */}
      {slides.map((slide, i) => (
        <div
          key={i}
          aria-hidden={i !== index}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${
            i === index ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ backgroundImage: `url('${slide.image || DEFAULTS.image}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950/85 via-charcoal-900/75 to-charcoal-900/95" />
        </div>
      ))}

      {/* Prev / next — only when there's more than one slide. */}
      {multi && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-charcoal-950/40 text-white backdrop-blur transition-colors hover:bg-charcoal-950/70 md:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-charcoal-950/40 text-white backdrop-blur transition-colors hover:bg-charcoal-950/70 md:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
        {/* Rotating copy. Keyed by index so React swaps the whole block and it
            fades in — no AnimatePresence `mode="wait"`, which could stick on the
            first slide when navigation outpaced the exit animation. */}
        <div>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            aria-roledescription="slide"
            aria-label={multi ? `Slide ${index + 1} of ${slides.length}` : undefined}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-whisky-500/30 bg-whisky-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-whisky-300">
              {active.highlight || DEFAULTS.highlight}
            </span>

            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] text-white sm:text-5xl md:text-6xl">
              {active.title || DEFAULTS.title}
              {(active.subtitle || (!active.title && DEFAULTS.subtitle)) && (
                <span className="block text-whisky-400">{active.subtitle || DEFAULTS.subtitle}</span>
              )}
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-lg text-charcoal-200">
              {active.description || DEFAULTS.description}
            </p>

            {/* Optional per-slide CTA — a promotional link for this slide. The
                gold Search button below stays the primary marketplace action, so
                this is a subtle outline button. */}
            {active.ctaLabel && active.ctaHref && (
              <Link
                href={active.ctaHref}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:border-whisky-400 hover:text-whisky-300"
              >
                {active.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </motion.div>
        </div>

        {/* Constant search + popular chips (not part of any slide). */}
        <form
          onSubmit={handleSearch}
          className="mx-auto mt-8 flex max-w-xl flex-col gap-2 rounded-3xl bg-white/95 p-2 shadow-lifted backdrop-blur sm:flex-row sm:rounded-full"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={content?.searchPlaceholder || 'Search tastings, tours, distilleries...'}
              aria-label="Search whisky experiences"
              className="w-full rounded-full border-0 bg-transparent py-3 pl-11 pr-4 text-ink placeholder:text-charcoal-400 focus:outline-none focus:ring-0"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0 sm:px-8">
            Search
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <span className="inline-flex items-center gap-1.5 text-charcoal-300">
            <MapPin className="h-4 w-4 text-whisky-400" />
            Popular:
          </span>
          {popular.map((city) => (
            <Link
              key={city}
              href={`/collections?q=${encodeURIComponent(city)}`}
              className="text-charcoal-200 underline-offset-4 transition-colors hover:text-whisky-400 hover:underline"
            >
              {city}
            </Link>
          ))}
        </div>

        {/* Dots */}
        {multi && (
          <div className="mt-8 flex items-center justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-whisky-400' : 'w-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
