'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'
import { api } from '../../../lib/api'
import Logo from '../../../components/Logo'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-cream">
          <Loader2 className="h-8 w-8 animate-spin text-whisky-500" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (!token) {
      setError('Missing reset token. Please request a new reset link.')
      return
    }

    setIsLoading(true)
    try {
      await api.post('/customers/reset-password', { token, password })
      setDone(true)
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not reset password. The link may have expired.')
    } finally {
      setIsLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12 sm:px-6 lg:px-8">
        <Logo className="mb-8 text-charcoal-900" variant="stacked" />

        <div className="w-full max-w-md space-y-4 rounded-3xl border border-charcoal-200 bg-white p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-14 w-14 text-status-success" />
          <h1 className="font-display text-2xl font-bold text-ink">Password updated</h1>
          <p className="text-charcoal-600">Redirecting you to sign in…</p>
          <Link
            href="/auth/login"
            className="inline-block font-medium text-whisky-700 transition-colors hover:text-whisky-600"
          >
            Or click here to go now
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12 sm:px-6 lg:px-8">
      <Logo className="mb-8 text-charcoal-900" variant="stacked" />

      <div className="w-full max-w-md rounded-3xl border border-charcoal-200 bg-white p-8 shadow-card">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink">Reset password</h1>
          <p className="mt-2 text-charcoal-500">Choose a new password for your account.</p>
        </div>

        {!token && (
          <div className="mt-6 rounded-xl border border-status-warning/25 bg-status-warningSoft px-4 py-3 text-sm text-status-warning">
            No reset token in the URL.{' '}
            <Link href="/auth/forgot-password" className="font-medium underline">
              Request a new reset link
            </Link>
            .
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-status-danger/25 bg-status-dangerSoft px-4 py-3 text-sm text-status-danger"
          >
            {error}
          </div>
        )}

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="password" className="label">
              New password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 pr-11"
                placeholder="At least 6 characters"
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

          <div>
            <label htmlFor="confirmPassword" className="label">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input-field pl-10"
                placeholder="Type it again"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading || !token} className="btn-primary w-full">
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Update password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
