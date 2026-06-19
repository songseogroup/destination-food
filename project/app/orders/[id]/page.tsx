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
    banner: 'bg-yellow-500/10 border-yellow-500/40',
    bannerText: 'text-yellow-300',
    icon: Hourglass,
    description: 'The venue has received your booking and will confirm shortly. Your ticket activates the moment they confirm.',
  },
  confirmed: {
    label: 'Confirmed — your ticket is ready',
    banner: 'bg-green-500/10 border-green-500/40',
    bannerText: 'text-green-300',
    icon: CheckCircle,
    description: 'Show this ticket at the venue. Arrive 10 minutes early.',
  },
  completed: {
    label: 'Completed',
    banner: 'bg-gray-500/10 border-gray-500/40',
    bannerText: 'text-gray-300',
    icon: Sparkles,
    description: 'Thanks for visiting! Consider leaving a review on the venue page.',
  },
  cancelled: {
    label: 'Cancelled',
    banner: 'bg-red-500/10 border-red-500/40',
    bannerText: 'text-red-300',
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
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => router.push('/orders')}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my bookings
        </button>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        ) : error || !order ? (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-xl p-6">
            {error || 'Booking not found'}
          </div>
        ) : (
          <>
            <Ticket order={order} />

            {/* Order details */}
            <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Booking details</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <Field label="Booking reference" value={`#${order.id.toString().padStart(6, '0')}`} />
                <Field label="Booked on" value={new Date(order.createdAt).toLocaleString()} />
                <Field label="Booking name" value={order.customerName || '—'} />
                <Field label="Email" value={order.customerEmail || '—'} />
                {order.customerPhone && <Field label="Phone" value={order.customerPhone} />}
                <Field label="Guests" value={String(order.numberOfGuests)} />
                {order.bookingDate && <Field label="Date" value={formatDate(order.bookingDate)} />}
                {order.bookingTime && <Field label="Time" value={order.bookingTime} />}
                <Field label="Total" value={`$${Number(order.totalAmount).toFixed(2)} ${order.isPaid ? '(paid)' : '(pay at venue)'}`} />
              </dl>
              {order.specialRequests && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Special requests</p>
                  <p className="text-sm text-gray-300 whitespace-pre-line">{order.specialRequests}</p>
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
      <div className={`mb-4 px-4 py-3 border rounded-lg flex items-start gap-3 ${status.banner}`}>
        <StatusIcon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${status.bannerText}`} />
        <div className="min-w-0">
          <p className={`font-semibold ${status.bannerText}`}>{status.label}</p>
          <p className="text-sm text-gray-300 mt-0.5">{status.description}</p>
        </div>
      </div>

      {/* The ticket card */}
      <div className="relative bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl overflow-hidden shadow-2xl shadow-primary-500/5">
        {/* Top stripe */}
        <div className="h-2 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500" />

        {/* Listing image as header */}
        {listing.image && (
          <div className="h-40 bg-cover bg-center relative" style={{ backgroundImage: `url(${listing.image})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-6">
              {listing.href ? (
                <Link href={listing.href} className="text-2xl font-bold text-white hover:text-primary-500 transition-colors">
                  {listing.name}
                </Link>
              ) : (
                <h3 className="text-2xl font-bold text-white">{listing.name}</h3>
              )}
              {listing.location && (
                <p className="flex items-center gap-1.5 text-sm text-gray-300 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {listing.location}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Ticket body */}
        <div className="px-6 py-7">
          <div className="text-center pb-6 border-b border-dashed border-gray-700">
            <p className="text-xs font-bold tracking-[0.3em] text-primary-500 uppercase">Booking Reference</p>
            <p className="text-4xl font-extrabold text-white mt-2 tracking-wider">{ref}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 mt-6">
            <TicketCell icon={Calendar} label="Date" value={formatDate(order.bookingDate) || '—'} />
            <TicketCell icon={Clock} label="Time" value={order.bookingTime || '—'} />
            <TicketCell icon={Users} label="Guests" value={String(order.numberOfGuests)} />
            <TicketCell icon={DollarSign} label="Total" value={`$${Number(order.totalAmount).toFixed(2)}`} />
          </div>

          <p className="mt-7 pt-5 border-t border-dashed border-gray-700 text-xs text-center text-gray-500">
            Show this screen at the venue. Reference {ref}.
          </p>
        </div>

        {/* Side notches for the ticket-stub feel */}
        <div className="absolute left-0 top-[12rem] w-4 h-8 bg-black rounded-r-full -ml-2 hidden sm:block" />
        <div className="absolute right-0 top-[12rem] w-4 h-8 bg-black rounded-l-full -mr-2 hidden sm:block" />
      </div>
    </motion.div>
  )
}

function TicketCell({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
        <Icon className="h-3 w-3" />
        {label}
      </p>
      <p className="text-base font-semibold text-white mt-1">{value}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="text-sm text-white mt-0.5">{value}</dd>
    </div>
  )
}
