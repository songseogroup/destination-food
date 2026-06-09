'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, Users, DollarSign, Mail, Phone, MapPin } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import { apiService } from '../../../lib/api'
import { Order } from '../../../lib/types'

export default function OrderConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await apiService.getOrder(Number(params.id))
        setOrder(response.data)
      } catch (err: any) {
        setError('Order not found')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Order Not Found</h1>
          <p className="text-gray-400 mb-8">{error || 'The order you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary-500 hover:bg-primary-600 text-black font-semibold py-3 px-6 rounded-lg"
          >
            Go Home
          </button>
        </main>
        <Footer />
      </div>
    )
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'completed':
        return 'bg-blue-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-lg p-8"
        >
          {/* Success Header */}
          <div className="text-center mb-8">
            <CheckCircle className="w-20 h-20 text-primary-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-gray-400">Your booking has been received and is being processed.</p>
          </div>

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-400">Order Type</p>
                    <p className="font-semibold">{getOrderTypeLabel(order.orderType)}</p>
                  </div>
                </div>
                {order.bookingDate && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-400">Booking Date</p>
                      <p className="font-semibold">{new Date(order.bookingDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
                {order.bookingTime && (
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-400">Time</p>
                      <p className="font-semibold">{order.bookingTime}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-400">Number of Guests</p>
                    <p className="font-semibold">{order.numberOfGuests}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-400">Total Amount</p>
                    <p className="font-semibold">${order.totalAmount}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-400">Name</p>
                  <p className="font-semibold">{order.customerName}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary-500" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-semibold">{order.customerEmail}</p>
                  </div>
                </div>
                {order.customerPhone && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-primary-500" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="font-semibold">{order.customerPhone}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400">Order Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Reference */}
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">Order Reference</h2>
            <p className="text-2xl font-bold text-primary-500">#{order.id}</p>
            <p className="text-sm text-gray-400 mt-2">Please save this reference number for your records.</p>
          </div>

          {/* Special Requests */}
          {order.specialRequests && (
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-semibold mb-4">Special Requests</h2>
              <p className="text-gray-300">{order.specialRequests}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/')}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Home
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Print Confirmation
            </button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}

