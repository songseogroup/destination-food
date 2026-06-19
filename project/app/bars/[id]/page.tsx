'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, MapPin, Clock, Phone, Share2, Heart, X, CreditCard } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import LoadingSpinner from '../../../components/LoadingSpinner'
import ReviewsSection from '../../../components/ReviewsSection'
import StripePayment from '../../../components/StripePayment'
import { apiService } from '../../../lib/api'
import { Bar } from '../../../lib/types'


export default function BarDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [bar, setBar] = useState<Bar | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const [isFavorite, setIsFavorite] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookingDate: '',
    bookingTime: '',
    numberOfGuests: 2,
    specialRequests: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    const fetchBar = async () => {
      try {
        setLoading(true)
        const response = await apiService.getBar(Number(id))
        setBar(response.data)
      } catch (error) {
        console.error('Error fetching bar:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchBar()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!bar) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="bg-black py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Bar Not Found</h1>
            <button onClick={() => router.push('/bars')} className="text-primary-500 hover:text-primary-600">
              ← Back to Bars
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Use bar data from API directly
  // Combine cover photo + gallery images so both are visible
  const barDetails = {
    ...bar,
    images: [bar.image, ...(bar.mediaGallery || [])],
    address: bar.address || 'Address not available',
    phone: bar.phone || 'Phone not available',
    website: bar.website || '',
    hours: bar.operatingHours || {},
    description: bar.description || 'No description available.',
    amenities: [],
    menu: {
      cocktails: [],
      spirits: []
    }
  }
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'menu', label: 'Menu' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'photos', label: 'Photos' }
  ]

  // If the bar set a per-guest deposit, charge it upfront. Otherwise the
  // reservation is free to make and the customer pays at the venue.
  const depositPerGuest = Number((bar as any)?.bookingDepositPerGuest || 0)
  const requiresDeposit = depositPerGuest > 0
  const depositTotal = requiresDeposit
    ? Number((depositPerGuest * (bookingForm.numberOfGuests || 1)).toFixed(2))
    : 0

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const orderData = {
        orderType: 'bar_reservation',
        barId: parseInt(id),
        customerName: bookingForm.customerName,
        customerEmail: bookingForm.customerEmail,
        customerPhone: bookingForm.customerPhone,
        numberOfGuests: bookingForm.numberOfGuests,
        totalAmount: depositTotal,
        bookingDate: bookingForm.bookingDate,
        bookingTime: bookingForm.bookingTime,
        specialRequests: bookingForm.specialRequests,
        paymentMethod: requiresDeposit ? 'online' : 'on-site',
        isPaid: false,
      }

      const response = await apiService.createOrder(orderData)
      const newOrderId = response.data.id
      setCreatedOrderId(newOrderId)
      if (requiresDeposit) {
        setShowPayment(true)
        setIsSubmitting(false)
      } else {
        router.push(`/orders/${newOrderId}`)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create reservation. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = () => {
    if (createdOrderId) {
      router.push(`/orders/${createdOrderId}`)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-96 overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${barDetails.images[selectedImage]})` }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{barDetails.name}</h1>
                  <p className="text-xl text-gray-300">{barDetails.type} • {barDetails.location}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`p-3 rounded-full transition-colors ${
                      isFavorite ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  <button className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors">
                    <Share2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Image Gallery */}
        <section className="py-8 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {barDetails.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative h-24 rounded-lg overflow-hidden transition-all ${
                    selectedImage === index ? 'ring-2 ring-primary-500' : 'hover:opacity-80'
                  }`}
                >
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${image})` }}
                  />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2">
                {/* Tabs */}
                <div className="mb-8">
                  <div className="flex space-x-1 bg-gray-900 p-1 rounded-lg">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          activeTab === tab.id
                            ? 'bg-primary-500 text-black'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold mb-4">About {barDetails.name}</h2>
                      <p className="text-gray-300 leading-relaxed">{barDetails.description}</p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {barDetails.specialties.map((specialty) => (
                          <span
                            key={specialty}
                            className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">Amenities</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {barDetails.amenities.map((amenity) => (
                          <div key={amenity} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            <span className="text-gray-300">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'menu' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold mb-6">Cocktails</h2>
                      <div className="space-y-4">
                        {barDetails.menu.cocktails.map((item, index) => (
                          <div key={index} className="bg-gray-900 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              <span className="text-primary-500 font-bold">{item.price}</span>
                            </div>
                            <p className="text-gray-400">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold mb-6">Premium Spirits</h2>
                      <div className="space-y-4">
                        {barDetails.menu.spirits.map((item, index) => (
                          <div key={index} className="bg-gray-900 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold text-lg">{item.name}</h3>
                              <span className="text-primary-500 font-bold">{item.price}</span>
                            </div>
                            <p className="text-gray-400">{item.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'reviews' && bar && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ReviewsSection entityType="bar" entityId={bar.id} />
                  </motion.div>
                )}

                {activeTab === 'photos' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {barDetails.images.map((image, index) => (
                      <div key={index} className="relative h-64 rounded-lg overflow-hidden">
                        <div 
                          className="w-full h-full bg-cover bg-center hover:scale-105 transition-transform duration-300"
                          style={{ backgroundImage: `url(${image})` }}
                        />
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Quick Info */}
                <div className="bg-gray-900 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      barDetails.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {barDetails.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                    <span className="text-primary-500 font-bold">{barDetails.priceRange}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{barDetails.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{barDetails.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">Open until 2:00 AM</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowBookingModal(true)}
                    className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    Make Reservation
                  </button>
                </div>

                {/* Hours */}
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Hours</h3>
                  <div className="space-y-2">
                    {Object.entries(barDetails.hours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{day}</span>
                        <span className="text-gray-300">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black font-semibold py-2 px-4 rounded-lg transition-colors">
                      Share Location
                    </button>
                    <button className="w-full bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black font-semibold py-2 px-4 rounded-lg transition-colors">
                      Add to Favorites
                    </button>
                    <button className="w-full bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black font-semibold py-2 px-4 rounded-lg transition-colors">
                      Write Review
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-4">
              {showPayment ? 'Confirm payment' : 'Make Reservation'}
            </h2>
            <p className="text-gray-400 mb-4">{barDetails.name}</p>

            {showPayment && createdOrderId ? (
              <div className="space-y-4">
                <div className="bg-primary-500/10 border border-primary-500/40 rounded-lg p-4">
                  <p className="text-sm text-primary-200 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Deposit: <strong className="text-white">${depositTotal.toFixed(2)}</strong> for {bookingForm.numberOfGuests}{' '}
                    {bookingForm.numberOfGuests === 1 ? 'guest' : 'guests'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    This holds your table. It&apos;s refundable up to {(bar as any)?.refundWindowHours || 48} hours before your booking.
                  </p>
                </div>
                <StripePayment
                  orderId={createdOrderId}
                  amount={depositTotal}
                  onSuccess={handlePaymentSuccess}
                  onError={(msg) => setError(msg)}
                />
                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}
                <p className="text-xs text-gray-500 text-center">
                  Your reservation is held. Payment is processed securely by Stripe.
                </p>
              </div>
            ) : (
            <form onSubmit={handleBooking} className="space-y-4">
              {requiresDeposit && (
                <div className="bg-yellow-500/10 border border-yellow-500/40 rounded-lg p-3 flex items-start gap-2">
                  <CreditCard className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-200 leading-relaxed">
                    This venue requires a <strong>${depositPerGuest.toFixed(2)} per guest deposit</strong> to hold your table. You&apos;ll pay <strong>${depositTotal.toFixed(2)}</strong> after submitting the form.
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={bookingForm.customerName}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={bookingForm.customerEmail}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={bookingForm.customerPhone}
                  onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={bookingForm.bookingDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time *</label>
                <input
                  type="time"
                  required
                  value={bookingForm.bookingTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, bookingTime: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Number of Guests *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={bookingForm.numberOfGuests}
                  onChange={(e) => setBookingForm({ ...bookingForm, numberOfGuests: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Special Requests</label>
                <textarea
                  value={bookingForm.specialRequests}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-primary-500 hover:bg-primary-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing…' : requiresDeposit ? 'Continue to payment' : 'Confirm Reservation'}
                </button>
              </div>
            </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
