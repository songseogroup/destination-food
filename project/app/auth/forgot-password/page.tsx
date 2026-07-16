'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api } from '../../../lib/api'
import Logo from '../../../components/Logo'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await api.post('/customers/forgot-password', { email })
      setSubmitted(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12 sm:px-6 lg:px-8">
        <Logo className="mb-8 text-charcoal-900" variant="stacked" />

        <div className="w-full max-w-md space-y-4 rounded-3xl border border-charcoal-200 bg-white p-8 text-center shadow-card">
          <CheckCircle2 className="mx-auto h-14 w-14 text-status-success" />
          <h1 className="font-display text-2xl font-bold text-ink">Check your inbox</h1>
          <p className="text-charcoal-600">
            If <strong className="font-semibold text-ink">{email}</strong> is registered, we&apos;ve sent
            a password reset link. The link expires in 60 minutes.
          </p>
          <p className="text-sm text-charcoal-500">
            Didn&apos;t get the email? Check spam, or try a different address.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 font-medium text-whisky-700 transition-colors hover:text-whisky-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
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
          <h1 className="font-display text-3xl font-bold text-ink">Forgot password?</h1>
          <p className="mt-2 text-charcoal-500">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

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

          <button type="submit" disabled={isLoading || !email} className="btn-primary w-full">
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Send reset link
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-whisky-700 transition-colors hover:text-whisky-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
