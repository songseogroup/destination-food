'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useCart } from '../../contexts/CartContext'
import { formatPrice } from '../../lib/format'

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
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="py-8">
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
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h1 className="section-title mb-2">Your Cart</h1>
              <p className="text-charcoal-600">Review your items and proceed to checkout</p>
            </div>

            <div className="card p-12 text-center">
              <div className="w-24 h-24 bg-charcoal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-charcoal-400" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-ink mb-3">Your cart is empty</h3>
              <p className="text-charcoal-600 mb-8 max-w-md mx-auto">
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
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="section-title mb-2">Your Cart</h1>
            <p className="text-charcoal-600">Review your items and proceed to checkout</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="p-6 border-b border-charcoal-200">
                  <h2 className="font-display text-xl font-semibold text-ink">
                    Cart Items ({getCartCount()})
                  </h2>
                </div>

                <div className="divide-y divide-charcoal-200">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex gap-4">
                        {/* Item Image */}
                        <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-charcoal-100">
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
                              <span className="pill-gold mb-2 capitalize">{item.type}</span>
                              <h3 className="font-semibold text-ink">{item.title}</h3>
                              {item.location && (
                                <p className="text-sm text-charcoal-600">{item.location}</p>
                              )}
                              {item.date && (
                                <p className="text-sm text-charcoal-500">Date: {item.date}</p>
                              )}
                              {item.time && (
                                <p className="text-sm text-charcoal-500">Time: {item.time}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-ink">{formatPrice(item.price) ?? 'Free'}</p>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border border-charcoal-300 rounded-full overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                aria-label={`Decrease quantity of ${item.title}`}
                                className="px-3 py-1 text-charcoal-600 transition-colors hover:bg-charcoal-100"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-1 border-x border-charcoal-300 font-medium text-ink">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                aria-label={`Increase quantity of ${item.title}`}
                                className="px-3 py-1 text-charcoal-600 transition-colors hover:bg-charcoal-100"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-status-danger text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
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
              <div className="card mt-6 p-6">
                <h3 className="font-display text-lg font-semibold text-ink mb-4">Promo Code</h3>
                <div className="flex gap-3">
                  <input type="text" placeholder="Enter promo code" className="input-field flex-1" />
                  <button className="btn-secondary whitespace-nowrap">
                    Apply
                  </button>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-24">
                <h2 className="font-display text-xl font-semibold text-ink mb-6">Order Summary</h2>

                {/* Items Summary */}
                {Object.entries(groupedItems).length > 0 && (
                  <div className="mb-6 p-4 bg-charcoal-50 rounded-xl">
                    <h3 className="font-semibold text-ink mb-2">Booking Summary</h3>
                    <div className="space-y-2 text-sm">
                      {Object.entries(groupedItems).map(([type, data]) => (
                        <div key={type} className="flex justify-between">
                          <span className="text-charcoal-600">{data.label}</span>
                          <span className="text-ink">{data.count} {data.count === 1 ? 'item' : 'items'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pricing Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-charcoal-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal) ?? 'Free'}</span>
                  </div>
                  <div className="flex justify-between text-charcoal-600">
                    <span>Service Fee</span>
                    <span>{formatPrice(SERVICE_FEE) ?? 'Free'}</span>
                  </div>
                  <div className="border-t border-charcoal-200 pt-3 flex justify-between text-lg font-semibold text-ink">
                    <span>Total</span>
                    <span>{formatPrice(total) ?? 'Free'}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => router.push('/checkout')}
                    className="btn-primary w-full text-lg"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <Link href="/bars" className="btn-secondary w-full">
                    Continue Shopping
                  </Link>
                </div>

                {/* Payment Methods */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-charcoal-600 mb-2">Secure payment with</p>
                  <div className="flex justify-center items-center gap-3">
                    {/* Was a U+FFFD replacement char — the credit-card emoji had been mangled. */}
                    <span className="text-2xl" title="Credit Card">💳</span>
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