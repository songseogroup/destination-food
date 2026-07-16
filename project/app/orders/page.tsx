'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Users,
  ArrowRight,
  CheckCircle,
  XCircle,
  Hourglass,
  Sparkles,
  Loader2,
  Ticket,
} from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { apiService } from '../../lib/api'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { formatPrice } from '../../lib/format'

interface OrderRow {
  id: number
  orderType: 'bar_reservation' | 'distillery_tour' | 'event_booking'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  totalAmount: string | number
  numberOfGuests: number
  bookingDate?: string | null
  bookingTime?: string | null
  createdAt: string
  bar?: { id: number; name: string; image?: string } | null
  distillery?: { id: number; name: string; image?: string } | null
  event?: { id: number; name: string; image?: string } | null
}

const STATUS_META: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending: { label: 'Pending confirmation', bg: 'bg-status-warningSoft border-status-warning/25', text: 'text-status-warning', icon: Hourglass },
  confirmed: { label: 'Confirmed', bg: 'bg-status-successSoft border-status-success/25', text: 'text-status-success', icon: CheckCircle },
  completed: { label: 'Completed', bg: 'bg-charcoal-100 border-charcoal-200', text: 'text-charcoal-600', icon: Sparkles },
  cancelled: { label: 'Cancelled', bg: 'bg-status-dangerSoft border-status-danger/25', text: 'text-status-danger', icon: XCircle },
}

function listingFor(o: OrderRow): { name: string; image?: string; href?: string } {
  if (o.bar) return { name: o.bar.name, image: o.bar.image, href: `/bars/${o.bar.id}` }
  if (o.distillery) return { name: o.distillery.name, image: o.distillery.image, href: `/distilleries/${o.distillery.id}` }
  if (o.event) return { name: o.event.name, image: o.event.image, href: `/events/${o.event.id}` }
  return { name: 'Listing removed' }
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function CustomerOrdersPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useCustomerAuth()
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login')
      return
    }
    if (!isAuthenticated) return
    let cancelled = false
    setLoading(true)
    apiService
      .getMyCustomerOrders()
      .then((res) => {
        if (!cancelled) setOrders(res.data || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Could not load your bookings')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [authLoading, isAuthenticated, router])

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Ticket className="h-7 w-7 text-whisky-500" />
          <h1 className="section-title">My Bookings</h1>
        </div>
        <p className="text-charcoal-600 mb-8">
          Your reservations across bars, distilleries, and events. Tap any booking to see your ticket.
        </p>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-charcoal-400" />
          </div>
        ) : error ? (
          <div
            role="alert"
            className="rounded-xl border border-status-danger/25 bg-status-dangerSoft p-6 text-status-danger"
          >
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center">
            <Ticket className="h-12 w-12 text-charcoal-300 mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold text-ink">No bookings yet</h3>
            <p className="text-charcoal-500 mt-2 max-w-md mx-auto">
              When you book a whisky tasting, distillery tour, or event, your tickets will appear here.
            </p>
            <Link href="/" className="btn-primary mt-6">
              Explore experiences
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((o, idx) => {
              const listing = listingFor(o)
              const status = STATUS_META[o.status] || STATUS_META.pending
              const StatusIcon = status.icon
              const ref = `#${o.id.toString().padStart(6, '0')}`
              return (
                <motion.li
                  key={o.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => router.push(`/orders/${o.id}`)}
                  className="group card-interactive overflow-hidden cursor-pointer"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-0">
                    <div
                      className="h-32 sm:h-full bg-cover bg-center bg-charcoal-100"
                      style={{ backgroundImage: listing.image ? `url(${listing.image})` : undefined }}
                    />
                    <div className="p-5 flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold tracking-wider uppercase text-whisky-700">{ref}</p>
                          <h3 className="font-display text-lg font-semibold text-ink mt-0.5">{listing.name}</h3>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${status.bg} ${status.text}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-charcoal-600 mt-1">
                        {o.bookingDate && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-charcoal-400" />
                            {formatDate(o.bookingDate)}
                          </span>
                        )}
                        {o.bookingTime && (
                          <span className="inline-flex items-center gap-1.5">
                            <Clock className="h-4 w-4 text-charcoal-400" />
                            {o.bookingTime}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-charcoal-400" />
                          {o.numberOfGuests} {o.numberOfGuests === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <p className="text-lg font-bold text-ink">
                          {formatPrice(o.totalAmount) ?? 'Free'}
                        </p>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-whisky-700 transition-colors group-hover:text-whisky-600">
                          View ticket
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.li>
              )
            })}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  )
}
