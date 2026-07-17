'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Bell, CheckCheck, ChevronRight, Loader2 } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { api } from '../../lib/api'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { notificationTypeLabel } from '../../lib/notifications'

interface NotificationItem {
  id: number
  type: string
  status: 'unread' | 'read' | 'archived'
  title: string
  message: string
  createdAt: string
  metadata?: Record<string, any> | null
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
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth()
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api
      .get('/customers/notifications/mine?limit=100')
      .then((res) => setItems(res.data?.items || []))
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?next=/notifications')
      return
    }
    if (!isAuthenticated) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading, router])

  const markAllRead = async () => {
    await api.patch('/customers/notifications/mine/read-all').catch(() => undefined)
    setItems((prev) => prev.map((n) => ({ ...n, status: 'read' as const })))
  }

  const unread = items.filter((n) => n.status === 'unread').length

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="section-title">Notifications</h1>
            <p className="mt-1 text-charcoal-600">
              {unread > 0 ? `${unread} unread` : 'You’re all caught up'}
            </p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} className="btn-secondary w-full sm:w-auto">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-whisky-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="card mt-6 px-6 py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-charcoal-300" />
            <p className="mt-4 text-charcoal-600">No notifications yet.</p>
          </div>
        ) : (
          <ul className="card mt-6 divide-y divide-charcoal-200 overflow-hidden">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/notifications/${n.id}`}
                  className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-charcoal-50 ${
                    n.status === 'unread' ? 'bg-whisky-50/60' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-charcoal-400">
                        {notificationTypeLabel(n.type)}
                      </span>
                      {n.status === 'unread' && (
                        <span className="h-1.5 w-1.5 rounded-full bg-whisky-500" />
                      )}
                    </div>
                    <p className="mt-0.5 font-medium text-ink">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-charcoal-600">{n.message}</p>
                    <p className="mt-1 text-[11px] text-charcoal-400">{timeAgo(n.createdAt)}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-charcoal-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
