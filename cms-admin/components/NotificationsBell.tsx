'use client'

import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

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
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<NotificationsResponse>(
    'my-notifications',
    async () => (await api.get('/notifications/mine?limit=20')).data,
    { refetchInterval: 30000 },
  )

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const markReadMutation = useMutation(
    async (id: number) => (await api.patch(`/notifications/mine/${id}/read`)).data,
    { onSuccess: () => queryClient.invalidateQueries('my-notifications') },
  )

  const markAllReadMutation = useMutation(
    async () => (await api.patch('/notifications/mine/read-all')).data,
    { onSuccess: () => queryClient.invalidateQueries('my-notifications') },
  )

  const items = data?.items || []
  const unread = data?.unreadCount || 0

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 text-gray-700"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isLoading}
                className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-gray-500">
                You&apos;re all caught up — no notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {items.map((n) => (
                  <li
                    key={n.id}
                    onClick={() => n.status === 'unread' && markReadMutation.mutate(n.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${
                      n.status === 'unread' ? 'bg-primary-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{n.title}</p>
                      {n.status === 'unread' && (
                        <span className="mt-1 inline-block w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
