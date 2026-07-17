'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext'
import GoogleAuthButton, { AuthDivider } from '../../../components/GoogleAuthButton'
import Logo from '../../../components/Logo'

/**
 * Where to land after signing in.
 *
 * Only same-site paths are honoured. `?next=https://evil.com` — or the
 * protocol-relative `//evil.com`, which the browser also treats as absolute —
 * would otherwise turn our login into an open redirect that phishing can point
 * at, so anything that isn't a plain `/path` falls back to the homepage.
 */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export default function LoginPage() {
  return (
    // useSearchParams needs a Suspense boundary to prerender.
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const { login } = useCustomerAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push(next)
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12 sm:px-6 lg:px-8">
      <Logo className="mb-8 text-charcoal-900" variant="stacked" />

      <div className="w-full max-w-md rounded-3xl border border-charcoal-200 bg-white p-8 shadow-card">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink">Welcome back</h1>
          <p className="mt-2 text-charcoal-500">Sign in to manage your bookings</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-status-danger/25 bg-status-dangerSoft px-4 py-3 text-sm text-status-danger"
          >
            {error}
          </div>
        )}

        <div className="mt-6">
          <GoogleAuthButton mode="signin" onError={setError} redirectTo={next} />
        </div>

        <AuthDivider />

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="label">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 pr-11"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-charcoal-400 transition-colors hover:text-whisky-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/*
              This checkbox is presentational — sessions are persisted in
              localStorage unconditionally by CustomerAuthContext, so unchecking
              it changes nothing. Left in place to avoid a behaviour change;
              wire it to a session-vs-local storage choice when convenient.
            */}
            <label htmlFor="remember-me" className="flex items-center gap-2 text-sm text-charcoal-600">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-charcoal-300 accent-whisky-500"
              />
              Remember me
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-whisky-700 transition-colors hover:text-whisky-600"
            >
              Forgot password?
            </Link>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Sign in
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-semibold text-whisky-700 hover:text-whisky-600">
            Sign up
          </Link>
        </p>
      </div>

      <Link href="/" className="mt-6 text-sm text-charcoal-500 transition-colors hover:text-ink">
        ← Back to Destination Whisky
      </Link>
    </div>
  )
}
