'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { Search, Eye, CheckCircle, XCircle, Clock, Calendar } from 'lucide-react'
import { api } from '@/lib/api'
import { Order } from '@/lib/types'
import { orderBookingFeeBreakdown } from '@/lib/booking-fees'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function OrdersPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: ordersData, isLoading } = useQuery(
    ['orders', currentPage, statusFilter],
    () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })
      return api.get(`/orders?${params}`).then(res => res.data)
    }
  )

  const updateStatusMutation = useMutation(
    ({ id, status }: { id: number; status: string }) =>
      api.patch(`/orders/${id}/status`, { status }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('orders')
        toast.success('Order status updated successfully')
      },
      onError: () => {
        toast.error('Failed to update order status')
      },
    }
  )

  const orders = ordersData?.data || []
  const total = ordersData?.total || 0
  const totalPages = Math.ceil(total / 10)

  const filteredOrders = orders.filter((order: Order) => {
    const matchesSearch = 
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerPhone && order.customerPhone.includes(searchTerm))
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderTypeLabel = (type: string) => {
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

  const handleStatusUpdate = (id: number, newStatus: string, order?: Order) => {
    // Paid orders that are about to be cancelled trigger an automatic refund.
    // Make sure the owner is aware before they click.
    if (newStatus === 'cancelled' && order?.isPaid) {
      const ok = confirm(
        `This booking has been paid for ($${Number(order.totalAmount).toFixed(2)}). ` +
          'Cancelling it will automatically queue a full refund for SuperAdmin approval. Continue?',
      )
      if (!ok) return
    }
    updateStatusMutation.mutate({ id, status: newStatus })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Orders & Customers</h1>
        <button
          onClick={async () => {
            try {
              const response = await api.get('/orders/export/csv', { responseType: 'blob' })
              const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
              const url = window.URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`)
              document.body.appendChild(link)
              link.click()
              link.remove()
              window.URL.revokeObjectURL(url)
              toast.success('CSV downloaded')
            } catch (error) {
              toast.error('Failed to export CSV')
            }
          }}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Total Orders</div>
          <div className="text-2xl font-bold text-gray-900">{total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {orders.filter((o: Order) => o.status === 'pending').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Confirmed</div>
          <div className="text-2xl font-bold text-green-600">
            {orders.filter((o: Order) => o.status === 'confirmed').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="text-sm text-gray-600">Paid ticket subtotal</div>
          <div className="text-2xl font-bold text-primary-600">
            ${orders.reduce((sum: number, o: Order) => sum + (o.isPaid ? o.totalAmount : 0), 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Ticket total before per-ticket booking fee</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order: Order) => {
                const fee = orderBookingFeeBreakdown(order.totalAmount, order.numberOfGuests)
                return (
                <motion.tr
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      <div className="text-sm text-gray-500">{order.customerEmail}</div>
                      {order.customerPhone && (
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getOrderTypeLabel(order.orderType)}</div>
                    {order.bar && <div className="text-xs text-gray-500">{order.bar.name}</div>}
                    {order.distillery && <div className="text-xs text-gray-500">{order.distillery.name}</div>}
                    {order.event && <div className="text-xs text-gray-500">{order.event.name}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.bookingDate ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {new Date(order.bookingDate).toLocaleDateString()}
                        </div>
                        {order.bookingTime && (
                          <div className="text-xs text-gray-500">{order.bookingTime}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.numberOfGuests}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${fee.ticketSubtotal.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">
                      {order.isPaid ? 'Paid' : 'Unpaid'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${fee.bookingFeeTotal.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">${fee.bookingFeePerTicket.toFixed(0)} × {order.numberOfGuests}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">${fee.customerChargedTotal.toFixed(2)}</div>
                    <div className="text-xs text-gray-500">If paid online</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {order.isPaid && (
                      <div className="mt-1">
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          PAID
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/orders/${order.id}`)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {order.status === 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'confirmed', order)}
                          className="text-green-600 hover:text-green-900"
                          title="Confirm"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                      {order.status !== 'completed' && order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'completed', order)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Complete"
                        >
                          <Clock className="h-5 w-5" />
                        </button>
                      )}
                      {order.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'cancelled', order)}
                          className={`hover:text-red-900 ${order.isPaid ? 'text-red-700' : 'text-red-600'}`}
                          title={order.isPaid ? 'Cancel + refund' : 'Cancel'}
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              )})}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, total)} of {total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

