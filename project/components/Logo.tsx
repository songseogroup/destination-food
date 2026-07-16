import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Destination Whisky logo.
 *
 * The mark is an inline SVG so it stays crisp at any size, needs no network
 * request, and recolours to whatever `currentColor` is — the same component
 * works on the dark header and on light surfaces.
 *
 * TO USE THE REAL ARTWORK INSTEAD:
 *   1. Drop the files in public/  ->  /logo.png (mark + wordmark)
 *                                     /logo-mark.png (mark only)
 *   2. Flip USE_IMAGE_ASSET to true.
 * Nothing else needs to change; every call site goes through this component.
 */
const USE_IMAGE_ASSET = false

type LogoVariant = 'full' | 'mark' | 'stacked'

interface LogoProps {
  variant?: LogoVariant
  className?: string
  /** Renders as a plain element instead of a link to `/`. */
  asLink?: boolean
  href?: string
}

/** The still + barley + arcs, no wordmark. Inherits colour from `currentColor`. */
export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  if (USE_IMAGE_ASSET) {
    return (
      <Image
        src="/logo-mark.png"
        alt=""
        width={72}
        height={72}
        className={className}
        priority
      />
    )
  }

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      className={className}
      role="presentation"
      aria-hidden="true"
    >
      {/* Concentric arcs — broken ring, open at top and bottom like the mark. */}
      <path
        d="M30 16A54 54 0 0 0 30 104"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M90 16A54 54 0 0 1 90 104"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M38 12A62 62 0 0 0 38 108"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M82 12A62 62 0 0 1 82 108"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.5"
      />

      {/* Barley sprigs flanking the still. */}
      <g stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" opacity="0.75">
        <path d="M40 74C36 64 36 52 41 42" />
        <path d="M40.5 68C36 66 34 62 34 58M41 60C36.5 58 34.5 54 34.5 50M42 52C38 50 36 46.5 36.5 42.5" />
        <path d="M80 74C84 64 84 52 79 42" />
        <path d="M79.5 68C84 66 86 62 86 58M79 60C83.5 58 85.5 54 85.5 50M78 52C82 50 84 46.5 83.5 42.5" />
      </g>

      {/* Pot still: bell-shaped body, collar, column, swan neck / lyne arm. */}
      <g fill="currentColor">
        {/* base plate */}
        <rect x="43" y="84" width="34" height="4.5" rx="2.25" />
        {/* body */}
        <path d="M46 84C46 70 48.5 60.5 60 56.5C71.5 60.5 74 70 74 84Z" />
        {/* collar */}
        <rect x="54.5" y="50" width="11" height="7" rx="1.5" />
        {/* column */}
        <rect x="56.5" y="32" width="7" height="19" rx="1.5" />
        {/* swan neck curving right, then the lyne arm dropping away */}
        <path
          d="M60 34C60 24 62 19 69 19C76.5 19 79 25 79 31L79 36"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  )
}

/** Full lockup. `variant` controls whether the wordmark renders and how. */
export default function Logo({
  variant = 'full',
  className = '',
  asLink = true,
  href = '/',
}: LogoProps) {
  if (USE_IMAGE_ASSET && variant !== 'mark') {
    const img = (
      <Image src="/logo.png" alt="Destination Whisky" width={200} height={56} priority />
    )
    return asLink ? (
      <Link href={href} className={className} aria-label="Destination Whisky — home">
        {img}
      </Link>
    ) : (
      <div className={className}>{img}</div>
    )
  }

  const content =
    variant === 'mark' ? (
      <LogoMark className="h-9 w-9" />
    ) : variant === 'stacked' ? (
      <span className="flex flex-col items-center gap-2">
        <LogoMark className="h-14 w-14" />
        <span className="flex flex-col items-center leading-none">
          <span className="font-display text-lg font-bold tracking-[0.18em]">DESTINATION</span>
          <span className="mt-1 text-[0.6rem] font-semibold tracking-[0.42em]">WHISKY</span>
        </span>
      </span>
    ) : (
      <span className="flex items-center gap-2.5">
        <LogoMark className="h-9 w-9 shrink-0" />
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-bold tracking-[0.14em]">DESTINATION</span>
          <span className="mt-0.5 text-[0.55rem] font-semibold tracking-[0.38em]">WHISKY</span>
        </span>
      </span>
    )

  if (!asLink) {
    return <div className={className}>{content}</div>
  }

  return (
    <Link href={href} className={className} aria-label="Destination Whisky — home">
      {content}
    </Link>
  )
}
