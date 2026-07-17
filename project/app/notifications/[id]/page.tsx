'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Bell, Loader2 } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { api } from '../../../lib/api'
import { useCustomerAuth } from '../../../contexts/CustomerAuthContext'
import { notificationTarget, notificationTypeLabel } from '../../../lib/notifications'

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
 * booking. The related record is offered as a link you choose to follow, so the
 * back button returns here and a shared link keeps showing the notification.
 */
export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth()
  const [item, setItem] = useState<NotificationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?next=/notifications/${id}`)
      return
    }
    if (!isAuthenticated) return

    let cancelled = false
    api
      .get(`/customers/notifications/mine/${id}`)
      .then((res) => {
        if (cancelled) return
        setItem(res.data)
        // Opening it is what marks it read — no separate click needed.
        if (res.data?.status === 'unread') {
          api.patch(`/customers/notifications/mine/${id}/read`).catch(() => undefined)
        }
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id, isAuthenticated, authLoading, router])

  const target = item ? notificationTarget(item) : null

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1.5 text-sm text-charcoal-600 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          All notifications
        </Link>

        {loading ? (
          <div className="mt-8 flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-whisky-500" />
          </div>
        ) : notFound || !item ? (
          <div className="card mt-8 px-6 py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-charcoal-300" />
            <h1 className="section-title mt-4">Notification not found</h1>
            <p className="mt-2 text-charcoal-600">
              It may have been removed, or it isn&apos;t yours to view.
            </p>
            <Link href="/notifications" className="btn-secondary mt-6 inline-flex">
              Back to notifications
            </Link>
          </div>
        ) : (
          <article className="card mt-6 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="pill-gold uppercase tracking-[0.15em]">
                {notificationTypeLabel(item.type)}
              </span>
              <time className="text-sm text-charcoal-500" dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleString(undefined, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </time>
            </div>

            <h1 className="section-title mt-4">{item.title}</h1>
            <p className="mt-4 whitespace-pre-line leading-relaxed text-charcoal-700">
              {item.message}
            </p>

            {target && (
              <div className="mt-8 border-t border-charcoal-200 pt-6">
                <Link href={target.href} className="btn-primary inline-flex w-full sm:w-auto">
                  {target.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </article>
        )}
      </main>
      <Footer />
    </div>
  )
}
