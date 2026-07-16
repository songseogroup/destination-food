'use client'

import React, { useId } from 'react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  /** Use on dark surfaces (header, dark hero) to flip the label colour. */
  tone?: 'light' | 'dark'
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
}

const textSizes = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
}

/**
 * A whisky tumbler that fills and drains.
 *
 * Replaces the previous spinning pizza emoji — a leftover from the food-delivery
 * template this app started as.
 */
export function WhiskyGlass({ className = 'w-14 h-14' }: { className?: string }) {
  // useId keeps the clipPath/gradient ids unique when several loaders mount at
  // once — duplicate SVG ids silently cross-wire and clip the wrong element.
  const uid = useId().replace(/:/g, '')
  const clipId = `glass-clip-${uid}`
  const gradId = `whisky-grad-${uid}`

  return (
    <svg viewBox="0 0 64 64" className={className} role="presentation" aria-hidden="true">
      <defs>
        {/* Interior of the tumbler — the liquid is clipped to this. */}
        <clipPath id={clipId}>
          <path d="M17.5 15 L20.5 52.5 Q20.9 55 23.5 55 L40.5 55 Q43.1 55 43.5 52.5 L46.5 15 Z" />
        </clipPath>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCBE85" />
          <stop offset="55%" stopColor="#B8862F" />
          <stop offset="100%" stopColor="#7B5620" />
        </linearGradient>
      </defs>

      {/* Liquid: rises, holds, drains. */}
      <g clipPath={`url(#${clipId})`}>
        <motion.rect
          x="14"
          width="36"
          fill={`url(#${gradId})`}
          initial={{ y: 56, height: 0 }}
          animate={{ y: [56, 26, 26, 56], height: [0, 30, 30, 0] }}
          transition={{
            duration: 2.6,
            times: [0, 0.45, 0.75, 1],
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        {/* Meniscus — a lighter band riding the surface, tilting like a swirl. */}
        <motion.ellipse
          cx="32"
          rx="18"
          ry="1.8"
          fill="#EBD9B4"
          opacity="0.85"
          initial={{ cy: 56 }}
          animate={{ cy: [56, 26, 26, 56], rx: [18, 18, 18, 18] }}
          transition={{
            duration: 2.6,
            times: [0, 0.45, 0.75, 1],
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </g>

      {/* Glass body */}
      <path
        d="M17.5 15 L20.5 52.5 Q20.9 55 23.5 55 L40.5 55 Q43.1 55 43.5 52.5 L46.5 15 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinejoin="round"
      />
      {/* Rim */}
      <line
        x1="16.5"
        y1="15"
        x2="47.5"
        y2="15"
        stroke="currentColor"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      {/* Highlight down the left wall */}
      <path
        d="M22.5 20 L24.5 47"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  )
}

export default function LoadingSpinner({
  size = 'md',
  text = 'Loading...',
  tone = 'light',
}: LoadingSpinnerProps) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center">
      <motion.div
        className={tone === 'dark' ? 'text-whisky-300' : 'text-charcoal-700'}
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <WhiskyGlass className={sizeClasses[size]} />
      </motion.div>

      {text ? (
        <motion.p
          className={`${textSizes[size]} mt-4 font-medium ${
            tone === 'dark' ? 'text-charcoal-300' : 'text-charcoal-600'
          }`}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          {text}
        </motion.p>
      ) : null}

      <div className="mt-2 flex space-x-1.5">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="h-1.5 w-1.5 rounded-full bg-whisky-500"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/** Full-screen route transition overlay. */
export function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream/90 backdrop-blur-sm">
      <LoadingSpinner size="lg" text="Pouring your experience..." />
    </div>
  )
}

/** Inline loader for a section within a page. */
export function SectionLoader() {
  return (
    <div className="py-12">
      <LoadingSpinner size="md" text="Loading content..." />
    </div>
  )
}
