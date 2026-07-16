'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  MessageCircle,
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { api } from '../../lib/api'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'bug', label: 'Bug report' },
  { value: 'feature_request', label: 'Feature request' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'compliment', label: 'Compliment' },
]

export default function FeedbackPage() {
  const { customer, isAuthenticated } = useCustomerAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    category: 'general',
    subject: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill name/email for signed-in customers.
  useEffect(() => {
    if (customer && !form.name && !form.email) {
      setForm((f) => ({
        ...f,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
        email: customer.email || '',
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.subject.trim().length < 3) {
      setError('Subject is too short.')
      return
    }
    if (form.message.trim().length < 10) {
      setError('Please write a bit more — at least 10 characters.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/feedback', {
        name: form.name.trim(),
        email: form.email.trim(),
        category: form.category,
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      setSubmitted(true)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(' • ') : msg || 'Could not send your feedback. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        {submitted ? (
          <div className="card p-10 text-center">
            <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-status-success" />
            <h1 className="font-display text-2xl font-bold text-ink">Thanks for the feedback!</h1>
            <p className="mx-auto mt-2 max-w-md text-charcoal-600">
              We read every message. If you asked a question, we&apos;ll get back to you at{' '}
              <strong className="font-semibold text-ink">{form.email}</strong>.
            </p>
            <Link href="/" className="btn-primary mt-6">
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-whisky-100 text-whisky-600">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h1 className="font-display text-3xl font-bold text-ink">Send us feedback</h1>
            </div>
            <p className="mb-8 leading-relaxed text-charcoal-600">
              Tell us what&apos;s great, what&apos;s broken, or what you wish existed. Every message lands directly with the team
              {isAuthenticated ? ", and we'll reply to your account email." : '.'}
            </p>

            <form onSubmit={handleSubmit} className="card space-y-5 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="feedback-name" className="label">Your name</label>
                  <input
                    id="feedback-name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="input-field"
                  />
                </div>
                <div>
                  <label htmlFor="feedback-email" className="label">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
                    <input
                      id="feedback-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="feedback-category" className="label">What&apos;s it about?</label>
                <select
                  id="feedback-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="input-field"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="feedback-subject" className="label">Subject</label>
                <input
                  id="feedback-subject"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Short summary"
                  maxLength={200}
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="feedback-message" className="label">Your message</label>
                <textarea
                  id="feedback-message"
                  required
                  rows={6}
                  maxLength={5000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what's on your mind. The more detail the better."
                  className="input-field resize-y"
                />
                <p className="mt-1 text-xs text-charcoal-500">{form.message.length}/5000 characters</p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-status-danger/25 bg-status-dangerSoft px-3 py-2 text-sm text-status-danger"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full sm:w-auto"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send feedback
              </button>
            </form>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
