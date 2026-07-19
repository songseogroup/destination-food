'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Star, EyeOff, Eye, Loader2, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

type ReviewStatus = 'visible' | 'pending' | 'removed'
type FlagReason = 'same_origin_burst' | 'rating_spike' | 'reported'

interface AdminReview {
  id: number
  customerName: string
  rating: number
  comment: string
  ownerReply?: string | null
  entityType: 'bar' | 'distillery' | 'event'
  entityId: number
  createdAt: string
  status: ReviewStatus
  flagReason?: FlagReason | null
}

interface ReviewReport {
  id: number
  reviewId: number
  reason: 'spam' | 'harassment' | 'fake' | 'other'
  note?: string | null
  reporterCustomerId?: number | null
  reporterUserId?: number | null
  createdAt: string
}

/** Plain English for the moderator — the enum values are for the database. */
const FLAG_LABEL: Record<FlagReason, string> = {
  same_origin_burst: 'Several reviews from one connection',
  rating_spike: 'Burst of 5-star reviews on this listing',
  reported: 'Reported by a user',
}

const STATUS_STYLE: Record<ReviewStatus, string> = {
  visible: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  removed: 'bg-red-100 text-red-800',
}

const STATUS_LABEL: Record<ReviewStatus, string> = {
  visible: 'Visible',
  pending: 'Awaiting review',
  removed: 'Removed',
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

export default function AdminReviewsPage() {
  const user = auth.getUser()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'flagged' | 'all' | 'visible' | 'pending' | 'removed'>('flagged')

  const { data: reviews = [], isLoading } = useQuery<AdminReview[]>(
    ['admin-reviews', filter],
    async () => {
      const params: Record<string, string> = {}
      // The queue is the default view — it's what a moderator opens this for.
      if (filter === 'flagged') params.flagged = 'true'
      else if (filter !== 'all') params.status = filter
      return (await api.get('/admin/reviews', { params })).data
    },
    { enabled: user?.role === 'super_admin' },
  )

  // The reports behind flagged reviews, so the moderator can see what people
  // actually said was wrong rather than just that *something* was.
  const { data: reports = [] } = useQuery<ReviewReport[]>(
    'admin-review-reports',
    async () => (await api.get('/admin/review-reports')).data,
    { enabled: user?.role === 'super_admin' },
  )
  const reportsByReview = reports.reduce<Record<number, ReviewReport[]>>((acc, r) => {
    ;(acc[r.reviewId] ||= []).push(r)
    return acc
  }, {})

  const hideMutation = useMutation(
    async ({ id, hidden }: { id: number; hidden: boolean }) =>
      (await api.patch(`/admin/reviews/${id}/${hidden ? 'hide' : 'unhide'}`)).data,
    {
      onSuccess: (_, vars) => {
        toast.success(vars.hidden ? 'Review removed' : 'Review restored — flag cleared')
        queryClient.invalidateQueries(['admin-reviews', filter])
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Update failed')
      },
    },
  )

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">SuperAdmin only</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-600 mt-1">
          Reviews flagged automatically or reported by users are held here, hidden from the site,
          until you rule on them. Nothing hidden counts toward a rating.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-3">
        {(['flagged', 'pending', 'visible', 'removed', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'flagged' ? 'Needs review' : f}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{reviews.length} reviews</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-16 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">
              {filter === 'flagged' ? 'Nothing needs your attention' : 'No reviews match this filter'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {reviews.map((r) => (
              <li key={r.id} className={`p-5 ${r.status !== 'visible' ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{r.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(r.createdAt).toLocaleDateString()} ·{' '}
                      <span className="capitalize">{r.entityType}</span> #{r.entityId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRow rating={r.rating} />
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                </div>
                {r.flagReason && (
                  <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                    <p className="text-xs font-semibold text-amber-900">
                      Why this is here: {FLAG_LABEL[r.flagReason]}
                    </p>
                    {(reportsByReview[r.id] || []).length > 0 && (
                      <ul className="mt-1.5 space-y-1">
                        {(reportsByReview[r.id] || []).map((rep) => (
                          <li key={rep.id} className="text-xs text-amber-900/80">
                            <span className="font-medium capitalize">{rep.reason}</span>
                            {rep.note ? ` — "${rep.note}"` : ''}
                            {rep.reporterUserId ? ' (reported by an operator)' : ''}
                          </li>
                        ))}
                      </ul>
                    )}
                    <p className="mt-1.5 text-[11px] text-amber-800/70">
                      Automatic flags are a guess and are often wrong — a real tasting group posting
                      from one venue&apos;s wifi trips the same check. Read it before deciding.
                    </p>
                  </div>
                )}
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{r.comment}</p>
                {r.ownerReply && (
                  <div className="mt-3 pl-3 border-l-2 border-primary-500/50">
                    <p className="text-xs font-medium text-primary-700 mb-0.5">Owner&apos;s reply</p>
                    <p className="text-sm text-gray-700">{r.ownerReply}</p>
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  {r.status !== 'visible' ? (
                    <button
                      onClick={() => hideMutation.mutate({ id: r.id, hidden: false })}
                      disabled={hideMutation.isLoading}
                      className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      {r.status === 'pending' ? 'Approve — put it back' : 'Restore'}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!confirm('Hide this review? It won\'t count toward the rating.')) return
                        hideMutation.mutate({ id: r.id, hidden: true })
                      }}
                      disabled={hideMutation.isLoading}
                      className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                    >
                      <EyeOff className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
