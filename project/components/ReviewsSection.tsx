'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import StarRating from './ui/StarRating'

type EntityType = 'bar' | 'distillery' | 'event'

interface Review {
  id: number
  customerId: number
  customerName: string
  rating: number
  comment: string
  ownerReply?: string | null
  ownerReplyAt?: string | null
  createdAt: string
}

interface ReviewsSectionProps {
  entityType: EntityType
  entityId: number
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/*
 * Read-only stars come from the shared components/ui/StarRating (variant="stars").
 * StarInput stays local — it's an interactive picker with hover state, which the
 * shared display component deliberately doesn't do.
 */
function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${i} out of 5`}
          className="p-1 rounded-lg transition-colors hover:bg-charcoal-100"
        >
          <Star
            className={`h-7 w-7 ${
              i <= (hover || value) ? 'fill-whisky-500 text-whisky-500' : 'text-charcoal-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewsSection({ entityType, entityId }: ReviewsSectionProps) {
  const { customer, isAuthenticated } = useCustomerAuth()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/reviews', { params: { entityType, entityId, limit: 50 } })
      setReviews(res.data.items || [])
    } catch {
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  useEffect(() => {
    load()
  }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (rating < 1 || rating > 5) {
      setSubmitError('Please tap a star rating between 1 and 5.')
      return
    }
    if (comment.trim().length < 5) {
      setSubmitError('Please write at least a few words.')
      return
    }
    setSubmitting(true)
    try {
      await api.post('/reviews', { entityType, entityId, rating, comment: comment.trim() })
      setSubmitSuccess(true)
      setRating(0)
      setComment('')
      load()
      setTimeout(() => setSubmitSuccess(false), 4000)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setSubmitError(
        Array.isArray(msg) ? msg.join(' • ') : msg || 'Could not post your review. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this review?')) return
    try {
      await api.delete(`/reviews/${id}`)
      load()
    } catch {
      // silent
    }
  }

  const myExisting = customer ? reviews.find((r) => r.customerId === customer.id) : undefined
  const avg =
    reviews.length === 0
      ? 0
      : Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-ink">Reviews</h2>
          {reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-3">
              <StarRating rating={avg} variant="stars" />
              <span className="text-sm text-charcoal-500">
                {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Write a review */}
      {!isAuthenticated ? (
        <div className="card p-6 text-center">
          <p className="text-charcoal-600">
            <Link href="/auth/login" className="font-medium text-whisky-700 hover:text-whisky-600">
              Sign in
            </Link>{' '}
            to leave a review.
          </p>
        </div>
      ) : myExisting ? (
        <div className="flex items-center justify-between rounded-2xl border border-whisky-200 bg-whisky-50 p-4">
          <p className="text-sm text-whisky-700">You already reviewed this listing.</p>
          <button
            onClick={() => handleDelete(myExisting.id)}
            className="flex items-center gap-1 text-xs font-medium text-status-danger transition-colors hover:opacity-80"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete my review
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <h3 className="font-display font-semibold text-ink">Write a review</h3>
          <div>
            <label className="label">Your rating</label>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="label">Your review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Share what made this place special — service, atmosphere, drinks, anything fellow whisky fans should know."
              className="input-field"
            />
            <p className="mt-1 text-xs text-charcoal-500">
              {comment.length}/2000 characters · minimum 5
            </p>
          </div>
          {submitError && (
            <div
              role="alert"
              className="rounded-xl border border-status-danger/25 bg-status-dangerSoft px-3 py-2 text-sm text-status-danger"
            >
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="rounded-xl border border-status-success/25 bg-status-successSoft px-3 py-2 text-sm text-status-success">
              Thanks for your review!
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || rating < 1 || comment.trim().length < 5}
            className="btn-primary px-5 py-2.5"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post review'}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <MessageCircle className="mx-auto mb-3 h-10 w-10 text-charcoal-300" />
          <p className="font-display font-semibold text-ink">No reviews yet</p>
          <p className="mt-1 text-sm text-charcoal-500">Be the first to share your experience.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="card p-5">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{r.customerName || 'Anonymous'}</p>
                  <p className="text-xs text-charcoal-500">{formatDate(r.createdAt)}</p>
                </div>
                <StarRating rating={r.rating} variant="stars" />
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-charcoal-600">{r.comment}</p>
              {r.ownerReply && (
                <div className="mt-4 border-l-2 border-whisky-300 pl-4">
                  <p className="mb-1 text-xs font-semibold text-whisky-700">Owner&apos;s reply</p>
                  <p className="whitespace-pre-line text-sm text-charcoal-600">{r.ownerReply}</p>
                  {r.ownerReplyAt && (
                    <p className="mt-1 text-xs text-charcoal-500">{formatDate(r.ownerReplyAt)}</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
