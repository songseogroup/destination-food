'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, AlertCircle, ArrowLeft, Check, User, LogIn, UserPlus } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LoadingSpinner from '../../components/LoadingSpinner'
import { useCart } from '../../contexts/CartContext'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'
import { apiService } from '../../lib/api'

const SERVICE_FEE = 2.99

export default function CheckoutPage() {
  const router = useRouter()
  const { cartItems, getCartTotal, clearCart, isLoading: cartLoading } = useCart()
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    specialRequests: '',
  })
  const [error, setError] = useState('')

  // Pre-fill phone from customer data if available
  useEffect(() => {
    if (customer?.phone) {
      // Phone is already linked to customer in backend
    }
  }, [customer])

  const subtotal = getCartTotal()
  const total = subtotal + SERVICE_FEE

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Create orders for each cart item
      for (const item of cartItems) {
        await apiService.createOrder({
          orderType: `${item.type}_booking`,
          [`${item.type}Id`]: item.itemId,
          totalAmount: item.price * item.quantity,
          numberOfGuests: item.guests || item.quantity,
          bookingDate: item.date,
          bookingTime: item.time,
          specialRequests: formData.specialRequests,
        })
      }

      clearCart()
      router.push('/order-confirmation')
    } catch (error: any) {
      console.error('Error placing order:', error)
      setError(error.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while checking auth state
  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-center h-96">
            <LoadingSpinner size="lg" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Show login/signup required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
              <p className="text-gray-600">Complete your order</p>
            </div>

            {/* Empty Cart Check */}
            {cartItems.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You need to add items to your cart before checking out.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/bars" className="btn-primary">
                    Explore Bars
                  </Link>
                  <Link href="/cart" className="btn-secondary flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Cart
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-12 h-12 text-primary-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">Please sign in to continue</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  You need to be logged in to place an order. Sign in to your account or create a new one to continue with your checkout.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/login" className="btn-primary flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn-secondary flex items-center justify-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Create Account
                  </Link>
                </div>
                <div className="mt-6">
                  <Link href="/cart" className="text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Cart
                  </Link>
                </div>
              </div>
            )}
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
            <p className="text-gray-600">Complete your order</p>
          </div>

          {/* Empty Cart Check */}
          {cartItems.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingCart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                You need to add items to your cart before checking out. Browse our experiences to get started!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/bars" className="btn-primary">
                  Explore Bars
                </Link>
                <Link href="/cart" className="btn-secondary flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Cart
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Customer Info (Read-only from auth) */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Customer Information</h2>
                    <span className="text-sm text-gray-500">
                      Signed in as {customer?.email}
                    </span>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer?.firstName} {customer?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{customer?.email}</p>
                        {customer?.phone && (
                          <p className="text-sm text-gray-600">{customer.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    Your contact information will be used for this order. 
                    <Link href="/auth/login" className="text-primary-600 hover:underline ml-1">
                      Not you? Switch account
                    </Link>
                  </p>
                </div>

                {/* Special Requests */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      name="specialRequests"
                      value={formData.specialRequests}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={4}
                      placeholder="Any special requests, dietary requirements, or preferences..."
                    ></textarea>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>

                  <div className="space-y-4">
                    <label className="flex items-center p-4 border-2 border-primary-500 bg-primary-50 rounded-lg cursor-pointer">
                      <input type="radio" name="payment" className="mr-3 text-primary-500" defaultChecked />
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">💳</span>
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-gray-600">Secure payment via Stripe</div>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      Your payment will be processed securely. You will receive a confirmation email after completing your booking.
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

                  {/* Order Items */}
                  <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full capitalize">
                              {item.type}
                            </span>
                            <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                          </div>
                          {item.location && (
                            <div className="text-xs text-gray-600">{item.location}</div>
                          )}
                          {item.date && (
                            <div className="text-xs text-gray-500">{item.date}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">${(item.price * item.quantity).toFixed(2)}</div>
                          <div className="text-xs text-gray-600">Qty: {item.quantity}</div>
                        </div>
                      </div>
                    ))}
                  </div>

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

                  {/* Place Order Button */}
                  <div className="mt-6 space-y-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary text-lg py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Place Order
                        </>
                      )}
                    </button>
                    <Link
                      href="/cart"
                      className="w-full btn-secondary text-center block py-3 text-lg font-semibold"
                    >
                      Back to Cart
                    </Link>
                  </div>

                  {/* Terms */}
                  <p className="text-xs text-gray-500 text-center mt-4">
                    By placing your order, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
} 