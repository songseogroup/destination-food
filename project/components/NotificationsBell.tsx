'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { api } from '../lib/api'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'

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

export default function NotificationsBell() {
  const { isAuthenticated } = useCustomerAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return
    setLoading(true)
    try {
      const res = await api.get('/customers/notifications/mine?limit=20')
      setData(res.data)
    } catch {
      // silent — not critical
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchNotifications])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Marking a single one read is the detail page's job now — opening it is what
  // marks it, so the bell doesn't duplicate that.
  const markAllRead = async () => {
    try {
      await api.patch('/customers/notifications/mine/read-all')
      fetchNotifications()
    } catch {}
  }

  if (!isAuthenticated) return null

  const items = data?.items || []
  const unread = data?.unreadCount || 0

  return (
    <div className="relative" ref={dropdownRef}>
      {/*
        The bell trigger lives in the dark header chrome (bg-charcoal-900), so it
        stays light-on-dark. Only the dropdown panel becomes a light surface.
      */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full text-charcoal-100 transition-colors hover:bg-charcoal-800"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-whisky-500 text-white text-[10px] font-bold rounded-full">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] card shadow-lifted z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-charcoal-200 flex items-center justify-between">
            <h3 className="font-display font-semibold text-ink">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs flex items-center gap-1 font-medium text-whisky-700 transition-colors hover:text-whisky-600"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading && !data ? (
              <div className="px-4 py-8 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-charcoal-400" />
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-charcoal-500">
                You&apos;re all caught up — no notifications yet.
              </div>
            ) : (
              <ul className="divide-y divide-charcoal-200">
                {items.map((n) => (
                  <li key={n.id}>
                    {/* A real link, not a div with a click handler: the row looked
                        clickable but only marked itself read and went nowhere. */}
                    <Link
                      href={`/notifications/${n.id}`}
                      onClick={() => setOpen(false)}
                      className={`block px-4 py-3 transition-colors hover:bg-charcoal-50 ${
                        n.status === 'unread' ? 'bg-whisky-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        {n.status === 'unread' && (
                          <span className="mt-1 inline-block w-2 h-2 bg-whisky-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-charcoal-600 line-clamp-2">{n.message}</p>
                      <p className="mt-1 text-[11px] text-charcoal-400">{timeAgo(n.createdAt)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block border-t border-charcoal-200 px-4 py-3 text-center text-sm font-medium text-whisky-700 transition-colors hover:bg-charcoal-50"
            >
              View all notifications
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
