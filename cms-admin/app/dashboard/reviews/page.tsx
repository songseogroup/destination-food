'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Star, MessageCircle, Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

interface OwnerReview {
  id: number
  customerName: string
  rating: number
  comment: string
  ownerReply?: string | null
  ownerReplyAt?: string | null
  entityType: 'bar' | 'distillery' | 'event'
  entityId: number
  createdAt: string
  isHidden: boolean
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'fill-primary-500 text-primary-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const user = auth.getUser()
  const queryClient = useQueryClient()
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({})

  const isOwnerRole =
    user?.role === 'bar' ||
    user?.role === 'distillery' ||
    user?.role === 'event_host' ||
    user?.role === 'tour_operator'

  const { data: reviews = [], isLoading } = useQuery<OwnerReview[]>(
    'owner-reviews',
    async () => (await api.get('/reviews/mine')).data,
    { enabled: isOwnerRole, refetchInterval: 60000 },
  )

  const replyMutation = useMutation(
    async ({ id, reply }: { id: number; reply: string }) =>
      (await api.patch(`/reviews/${id}/reply`, { ownerReply: reply })).data,
    {
      onSuccess: (_, vars) => {
        toast.success('Reply posted')
        setReplyDrafts((d) => ({ ...d, [vars.id]: '' }))
        queryClient.invalidateQueries('owner-reviews')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Reply failed')
      },
    },
  )

  if (!isOwnerRole) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
        <p className="font-medium text-yellow-900">
          The reviews dashboard is for business owners. SuperAdmin moderation is at{' '}
          <a href="/dashboard/admin/reviews" className="underline">
            /dashboard/admin/reviews
          </a>
          .
        </p>
      </div>
    )
  }

  const ratings = reviews.map((r) => r.rating)
  const avg =
    ratings.length === 0
      ? 0
      : Math.round((ratings.reduce((s, n) => s + n, 0) / ratings.length) * 10) / 10
  const unreplied = reviews.filter((r) => !r.ownerReply).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
        <p className="text-gray-600 mt-1">
          See what customers are saying and reply to start a conversation.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Average rating" value={avg ? avg.toFixed(1) : '—'} icon={<Star className="h-5 w-5 text-primary-500 fill-primary-500" />} />
        <StatCard label="Total reviews" value={reviews.length} icon={<MessageCircle className="h-5 w-5 text-primary-500" />} />
        <StatCard label="Awaiting reply" value={unreplied} icon={<Send className="h-5 w-5 text-primary-500" />} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No reviews yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When customers leave a review on your listing, it&apos;ll show up here so you can reply.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reviews.map((r) => (
              <li key={r.id} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{r.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()} ·{' '}
                      <span className="capitalize">{r.entityType}</span>
                    </p>
                  </div>
                  <StarRow rating={r.rating} />
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{r.comment}</p>

                {r.ownerReply ? (
                  <div className="mt-4 pl-4 border-l-2 border-primary-500/50 bg-primary-50/30 py-2 pr-3 rounded-r">
                    <p className="text-xs font-medium text-primary-700 mb-1">Your reply</p>
                    <p className="text-sm text-gray-800 whitespace-pre-line">{r.ownerReply}</p>
                    {r.ownerReplyAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Sent {new Date(r.ownerReplyAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <textarea
                      value={replyDrafts[r.id] || ''}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                      placeholder="Write a thoughtful reply…"
                      rows={2}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <button
                      onClick={() =>
                        replyMutation.mutate({ id: r.id, reply: (replyDrafts[r.id] || '').trim() })
                      }
                      disabled={!(replyDrafts[r.id] || '').trim() || replyMutation.isLoading}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Reply
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}
