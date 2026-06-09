'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Phone,
  Receipt,
  User,
  Users,
  XCircle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { orderBookingFeeBreakdown } from '@/lib/booking-fees'
import toast from 'react-hot-toast'

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery(
    ['order', params.id],
    () => api.get(`/orders/${params.id}`).then((res) => res.data),
    { enabled: !!params.id },
  )

  const updateStatusMutation = useMutation(
    ({ status }: { status: string }) => api.patch(`/orders/${params.id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['order', params.id])
        queryClient.invalidateQueries('orders')
        toast.success('Order status updated successfully')
      },
      onError: () => {
        toast.error('Failed to update order status')
      },
    },
  )

  const handleStatusUpdate = (status: string) => {
    updateStatusMutation.mutate({ status })
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-600">Order not found</p>
          <button onClick={() => router.push('/dashboard/orders')} className="btn-primary mt-4">
            Back to Orders
          </button>
        </div>
      </div>
    )
  }

  const fee = orderBookingFeeBreakdown(order.totalAmount, order.numberOfGuests)
  const venueName = order.bar?.name || order.distillery?.name || order.event?.name || 'Unassigned'
  const venueLabel = order.bar ? 'Bar' : order.distillery ? 'Distillery' : order.event ? 'Event' : 'Listing'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/orders')}
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            title="Back to orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-950">Order #{order.id}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {getOrderTypeLabel(order.orderType)} for {venueName}
            </p>
          </div>
        </div>
        <div className="text-left md:text-right">
          <p className="text-sm text-gray-500">Customer total</p>
          <p className="text-2xl font-semibold text-gray-950">${fee.customerChargedTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <SectionCard title="Customer">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoItem icon={User} label="Name" value={order.customerName} />
              <InfoItem icon={Mail} label="Email" value={order.customerEmail} />
              <InfoItem icon={Phone} label="Phone" value={order.customerPhone || 'Not provided'} />
            </div>
          </SectionCard>

          <SectionCard title="Booking">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoItem icon={Receipt} label="Order Type" value={getOrderTypeLabel(order.orderType)} />
              <InfoItem icon={MapPin} label={venueLabel} value={venueName} />
              <InfoItem
                icon={Calendar}
                label="Booking Date"
                value={order.bookingDate ? new Date(order.bookingDate).toLocaleDateString() : 'Not scheduled'}
              />
              <InfoItem icon={Clock} label="Time" value={order.bookingTime || 'Not scheduled'} />
              <InfoItem icon={Users} label="Guests" value={String(order.numberOfGuests)} />
            </div>
          </SectionCard>

          {order.specialRequests && (
            <SectionCard title="Special Requests">
              <p className="text-sm leading-6 text-gray-700">{order.specialRequests}</p>
            </SectionCard>
          )}
        </div>

        <aside className="space-y-6">
          <SectionCard title="Payment Summary">
            <div className="space-y-3 text-sm">
              <SummaryRow label="Ticket subtotal" value={`$${fee.ticketSubtotal.toFixed(2)}`} />
              <SummaryRow label="Booking fee" value={`$${fee.bookingFeeTotal.toFixed(2)}`} />
              <SummaryRow label="Customer total" value={`$${fee.customerChargedTotal.toFixed(2)}`} strong />
              <div className="border-t border-gray-200 pt-3" />
              <SummaryRow label="Payment status" value={order.isPaid ? 'Paid' : 'Unpaid'} tone={order.isPaid ? 'success' : 'warning'} />
              <SummaryRow label="Payment method" value={order.paymentMethod || 'Not recorded'} />
              <SummaryRow label="Created" value={new Date(order.createdAt).toLocaleDateString()} />
            </div>
          </SectionCard>

          <SectionCard title="Status Actions">
            <div className="space-y-3">
              {order.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updateStatusMutation.isLoading}
                  className="btn-primary w-full bg-emerald-700 hover:bg-emerald-800"
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm Order
                </button>
              )}
              {order.status !== 'completed' && order.status !== 'cancelled' && (
                <button
                  onClick={() => handleStatusUpdate('completed')}
                  disabled={updateStatusMutation.isLoading}
                  className="btn-primary w-full"
                >
                  <Clock className="h-4 w-4" />
                  Mark Completed
                </button>
              )}
              {order.status !== 'cancelled' && (
                <button
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateStatusMutation.isLoading}
                  className="btn-danger w-full"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Order
                </button>
              )}
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-950">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 break-words text-sm font-semibold text-gray-950">{value}</p>
    </div>
  )
}

function SummaryRow({
  label,
  value,
  strong,
  tone,
}: {
  label: string
  value: string
  strong?: boolean
  tone?: 'success' | 'warning'
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-600">{label}</span>
      <span
        className={`text-right ${strong ? 'text-base font-semibold text-gray-950' : 'font-medium text-gray-900'} ${
          tone === 'success' ? 'text-emerald-700' : tone === 'warning' ? 'text-amber-700' : ''
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === 'confirmed'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : status === 'pending'
      ? 'bg-amber-50 text-amber-700 ring-amber-200'
      : status === 'completed'
      ? 'bg-blue-50 text-blue-700 ring-blue-200'
      : status === 'cancelled'
      ? 'bg-red-50 text-red-700 ring-red-200'
      : 'bg-gray-50 text-gray-700 ring-gray-200'

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${color}`}>
      {status}
    </span>
  )
}

function getOrderTypeLabel(type: string) {
  switch (type) {
    case 'bar_reservation':
      return 'Bar Reservation'
    case 'distillery_tour':
      return 'Distillery Tour'
    case 'event_booking':
      return 'Event Booking'
    default:
      return type
  }
}
