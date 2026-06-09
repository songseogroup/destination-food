'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, MapPin, Clock, Calendar, Share2, Heart, Users, Ticket, Camera, Music, X } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import LoadingSpinner from '../../../components/LoadingSpinner'
import StripePayment from '../../../components/StripePayment'
import { apiService, api } from '../../../lib/api'
import { Event } from '../../../lib/types'

const reviews: any[] = []


export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const [isFavorite, setIsFavorite] = useState(false)
  const [ticketQuantity, setTicketQuantity] = useState(1)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    specialRequests: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true)
        const response = await apiService.getEvent(Number(id))
        setEvent(response.data)
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchEvent()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="bg-black py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Event Not Found</h1>
            <button onClick={() => router.push('/events')} className="text-primary-500 hover:text-primary-600">
              ← Back to Events
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Use event data from API directly
  // Combine cover photo + gallery images so both are visible
  const eventDetails = {
    ...event,
    images: [event.image, ...(event.mediaGallery || [])],
    address: event.location || 'Location not available',
    phone: event.contactPhone || 'Phone not available',
    organizer: event.organizer || 'Unknown Organizer',
    organizerEmail: event.contactEmail || '',
    highlights: [],
    agenda: [],
    requirements: event.requirements || [],
    includes: [],
    availableSpots: parseInt(event.capacity) || 0,
    duration: 'Duration not specified',
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'photos', label: 'Photos' }
  ]

  const priceValue = parseInt(event.price.replace('$', '').replace(',', '')) || 0
  const getBookingFee = (ticketPrice: number) => {
    if (ticketPrice < 50) return 2
    if (ticketPrice <= 150) return 3
    return 4
  }
  const totalPrice = ticketQuantity * priceValue
  const bookingFeePerTicket = getBookingFee(priceValue)
  const bookingFeeTotal = bookingFeePerTicket * ticketQuantity
  const totalCharge = totalPrice + bookingFeeTotal

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const orderData = {
        orderType: 'event_booking',
        eventId: parseInt(id),
        customerName: bookingForm.customerName,
        customerEmail: bookingForm.customerEmail,
        customerPhone: bookingForm.customerPhone,
        numberOfGuests: ticketQuantity,
        totalAmount: totalPrice,
        bookingDate: event.date,
        bookingTime: event.time,
        specialRequests: bookingForm.specialRequests,
        paymentMethod: 'online',
        isPaid: false,
      }

      const response = await apiService.createOrder(orderData)
      setCreatedOrderId(response.data.id)
      setShowPayment(true)
      setIsSubmitting(false)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handlePaymentSuccess = () => {
    if (createdOrderId) {
      router.push(`/orders/${createdOrderId}`)
    }
  }

  const handlePaymentError = (error: string) => {
    setError(error)
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-96 overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${eventDetails.images[selectedImage]})` }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-3 py-1 bg-primary-500 text-black text-sm rounded-full font-semibold">
                      {eventDetails.category}
                    </span>
                    <span className="px-3 py-1 bg-white/20 text-white text-sm rounded-full">
                      {eventDetails.type}
                    </span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{eventDetails.name}</h1>
                  <p className="text-xl text-gray-300">{eventDetails.location}</p>
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
              {eventDetails.images.map((image, index) => (
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
                      <h2 className="text-2xl font-bold mb-4">About This Event</h2>
                      <p className="text-gray-300 leading-relaxed mb-6">{eventDetails.description}</p>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">Event Highlights</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {eventDetails.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            <span className="text-gray-300">{highlight}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">What's Included</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {eventDetails.includes.map((item, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                            <span className="text-gray-300">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">Requirements</h3>
                      <div className="space-y-2">
                        {eventDetails.requirements.map((requirement, index) => (
                          <div key={index} className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-gray-300">{requirement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'agenda' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="text-2xl font-bold mb-6">Event Agenda</h2>
                    <div className="space-y-4">
                      {eventDetails.agenda.map((item, index) => (
                        <div key={index} className="flex items-center space-x-4 bg-gray-900 p-4 rounded-lg">
                          <div className="flex-shrink-0 w-20 text-primary-500 font-semibold">
                            {item.time}
                          </div>
                          <div className="flex-1 text-gray-300">
                            {item.activity}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'reviews' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Reviews</h2>
                    </div>

                    <div className="space-y-6">
                      {reviews.map((review) => (
                        <div key={review.id} className="bg-gray-900 p-6 rounded-lg">
                          <div className="flex items-start space-x-4">
                            <img
                              src={review.avatar}
                              alt={review.name}
                              className="w-12 h-12 rounded-full"
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">{review.name}</h3>
                                <div className="flex items-center space-x-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-gray-300 mb-2">{review.comment}</p>
                              <p className="text-gray-500 text-sm">{review.date}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'photos' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {eventDetails.images.map((image, index) => (
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

              {/* Right Column - Booking Sidebar */}
              <div className="space-y-6">
                {/* Booking Card */}
                <div className="bg-gray-900 p-6 rounded-lg sticky top-24">
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-primary-500 mb-2">{eventDetails.price}</div>
                    <div className="text-gray-400">per person</div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Available Spots:</span>
                      <span className="text-white font-semibold">{eventDetails.availableSpots} of {eventDetails.capacity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Date:</span>
                      <span className="text-white font-semibold">
                        {new Date(eventDetails.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white font-semibold">{eventDetails.time}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Duration:</span>
                      <span className="text-white font-semibold">{eventDetails.duration}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-gray-400 text-sm mb-2">Number of Tickets</label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                        className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700"
                      >
                        -
                      </button>
                      <span className="text-white font-semibold w-8 text-center">{ticketQuantity}</span>
                      <button
                        onClick={() => setTicketQuantity(Math.min(eventDetails.availableSpots, ticketQuantity + 1))}
                        className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-gray-700"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 mb-6 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Tickets:</span>
                      <span className="text-white font-semibold">${totalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Booking Fee:</span>
                      <span className="text-white font-semibold">${bookingFeeTotal}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                      <span className="text-gray-400">Total:</span>
                      <span className="text-2xl font-bold text-primary-500">${totalCharge}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowBookingModal(true)}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors mb-4"
                  >
                    Book Now
                  </button>

                  <button className="w-full bg-transparent border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-black font-semibold py-2 px-4 rounded-lg transition-colors">
                    Add to Calendar
                  </button>
                </div>

                {/* Event Info */}
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Event Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{eventDetails.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* <Phone className="w-5 h-5 text-gray-400" /> */}
                      <span className="text-gray-300">{eventDetails.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{eventDetails.capacity} max capacity</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{eventDetails.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Organizer</h3>
                  <div className="space-y-2">
                    <p className="text-white font-medium">{eventDetails.organizer}</p>
                    <p className="text-gray-400 text-sm">{eventDetails.organizerEmail}</p>
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
            className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative"
          >
            <button
              onClick={() => setShowBookingModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-4">
              {showPayment ? 'Complete Payment' : 'Book Event'}
            </h2>
            <p className="text-gray-400 mb-6">{eventDetails.name}</p>

            {showPayment && createdOrderId ? (
              <div className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tickets:</span>
                    <span className="text-white font-semibold">${totalPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Booking Fee:</span>
                    <span className="text-white font-semibold">${bookingFeeTotal}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                    <span className="text-gray-400">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-500">${totalCharge}</span>
                  </div>
                </div>
                <StripePayment
                  orderId={createdOrderId}
                  amount={totalCharge}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowPayment(false)
                    setCreatedOrderId(null)
                    setError('')
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Back to Booking Details
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
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
                  <label className="block text-sm font-medium mb-2">Number of Tickets</label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                      className="w-10 h-10 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                    >
                      -
                    </button>
                    <span className="text-white font-semibold w-12 text-center">{ticketQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setTicketQuantity(Math.min(eventDetails.availableSpots, ticketQuantity + 1))}
                      className="w-10 h-10 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                    >
                      +
                    </button>
                  </div>
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

                <div className="border-t border-gray-700 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Tickets:</span>
                    <span className="text-white font-semibold">${totalPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Booking Fee:</span>
                    <span className="text-white font-semibold">${bookingFeeTotal}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-2xl font-bold text-primary-500">${totalCharge}</span>
                  </div>
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
                  {isSubmitting ? 'Processing...' : 'Confirm Booking'}
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
