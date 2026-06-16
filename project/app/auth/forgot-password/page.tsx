'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api } from '../../../lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const inputClass =
    'block w-full pl-10 pr-3 py-3 bg-gray-800 text-white placeholder:text-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500'

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
      <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full space-y-6 bg-gray-900 p-8 rounded-2xl shadow-2xl shadow-primary-500/10 border border-gray-800 text-center">
          <CheckCircle2 className="h-14 w-14 text-primary-500 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Check your inbox</h2>
          <p className="text-gray-400">
            If <strong className="text-white">{email}</strong> is registered, we&apos;ve sent a password reset link.
            The link expires in 60 minutes.
          </p>
          <p className="text-sm text-gray-500">
            Didn&apos;t get the email? Check spam, or try a different address.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-400 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-900 p-8 rounded-2xl shadow-2xl shadow-primary-500/10 border border-gray-800">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            Forgot <span className="text-primary-500">password?</span>
          </h2>
          <p className="mt-2 text-gray-400">
            Enter your email and we&apos;ll send you a link to reset it.
          </p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-primary-500 hover:bg-primary-600 text-black font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Send reset link
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-primary-500 hover:text-primary-400 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
