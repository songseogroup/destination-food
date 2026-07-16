'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingSpinner from './LoadingSpinner'

interface PageTransitionProps {
  children: React.ReactNode
}

/*
 * NOTE: the `isLoading` overlay below is effectively dead code. It only flips on
 * `beforeunload`/`popstate`, and neither fires on App Router client navigations —
 * so the overlay never shows in practice. `router` here is likewise destructured
 * but unused. Both are left as-is deliberately: this pass is a restyle only.
 * Wire the overlay to `usePathname()` if the transition is ever wanted for real.
 */
export default function PageTransition({ children }: PageTransitionProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true)
    }

    const handleComplete = () => {
      setTimeout(() => {
        setIsLoading(false)
      }, 500) // Small delay for smooth transition
    }

    // Listen for route changes
    window.addEventListener('beforeunload', handleStart)
    
    // For Next.js router events (if available)
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleComplete)
    }

    return () => {
      window.removeEventListener('beforeunload', handleStart)
      if (typeof window !== 'undefined') {
        window.removeEventListener('popstate', handleComplete)
      }
    }
  }, [])

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-cream/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <LoadingSpinner size="lg" text="Loading..." />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>
    </>
  )
}

// Hook for manual page transitions
export function usePageTransition() {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const router = useRouter()

  const navigateWithTransition = (href: string) => {
    setIsTransitioning(true)
    
    // Simulate loading time
    setTimeout(() => {
      router.push(href)
      setIsTransitioning(false)
    }, 1000)
  }

  return { isTransitioning, navigateWithTransition }
} 