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
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {submitted ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
            <CheckCircle2 className="h-14 w-14 text-primary-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Thanks for the feedback!</h1>
            <p className="mt-2 text-gray-400 max-w-md mx-auto">
              We read every message. If you asked a question, we&apos;ll get back to you at <strong className="text-white">{form.email}</strong>.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to home
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-primary-500/20 text-primary-500 flex items-center justify-center">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h1 className="text-3xl font-bold">Send us feedback</h1>
            </div>
            <p className="text-gray-400 mb-8 leading-relaxed">
              Tell us what&apos;s great, what&apos;s broken, or what you wish existed. Every message lands directly with the team
              {isAuthenticated ? ", and we'll reply to your account email." : '.'}
            </p>

            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Your name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                    className="w-full px-3 py-2.5 bg-gray-800 text-white placeholder:text-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-800 text-white placeholder:text-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">What&apos;s it about?</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-800 text-white border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Subject</label>
                <input
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Short summary"
                  maxLength={200}
                  className="w-full px-3 py-2.5 bg-gray-800 text-white placeholder:text-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Your message</label>
                <textarea
                  required
                  rows={6}
                  maxLength={5000}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us what's on your mind. The more detail the better."
                  className="w-full px-3 py-2.5 bg-gray-800 text-white placeholder:text-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y"
                />
                <p className="text-xs text-gray-500 mt-1">{form.message.length}/5000 characters</p>
              </div>

              {error && (
                <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
