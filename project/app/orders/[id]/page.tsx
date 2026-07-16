'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  Hourglass,
  XCircle,
  Sparkles,
  ArrowLeft,
  Loader2,
  MapPin,
  DollarSign,
} from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { apiService } from '../../../lib/api'
import { formatPrice } from '../../../lib/format'

interface Order {
  id: number
  orderType: 'bar_reservation' | 'distillery_tour' | 'event_booking'
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  totalAmount: string | number
  numberOfGuests: number
  bookingDate?: string | null
  bookingTime?: string | null
  specialRequests?: string | null
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  isPaid?: boolean
  createdAt: string
  bar?: { id: number; name: string; image?: string; location?: string; address?: string } | null
  distillery?: { id: number; name: string; image?: string; location?: string; address?: string } | null
  event?: { id: number; name: string; image?: string; location?: string } | null
}

const STATUS_COPY: Record<string, { label: string; banner: string; bannerText: string; icon: React.ElementType; description: string }> = {
  pending: {
    label: 'Pending confirmation',
    banner: 'bg-status-warningSoft border-status-warning/25',
    bannerText: 'text-status-warning',
    icon: Hourglass,
    description: 'The venue has received your booking and will confirm shortly. Your ticket activates the moment they confirm.',
  },
  confirmed: {
    label: 'Confirmed — your ticket is ready',
    banner: 'bg-status-successSoft border-status-success/25',
    bannerText: 'text-status-success',
    icon: CheckCircle,
    description: 'Show this ticket at the venue. Arrive 10 minutes early.',
  },
  completed: {
    label: 'Completed',
    banner: 'bg-charcoal-100 border-charcoal-200',
    bannerText: 'text-charcoal-700',
    icon: Sparkles,
    description: 'Thanks for visiting! Consider leaving a review on the venue page.',
  },
  cancelled: {
    label: 'Cancelled',
    banner: 'bg-status-dangerSoft border-status-danger/25',
    bannerText: 'text-status-danger',
    icon: XCircle,
    description: "This booking was cancelled. If you've paid, a refund is being processed.",
  },
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

function listingFor(o: Order): { name: string; image?: string; location?: string; href?: string } {
  if (o.bar) return { name: o.bar.name, image: o.bar.image, location: o.bar.address || o.bar.location, href: `/bars/${o.bar.id}` }
  if (o.distillery) return { name: o.distillery.name, image: o.distillery.image, location: o.distillery.address || o.distillery.location, href: `/distilleries/${o.distillery.id}` }
  if (o.event) return { name: o.event.name, image: o.event.image, location: o.event.location, href: `/events/${o.event.id}` }
  return { name: 'Listing' }
}

export default function OrderTicketPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params?.id)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setLoading(true)
    apiService
      .getMyCustomerOrder(id)
      .then((res) => {
        if (!cancelled) setOrder(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        // 403 here usually means the JWT belongs to a different customer.
        // 404 means the id isn't theirs (or doesn't exist).
        if (err.response?.status === 401) {
          setError('Please sign in to view this booking.')
        } else if (err.response?.status === 403) {
          setError("This booking belongs to a different account.")
        } else {
          setError(err.response?.data?.message || 'Booking not found')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-2 text-sm text-charcoal-500 transition-colors hover:text-ink mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my bookings
        </button>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-charcoal-400" />
          </div>
        ) : error || !order ? (
          <div
            role="alert"
            className="rounded-xl border border-status-danger/25 bg-status-dangerSoft p-6 text-status-danger"
          >
            {error || 'Booking not found'}
          </div>
        ) : (
          <>
            <Ticket order={order} />

            {/* Order details */}
            <div className="mt-8 card p-6">
              <h2 className="font-display text-lg font-semibold text-ink mb-4">Booking details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <Field label="Booking reference" value={`#${order.id.toString().padStart(6, '0')}`} />
                <Field label="Booked on" value={new Date(order.createdAt).toLocaleString()} />
                <Field label="Booking name" value={order.customerName || '—'} />
                <Field label="Email" value={order.customerEmail || '—'} />
                {order.customerPhone && <Field label="Phone" value={order.customerPhone} />}
                <Field label="Guests" value={String(order.numberOfGuests)} />
                {order.bookingDate && <Field label="Date" value={formatDate(order.bookingDate)} />}
                {order.bookingTime && <Field label="Time" value={order.bookingTime} />}
                <Field
                  label="Total"
                  value={`${formatPrice(order.totalAmount) ?? 'Free'} ${order.isPaid ? '(paid)' : '(pay at venue)'}`}
                />
              </dl>
              {order.specialRequests && (
                <div className="mt-6 pt-6 border-t border-charcoal-200">
                  <p className="text-xs uppercase tracking-wider text-charcoal-500 mb-1">Special requests</p>
                  <p className="text-sm text-charcoal-600 whitespace-pre-line">{order.specialRequests}</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}

function Ticket({ order }: { order: Order }) {
  const status = STATUS_COPY[order.status] || STATUS_COPY.pending
  const StatusIcon = status.icon
  const listing = listingFor(order)
  const ref = `#${order.id.toString().padStart(6, '0')}`

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
      {/* Status banner */}
      <div className={`mb-4 px-4 py-3 border rounded-xl flex items-start gap-3 ${status.banner}`}>
        <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${status.bannerText}`} />
        <div className="min-w-0">
          <p className={`font-semibold ${status.bannerText}`}>{status.label}</p>
          <p className="text-sm text-charcoal-600 mt-0.5">{status.description}</p>
        </div>
      </div>

      {/* The ticket card */}
      <div className="relative card overflow-hidden shadow-lifted">
        {/* Top stripe */}
        <div className="h-2 bg-gradient-to-r from-whisky-500 via-whisky-400 to-whisky-500" />

        {/* Listing image as header — the scrim keeps the name legible over any photo. */}
        {listing.image && (
          <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${listing.image})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/60 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-6">
              {listing.href ? (
                <Link
                  href={listing.href}
                  className="font-display text-2xl font-bold text-white transition-colors hover:text-whisky-300"
                >
                  {listing.name}
                </Link>
              ) : (
                <h3 className="font-display text-2xl font-bold text-white">{listing.name}</h3>
              )}
              {listing.location && (
                <p className="flex items-center gap-1.5 text-sm text-charcoal-100 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.location}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ticket body */}
        <div className="px-6 py-7">
          <div className="text-center pb-6 border-b border-dashed border-charcoal-300">
            <p className="text-xs font-bold tracking-[0.3em] text-whisky-700 uppercase">Booking Reference</p>
            <p className="font-display text-4xl font-extrabold text-ink mt-2 tracking-wider">{ref}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-6">
            <TicketCell icon={Calendar} label="Date" value={formatDate(order.bookingDate) || '—'} />
            <TicketCell icon={Clock} label="Time" value={order.bookingTime || '—'} />
            <TicketCell icon={Users} label="Guests" value={String(order.numberOfGuests)} />
            <TicketCell icon={DollarSign} label="Total" value={formatPrice(order.totalAmount) ?? 'Free'} />
          </div>

          <p className="mt-7 pt-5 border-t border-dashed border-charcoal-300 text-xs text-center text-charcoal-500">
            Show this screen at the venue. Reference {ref}.
          </p>
        </div>

        {/* Side notches for the ticket-stub feel — these punch through to the page,
            so they track the page background (cream), not the card. */}
        <div className="absolute left-0 top-[12rem] w-4 h-8 bg-cream rounded-r-full -ml-2 hidden sm:block" />
        <div className="absolute right-0 top-[12rem] w-4 h-8 bg-cream rounded-l-full -mr-2 hidden sm:block" />
      </div>
    </motion.div>
  )
}

function TicketCell({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-charcoal-500 uppercase">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-base font-semibold text-ink mt-1">{value}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-charcoal-500">{label}</dt>
      <dd className="text-sm text-ink mt-0.5">{value}</dd>
    </div>
  )
}
