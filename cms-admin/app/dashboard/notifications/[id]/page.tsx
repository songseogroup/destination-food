'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { ArrowLeft, ArrowRight, Bell, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { notificationTarget, notificationTypeLabel } from '@/lib/notifications'

interface NotificationDetail {
  id: number
  type: string
  status: 'unread' | 'read' | 'archived'
  title: string
  message: string
  createdAt: string
  metadata?: Record<string, any> | null
}

/**
 * A notification's own page.
 *
 * This is the destination, not a waypoint: it never bounces you onward to the
 * booking or payout. The related record is offered as a link you choose to
 * follow, so the back button returns here and a shared link keeps working.
 */
export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const { data, isLoading, isError } = useQuery<NotificationDetail>(
    ['notification', id],
    async () => (await api.get(`/notifications/mine/${id}`)).data,
    { retry: false },
  )

  const markRead = useMutation(
    async () => (await api.patch(`/notifications/mine/${id}/read`)).data,
    { onSuccess: () => queryClient.invalidateQueries('my-notifications') },
  )

  // Opening it is what marks it read — no separate click needed.
  useEffect(() => {
    if (data?.status === 'unread') markRead.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.status])

  const target = data ? notificationTarget(data) : null

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/dashboard/notifications"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 transition-colors hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        All notifications
      </Link>

      {isLoading ? (
        <div className="card flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-whisky-500" />
        </div>
      ) : isError || !data ? (
        <div className="card px-6 py-16 text-center">
          <Bell className="mx-auto h-8 w-8 text-gray-300" />
          <h1 className="section-title mt-4">Notification not found</h1>
          <p className="mt-2 text-gray-600">
            It may have been removed, or it isn&apos;t yours to view.
          </p>
          <Link href="/dashboard/notifications" className="btn-secondary mt-6 inline-flex">
            Back to notifications
          </Link>
        </div>
      ) : (
        <article className="card p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-gray-600">
              {notificationTypeLabel(data.type)}
            </span>
            <time className="text-sm text-gray-500" dateTime={data.createdAt}>
              {new Date(data.createdAt).toLocaleString(undefined, {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </time>
          </div>

          <h1 className="mt-4 text-2xl font-bold text-gray-900">{data.title}</h1>
          <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-700">{data.message}</p>

          {target && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <Link href={target.href} className="btn-primary inline-flex w-full sm:w-auto">
                {target.label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </article>
      )}
    </div>
  )
}
