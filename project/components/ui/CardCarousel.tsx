'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface CardCarouselProps {
  children: React.ReactNode
  /** Cards visible at the xl breakpoint. Defaults to 4. */
  perView?: 3 | 4
  /** Accessible name, e.g. "featured whisky bars". */
  label?: string
  className?: string
}

const EASE_OUT_CUBIC = (p: number) => 1 - Math.pow(1 - p, 3)

/**
 * Scrolls `el` to `to` using requestAnimationFrame.
 *
 * Deliberately NOT `scrollTo({behavior:'smooth'})`. Native smooth scrolling is
 * a silent no-op in some engines/embedded webviews — verified here: both
 * `scrollBy({behavior:'smooth'})` and CSS `scroll-behavior: smooth` left
 * scrollLeft at 0 while `behavior:'auto'` landed correctly, with
 * prefers-reduced-motion off. A carousel whose arrows quietly do nothing is
 * worse than one that jumps, so drive the animation ourselves.
 *
 * Snap is suspended for the duration: `scroll-snap-type` re-snaps on every
 * frame we write scrollLeft, which fights the animation and can also drag the
 * final position off a clamped end-of-track target.
 */
function animateScrollLeft(el: HTMLElement, to: number, duration = 380) {
  const start = el.scrollLeft
  const delta = to - start
  if (Math.abs(delta) < 1) return

  const previousSnap = el.style.scrollSnapType
  let settled = false

  /** Lands the scroll and restores snap. Idempotent — whoever gets here first wins. */
  const settle = () => {
    if (settled) return
    settled = true
    el.scrollLeft = to
    el.style.scrollSnapType = previousSnap
  }

  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (reduceMotion) {
    settle()
    return
  }

  el.style.scrollSnapType = 'none'

  /**
   * Failsafe. requestAnimationFrame does not run while the tab is hidden, so an
   * interrupted animation would otherwise (a) never land the scroll and (b)
   * leave scrollSnapType pinned to 'none' forever — both observed in testing.
   * setTimeout still fires in a background tab (clamped), so this guarantees we
   * always end in a consistent state.
   */
  const failsafe = window.setTimeout(settle, duration + 250)

  const t0 = performance.now()
  const step = (now: number) => {
    if (settled) return
    const p = Math.min(1, (now - t0) / duration)
    el.scrollLeft = start + delta * EASE_OUT_CUBIC(p)
    if (p < 1) {
      requestAnimationFrame(step)
    } else {
      window.clearTimeout(failsafe)
      settle()
    }
  }
  requestAnimationFrame(step)
}

/**
 * Horizontal card carousel with chevron controls.
 *
 * Four cards per row on desktop, stepping down to two on tablet and ~1.15 on
 * mobile so the next card peeks and the row reads as scrollable without the
 * arrows (which are pointer-only anyway).
 *
 * Scrolling is native overflow + scroll-snap rather than a transform/index
 * model: trackpad and touch swiping work for free, DOM order stays honest for
 * keyboard and screen readers, and the arrows stay a progressive enhancement.
 *
 * Snap is `proximity`, not `mandatory` — mandatory yanks the final page back
 * off the clamped end of the track, so the last card never sits flush.
 */
export default function CardCarousel({
  children,
  perView = 4,
  label,
  className = '',
}: CardCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateArrows = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    // 2px slack: sub-pixel widths mean scrollLeft rarely hits the exact bound.
    setCanPrev(el.scrollLeft > 2)
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return

    updateArrows()
    // Cards are sized by flex-basis, but a first pass can still read a
    // pre-layout scrollWidth and leave the next arrow hidden on a row that is
    // genuinely scrollable. Re-measure after the next frame.
    const raf = requestAnimationFrame(updateArrows)

    el.addEventListener('scroll', updateArrows, { passive: true })

    // Catches viewport resizes and late-loading images changing the track box.
    const ro = new ResizeObserver(updateArrows)
    ro.observe(el)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('scroll', updateArrows)
      ro.disconnect()
    }
  }, [updateArrows, children])

  const scrollByPage = (direction: -1 | 1) => {
    const el = trackRef.current
    if (!el) return

    const kids = Array.from(el.children) as HTMLElement[]
    if (kids.length < 2) return

    // Measure the real card pitch (width + gap) instead of assuming it, so this
    // survives any breakpoint or gap change.
    const step = kids[1].offsetLeft - kids[0].offsetLeft
    if (step <= 0) return

    const visible = Math.max(1, Math.round(el.clientWidth / step))
    const maxScroll = el.scrollWidth - el.clientWidth
    const target = Math.max(0, Math.min(maxScroll, el.scrollLeft + direction * step * visible))

    animateScrollLeft(el, target)
  }

  const basis =
    perView === 3
      ? 'basis-[86%] sm:basis-[47%] lg:basis-[calc((100%-3rem)/3)]'
      : 'basis-[86%] sm:basis-[47%] lg:basis-[calc((100%-3rem)/3)] xl:basis-[calc((100%-4.5rem)/4)]'

  const items = React.Children.toArray(children)

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="scrollbar-hide -mx-4 flex snap-x snap-proximity gap-6 overflow-x-auto px-4 pb-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-whisky-500 sm:mx-0 sm:px-0"
      >
        {items.map((child, i) => (
          <div key={i} className={`shrink-0 snap-start ${basis}`}>
            {child}
          </div>
        ))}
      </div>

      {/* Pointer-only: touch and trackpad users swipe, keyboard users focus the
          track above and use the arrow keys. */}
      <CarouselButton direction="prev" show={canPrev} onClick={() => scrollByPage(-1)} label={label} />
      <CarouselButton direction="next" show={canNext} onClick={() => scrollByPage(1)} label={label} />
    </div>
  )
}

function CarouselButton({
  direction,
  show,
  onClick,
  label,
}: {
  direction: 'prev' | 'next'
  show: boolean
  onClick: () => void
  label?: string
}) {
  const isNext = direction === 'next'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-hidden={!show}
      tabIndex={-1}
      aria-label={`${isNext ? 'Next' : 'Previous'}${label ? ` ${label}` : ''}`}
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-charcoal-200 bg-white text-charcoal-700 shadow-card transition-opacity duration-200 hover:border-charcoal-300 hover:text-ink hover:shadow-card-hover lg:grid ${
        isNext ? '-right-5' : '-left-5'
      } ${show ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      {isNext ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
    </button>
  )
}
