'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Check } from 'lucide-react'
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext'
import GoogleAuthButton, { AuthDivider } from '../../../components/GoogleAuthButton'
import Logo from '../../../components/Logo'

export default function SignupPage() {
  const router = useRouter()
  const { signup, isLoading: authLoading } = useCustomerAuth()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [preferences, setPreferences] = useState({
    receiveMarketingEmails: true,
    receivePromotionalDeals: true,
    interests: [] as string[],
  })

  /*
   * Values are stored verbatim in customer.preferences.interests (string[], no
   * server-side enum), so these map to what the marketplace actually sells:
   * bars, distilleries, events, collections.
   */
  const interestOptions = [
    { value: 'tastings', label: 'Tastings' },
    { value: 'distillery_tours', label: 'Distillery Tours' },
    { value: 'bar_events', label: 'Bar Events' },
    { value: 'festivals', label: 'Festivals' },
    { value: 'masterclasses', label: 'Masterclasses' },
    { value: 'rare_collectable', label: 'Rare & Collectable' },
    { value: 'cocktails', label: 'Cocktails' },
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      await signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
        preferences: {
          receiveMarketingEmails: preferences.receiveMarketingEmails,
          receivePromotionalDeals: preferences.receivePromotionalDeals,
          interests: preferences.interests,
          notificationPreferences: {
            email: preferences.receiveMarketingEmails,
            sms: false,
            push: false,
          },
        },
      })
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12 sm:px-6 lg:px-8">
      <Logo className="mb-8 text-charcoal-900" variant="stacked" />

      <div className="w-full max-w-lg rounded-3xl border border-charcoal-200 bg-white p-8 shadow-card">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-ink">Create your account</h1>
          <p className="mt-2 text-charcoal-500">Create an account to book whisky experiences</p>
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
          <GoogleAuthButton mode="signup" onError={setError} redirectTo="/" />
        </div>

        <AuthDivider />

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="label">
                First name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="First name"
                />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="label">
                Last name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

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
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="label">
              Phone number <span className="font-normal text-charcoal-400">(optional)</span>
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="Enter your phone number"
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
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10 pr-11"
                placeholder="Create a password (min 6 chars)"
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
              Confirm password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field pl-10 pr-11"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-charcoal-400 transition-colors hover:text-whisky-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Interests */}
          <div>
            <span className="label">What are you interested in?</span>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => {
                const selected = preferences.interests.includes(interest.value)
                return (
                  <button
                    key={interest.value}
                    type="button"
                    onClick={() => toggleInterest(interest.value)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      selected
                        ? 'bg-whisky-500 text-white'
                        : 'border border-charcoal-200 bg-white text-charcoal-600 hover:border-charcoal-300 hover:bg-charcoal-50 hover:text-ink'
                    }`}
                  >
                    {selected && <Check className="h-3 w-3" />}
                    {interest.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Marketing preferences */}
          <div className="space-y-3">
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={preferences.receiveMarketingEmails}
                onChange={(e) => setPreferences(prev => ({ ...prev, receiveMarketingEmails: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-charcoal-300 accent-whisky-500"
              />
              <span className="text-sm text-charcoal-600">
                Send me marketing emails about new features and offers
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2">
              <input
                type="checkbox"
                checked={preferences.receivePromotionalDeals}
                onChange={(e) => setPreferences(prev => ({ ...prev, receivePromotionalDeals: e.target.checked }))}
                className="mt-0.5 h-4 w-4 rounded border-charcoal-300 accent-whisky-500"
              />
              <span className="text-sm text-charcoal-600">
                Send me deals and promotions based on my interests
              </span>
            </label>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full">
            {isLoading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-semibold text-whisky-700 hover:text-whisky-600">
            Sign in
          </Link>
        </p>
      </div>

      <Link href="/" className="mt-6 text-sm text-charcoal-500 transition-colors hover:text-ink">
        ← Back to Destination Whisky
      </Link>
    </div>
  )
}
