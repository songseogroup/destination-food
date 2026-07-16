'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const GSI_SRC = 'https://accounts.google.com/gsi/client'

declare global {
  interface Window {
    google?: any
  }
}

interface GoogleAuthButtonProps {
  /** Only changes the button label — one Google account flow covers both. */
  mode?: 'signin' | 'signup'
  onError?: (message: string) => void
  redirectTo?: string
}

/** Loads the Google Identity Services script once, shared across mounts. */
let gsiPromise: Promise<void> | null = null
function loadGsi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.google?.accounts?.id) return Promise.resolve()
  if (gsiPromise) return gsiPromise

  gsiPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google script')))
      return
    }
    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google script'))
    document.head.appendChild(script)
  })
  return gsiPromise
}

/**
 * Google sign-in / sign-up.
 *
 * Uses Google Identity Services: Google hands us a signed ID token in the
 * browser, we POST it to the backend, and the backend verifies the signature
 * against Google's public certs before minting our own JWT. The ID token is
 * never trusted here.
 *
 * Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID. Without it the component renders a
 * disabled button explaining the gap rather than a control that silently
 * does nothing.
 */
export default function GoogleAuthButton({
  mode = 'signin',
  onError,
  redirectTo = '/',
}: GoogleAuthButtonProps) {
  const router = useRouter()
  const { loginWithGoogle } = useCustomerAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false

    loadGsi()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential?: string }) => {
            if (!response?.credential) {
              onError?.('Google did not return a credential. Please try again.')
              return
            }
            setBusy(true)
            try {
              await loginWithGoogle(response.credential)
              router.push(redirectTo)
            } catch (err: any) {
              onError?.(err?.message || 'Google sign-in failed')
            } finally {
              if (!cancelled) setBusy(false)
            }
          },
        })

        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: mode === 'signup' ? 'signup_with' : 'signin_with',
          shape: 'pill',
          logo_alignment: 'center',
          width: 360,
        })
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) onError?.('Could not reach Google. Check your connection and try again.')
      })

    return () => {
      cancelled = true
    }
    // loginWithGoogle/onError are stable enough in practice; re-running would
    // re-render the Google button and lose its iframe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, redirectTo])

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="rounded-xl border border-dashed border-charcoal-300 bg-charcoal-50 px-4 py-3 text-center text-sm text-charcoal-500">
        Google sign-in isn&apos;t configured yet.
        <span className="mt-0.5 block text-xs">
          Set <code className="font-mono text-charcoal-600">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to
          enable it.
        </span>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Google renders its own iframe button in here. */}
      <div ref={containerRef} className="flex justify-center [&>div]:!w-full" />

      {!ready && (
        <div className="flex h-11 items-center justify-center rounded-full border border-charcoal-200 bg-white text-sm text-charcoal-400">
          Loading Google…
        </div>
      )}

      {busy && (
        <div className="absolute inset-0 grid place-items-center rounded-full bg-white/70 text-sm font-medium text-charcoal-600">
          Signing you in…
        </div>
      )}
    </div>
  )
}

/** "or" rule between the Google button and the email form. */
export function AuthDivider({ label = 'or continue with email' }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-charcoal-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs uppercase tracking-wider text-charcoal-400">
          {label}
        </span>
      </div>
    </div>
  )
}
