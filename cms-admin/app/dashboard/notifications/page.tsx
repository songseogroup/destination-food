'use client'

import Link from 'next/link'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Bell, CheckCheck, ChevronRight, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { notificationTypeLabel } from '@/lib/notifications'

interface NotificationItem {
  id: number
  type: string
  status: 'unread' | 'read' | 'archived'
  title: string
  message: string
  createdAt: string
  metadata?: Record<string, any> | null
}

interface NotificationsResponse {
  items: NotificationItem[]
  unreadCount: number
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime())
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

/** The full history behind the bell, which only ever shows the latest few. */
export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<NotificationsResponse>('all-notifications', async () =>
    (await api.get('/notifications/mine?limit=100')).data,
  )

  const markAllRead = useMutation(
    async () => (await api.patch('/notifications/mine/read-all')).data,
    {
      onSuccess: () => {
        queryClient.invalidateQueries('all-notifications')
        queryClient.invalidateQueries('my-notifications')
      },
    },
  )

  const items = data?.items || []
  const unread = data?.unreadCount || 0

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-600">
            {unread > 0 ? `${unread} unread` : 'You’re all caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isLoading}
            className="btn-secondary w-full sm:w-auto"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-whisky-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="card px-6 py-16 text-center">
          <Bell className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-4 text-gray-600">No notifications yet.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-gray-100 overflow-hidden p-0">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={`/dashboard/notifications/${n.id}`}
                className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50 ${
                  n.status === 'unread' ? 'bg-primary-50/40' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] uppercase tracking-wider text-gray-400">
                      {notificationTypeLabel(n.type)}
                    </span>
                    {n.status === 'unread' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <p className="mt-0.5 font-medium text-gray-900">{n.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-600">{n.message}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-gray-300" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
