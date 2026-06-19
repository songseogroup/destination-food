'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, MessageCircle, Trash2, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

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

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${cls} ${i <= rating ? 'fill-primary-500 text-primary-500' : 'text-gray-600'}`}
        />
      ))}
    </div>
  )
}

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
          className="p-1 rounded-md hover:bg-gray-800 transition-colors"
        >
          <Star
            className={`h-7 w-7 ${
              i <= (hover || value) ? 'fill-primary-500 text-primary-500' : 'text-gray-600'
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
          <h2 className="text-2xl font-bold text-white">Reviews</h2>
          {reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-3">
              <StarRating rating={Math.round(avg)} />
              <span className="text-sm text-gray-400">
                {avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Write a review */}
      {!isAuthenticated ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <p className="text-gray-300">
            <Link href="/auth/login" className="text-primary-500 hover:text-primary-400 font-medium">
              Sign in
            </Link>{' '}
            to leave a review.
          </p>
        </div>
      ) : myExisting ? (
        <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm text-primary-200">You already reviewed this listing.</p>
          <button
            onClick={() => handleDelete(myExisting.id)}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete my review
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4"
        >
          <h3 className="font-semibold text-white">Write a review</h3>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Your rating</label>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Your review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={4}
              placeholder="Share what made this place special — service, atmosphere, drinks, anything fellow whisky fans should know."
              className="w-full px-3 py-2 bg-gray-800 text-white placeholder:text-gray-500 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/2000 characters · minimum 5
            </p>
          </div>
          {submitError && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-3 py-2 rounded-lg text-sm">
              {submitError}
            </div>
          )}
          {submitSuccess && (
            <div className="bg-green-900/30 border border-green-700 text-green-300 px-3 py-2 rounded-lg text-sm">
              Thanks for your review!
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || rating < 1 || comment.trim().length < 5}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post review'}
          </button>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
          <MessageCircle className="h-10 w-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-300 font-medium">No reviews yet</p>
          <p className="text-sm text-gray-500 mt-1">Be the first to share your experience.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-white">{r.customerName || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500">{formatDate(r.createdAt)}</p>
                </div>
                <StarRating rating={r.rating} />
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">{r.comment}</p>
              {r.ownerReply && (
                <div className="mt-4 pl-4 border-l-2 border-primary-500/50">
                  <p className="text-xs font-medium text-primary-500 mb-1">Owner&apos;s reply</p>
                  <p className="text-sm text-gray-300 whitespace-pre-line">{r.ownerReply}</p>
                  {r.ownerReplyAt && (
                    <p className="text-xs text-gray-500 mt-1">{formatDate(r.ownerReplyAt)}</p>
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
