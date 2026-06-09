'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useCart } from '../../contexts/CartContext'

const SERVICE_FEE = 2.99

export default function CartPage() {
  const router = useRouter()
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartCount, isLoading } = useCart()

  const subtotal = getCartTotal()
  const total = subtotal + SERVICE_FEE

  // Group items by type for summary
  const groupedItems = cartItems.reduce((acc, item) => {
    const type = item.type
    if (!acc[type]) {
      acc[type] = { count: 0, label: getTypeLabel(type) }
    }
    acc[type].count += item.quantity
    return acc
  }, {} as Record<string, { count: number; label: string }>)

  function getTypeLabel(type: string) {
    switch (type) {
      case 'bar': return 'Bar Reservations'
      case 'distillery': return 'Distillery Tours'
      case 'event': return 'Event Bookings'
      default: return 'Items'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Empty Cart State
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>
              <p className="text-gray-600">Review your items and proceed to checkout</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Looks like you haven&apos;t added any experiences yet. Browse our bars, distilleries, and events to start planning your next adventure!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/bars" className="btn-primary">
                  Explore Bars
                </Link>
                <Link href="/distilleries" className="btn-secondary">
                  Visit Distilleries
                </Link>
                <Link href="/events" className="btn-secondary">
                  Discover Events
                </Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Cart</h1>
            <p className="text-gray-600">Review your items and proceed to checkout</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Cart Items ({getCartCount()})
                  </h2>
                </div>

                <div className="divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex gap-4">
                        {/* Item Image */}
                        <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Item Details */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full mb-2 capitalize">
                                {item.type}
                              </span>
                              <h3 className="font-semibold text-gray-900">{item.title}</h3>
                              {item.location && (
                                <p className="text-sm text-gray-600">{item.location}</p>
                              )}
                              {item.date && (
                                <p className="text-sm text-gray-500">Date: {item.date}</p>
                              )}
                              {item.time && (
                                <p className="text-sm text-gray-500">Time: {item.time}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">${item.price.toFixed(2)}</p>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border border-gray-300 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-1 border-x border-gray-300 font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Promo Code */}
              <div className="bg-white rounded-xl shadow-sm mt-6 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Promo Code</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button className="btn-secondary whitespace-nowrap">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                {/* Items Summary */}
                {Object.entries(groupedItems).length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Booking Summary</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(groupedItems).map(([type, data]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-gray-600">{data.label}</span>
                          <span className="text-gray-900">{data.count} {data.count === 1 ? 'item' : 'items'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Service Fee</span>
                    <span>${SERVICE_FEE.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => router.push('/checkout')}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg font-semibold"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link
                    href="/bars"
                    className="w-full btn-secondary text-center block py-3"
                  >
                    Continue Shopping
                  </Link>
                </div>

                {/* Payment Methods */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600 mb-2">Secure payment with</p>
                  <div className="flex justify-center items-center gap-3">
                    <span className="text-2xl" title="Credit Card">�</span>
                    <span className="text-2xl" title="Digital Wallet">📱</span>
                    <span className="text-2xl" title="Stripe">🔒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 