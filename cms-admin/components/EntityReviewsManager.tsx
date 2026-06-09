'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { MessageSquare, Save, Star, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'

interface EntityReviewsManagerProps {
  type: 'bars' | 'distilleries' | 'events'
}

export function EntityReviewsManager({ type }: EntityReviewsManagerProps) {
  const params = useParams()
  const queryClient = useQueryClient()
  const id = params.id as string
  const entityKey = type === 'distilleries' ? 'distillery' : type.slice(0, -1)
  const [rating, setRating] = useState('0')
  const [reviews, setReviews] = useState('0')
  const [featuredNote, setFeaturedNote] = useState('')

  const { data: entity, isLoading } = useQuery(
    [entityKey, id],
    () => api.get(`/${type}/${id}`).then((res) => res.data),
  )

  useEffect(() => {
    if (!entity) return
    setRating(String(entity.rating ?? 0))
    setReviews(String(entity.reviews ?? 0))
  }, [entity])

  const saveMutation = useMutation(
    () =>
      api.patch(`/${type}/${id}`, {
        rating: Number(rating),
        reviews: Number(reviews),
        reviewNote: featuredNote.trim() || undefined,
      }),
    {
      onSuccess: () => {
        toast.success('Review settings updated')
        queryClient.invalidateQueries([entityKey, id])
      },
      onError: () => {
        toast.error('Failed to update review settings')
      },
    },
  )

  const scoreLabel = useMemo(() => {
    const score = Number(rating)
    if (score >= 4.5) return 'Excellent'
    if (score >= 4) return 'Strong'
    if (score >= 3) return 'Needs attention'
    return 'Unrated'
  }, [rating])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (Number(rating) < 0 || Number(rating) > 5) {
      toast.error('Rating must be between 0 and 5')
      return
    }
    saveMutation.mutate()
  }

  if (isLoading) return <LoadingSpinner />
  if (!entity) return <div className="text-center py-12 text-gray-500">Item not found</div>

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type={type} name={entity.name} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Average rating</p>
            <Star className="h-5 w-5 text-amber-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{Number(rating || 0).toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Total reviews</p>
            <MessageSquare className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{Number(reviews || 0)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Reputation</p>
            <TrendingUp className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-gray-900">{scoreLabel}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Review Management</h2>
            <p className="mt-1 text-sm text-gray-600">Maintain the public-facing review summary for this listing.</p>
          </div>
          <button
            type="submit"
            disabled={saveMutation.isLoading}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isLoading ? 'Saving...' : 'Save Reviews'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
          <div>
            <label className="label">Average Rating</label>
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={rating}
              onChange={(event) => setRating(event.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label">Review Count</label>
            <input
              type="number"
              min="0"
              step="1"
              value={reviews}
              onChange={(event) => setReviews(event.target.value)}
              className="input-field"
            />
          </div>
          <div className="md:col-span-2">
            <label className="label">Internal Review Note</label>
            <textarea
              value={featuredNote}
              onChange={(event) => setFeaturedNote(event.target.value)}
              className="input-field min-h-[120px]"
              placeholder="Add moderation notes, recurring complaints, or customer service follow-up context."
            />
          </div>
        </div>
      </form>
    </div>
  )
}
