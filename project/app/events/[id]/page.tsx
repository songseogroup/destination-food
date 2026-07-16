'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Clock, Calendar, Share2, Heart, Users, X } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import LoadingSpinner from '../../../components/LoadingSpinner'
import StripePayment from '../../../components/StripePayment'
import ReviewsSection from '../../../components/ReviewsSection'
import { EmptyState } from '../../../components/ui/Section'
import { formatPrice, formatEventDate, formatEventTime } from '../../../lib/format'
import { apiService, api } from '../../../lib/api'
import { trackView } from '../../../lib/analytics'
import { Event } from '../../../lib/types'


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
        // Record the view once the real id is known — fire-and-forget.
        if (response.data?.id) trackView('event', response.data.id)
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="bg-cream py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-display text-2xl font-bold text-ink mb-4">Event Not Found</h1>
            <button
              onClick={() => router.push('/events')}
              className="font-semibold text-whisky-700 transition-colors hover:text-whisky-600"
            >
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

  // `price` is a bare varchar like "89" — never render it raw.
  const displayPrice = formatPrice(event.price) ?? 'Free'
  const eventDate = formatEventDate(eventDetails.date)
  const eventTime = formatEventTime(eventDetails.time)

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
    <div className="min-h-screen bg-cream text-ink">
      <Header />

      <main>
        {/* Hero image */}
        <section className="relative h-80 overflow-hidden md:h-96">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${eventDetails.images[selectedImage]})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent"></div>
          </div>

          <div className="absolute right-4 top-4 flex items-center gap-3 sm:right-6 lg:right-8">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
              aria-pressed={isFavorite}
              className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-charcoal-600 shadow-soft backdrop-blur transition-colors hover:bg-white hover:text-whisky-600"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-whisky-500 text-whisky-500' : ''}`} />
            </button>
            <button
              aria-label="Share this event"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-charcoal-600 shadow-soft backdrop-blur transition-colors hover:bg-white hover:text-whisky-600"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Title block. Events carry no rating column, so there is no stars row here. */}
        <section className="border-b border-charcoal-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill-gold">{eventDetails.category}</span>
              <span className="pill">{eventDetails.type}</span>
            </div>

            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
              {eventDetails.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-charcoal-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {eventDetails.location}
              </span>
              {eventDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {eventDate}
                </span>
              )}
              {eventTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {eventTime}
                </span>
              )}
              <span className="font-semibold text-whisky-700">{displayPrice}</span>
            </div>
          </div>
        </section>

        {/* Image Gallery */}
        {eventDetails.images.length > 1 && (
          <section className="bg-cream py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {eventDetails.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative h-24 overflow-hidden rounded-xl transition-all ${
                      selectedImage === index
                        ? 'ring-2 ring-whisky-500 ring-offset-2 ring-offset-cream'
                        : 'hover:opacity-80'
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
        )}

        {/* Main Content */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2">
                {/* Tabs */}
                <div className="mb-8 border-b border-charcoal-200">
                  <div className="-mb-px flex gap-6 overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                          activeTab === tab.id
                            ? 'border-whisky-500 text-whisky-700'
                            : 'border-transparent text-charcoal-500 hover:text-ink'
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
                      <h2 className="font-display text-2xl font-bold text-ink mb-4">About This Event</h2>
                      <p className="leading-relaxed text-charcoal-600">{eventDetails.description}</p>
                    </div>

                    {eventDetails.highlights.length > 0 && (
                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink mb-4">
                          Event Highlights
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {eventDetails.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="h-2 w-2 shrink-0 rounded-full bg-whisky-500"></div>
                              <span className="text-charcoal-600">{highlight}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {eventDetails.includes.length > 0 && (
                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink mb-4">
                          What&apos;s Included
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {eventDetails.includes.map((item, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="h-2 w-2 shrink-0 rounded-full bg-whisky-500"></div>
                              <span className="text-charcoal-600">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {eventDetails.requirements.length > 0 && (
                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink mb-4">Requirements</h3>
                        <div className="space-y-2">
                          {eventDetails.requirements.map((requirement, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <div className="h-2 w-2 shrink-0 rounded-full bg-status-warning"></div>
                              <span className="text-charcoal-600">{requirement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'agenda' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <h2 className="font-display text-2xl font-bold text-ink mb-6">Event Agenda</h2>
                    {eventDetails.agenda.length > 0 ? (
                      <div className="space-y-4">
                        {eventDetails.agenda.map((item, index) => (
                          <div key={index} className="card flex items-center space-x-4 p-4">
                            <div className="w-20 flex-shrink-0 font-semibold text-whisky-700">
                              {item.time}
                            </div>
                            <div className="flex-1 text-charcoal-600">{item.activity}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        title="Agenda coming soon"
                        description="The organiser hasn't published a running order for this event yet."
                      />
                    )}
                  </motion.div>
                )}

                {activeTab === 'reviews' && event && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ReviewsSection entityType="event" entityId={event.id} />
                  </motion.div>
                )}

                {activeTab === 'photos' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {eventDetails.images.map((image, index) => (
                      <div key={index} className="relative h-64 overflow-hidden rounded-2xl">
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
                <div className="card sticky top-24 p-6">
                  <div className="text-center mb-6">
                    <div className="font-display text-3xl font-bold text-ink">{displayPrice}</div>
                    <div className="text-sm text-charcoal-500">per person</div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-charcoal-500">Available Spots:</span>
                      <span className="font-semibold text-ink">
                        {eventDetails.availableSpots} of {eventDetails.capacity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-charcoal-500">Date:</span>
                      <span className="font-semibold text-ink">{eventDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-charcoal-500">Time:</span>
                      <span className="font-semibold text-ink">{eventTime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-charcoal-500">Duration:</span>
                      <span className="font-semibold text-ink">{eventDetails.duration}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="label">Number of Tickets</label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                        aria-label="Decrease ticket quantity"
                        className="grid h-9 w-9 place-items-center rounded-full border border-charcoal-300 bg-white text-ink transition-colors hover:bg-charcoal-50"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-semibold text-ink">{ticketQuantity}</span>
                      <button
                        onClick={() => setTicketQuantity(Math.min(eventDetails.availableSpots, ticketQuantity + 1))}
                        aria-label="Increase ticket quantity"
                        className="grid h-9 w-9 place-items-center rounded-full border border-charcoal-300 bg-white text-ink transition-colors hover:bg-charcoal-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 space-y-2 border-t border-charcoal-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-500">Tickets:</span>
                      <span className="font-semibold text-ink">{formatPrice(totalPrice) ?? 'Free'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-charcoal-500">Booking Fee:</span>
                      <span className="font-semibold text-ink">{formatPrice(bookingFeeTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-charcoal-200 pt-2">
                      <span className="text-charcoal-500">Total:</span>
                      <span className="font-display text-2xl font-bold text-whisky-700">
                        {formatPrice(totalCharge)}
                      </span>
                    </div>
                  </div>

                  <button onClick={() => setShowBookingModal(true)} className="btn-primary mb-3 w-full">
                    Book Now
                  </button>

                  <button className="btn-secondary w-full">Add to Calendar</button>
                </div>

                {/* Event Info */}
                <div className="card p-6">
                  <h3 className="font-display text-lg font-semibold text-ink mb-4">Event Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-charcoal-400" strokeWidth={1.75} />
                      <span className="text-charcoal-600">{eventDetails.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-charcoal-600">{eventDetails.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 shrink-0 text-charcoal-400" strokeWidth={1.75} />
                      <span className="text-charcoal-600">{eventDetails.capacity} max capacity</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 shrink-0 text-charcoal-400" strokeWidth={1.75} />
                      <span className="text-charcoal-600">{eventDetails.duration}</span>
                    </div>
                  </div>
                </div>

                {/* Organizer Info */}
                <div className="card p-6">
                  <h3 className="font-display text-lg font-semibold text-ink mb-4">Organizer</h3>
                  <div className="space-y-2">
                    <p className="font-medium text-ink">{eventDetails.organizer}</p>
                    <p className="text-sm text-charcoal-500">{eventDetails.organizerEmail}</p>
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
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setShowBookingModal(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-charcoal-400 transition-colors hover:text-ink"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-display text-2xl font-bold text-ink mb-1">
              {showPayment ? 'Complete Payment' : 'Book Event'}
            </h2>
            <p className="text-charcoal-500 mb-5">{eventDetails.name}</p>

            {showPayment && createdOrderId ? (
              <div className="space-y-4">
                <div className="space-y-2 rounded-xl border border-charcoal-200 bg-charcoal-50 p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal-500">Tickets:</span>
                    <span className="font-semibold text-ink">{formatPrice(totalPrice) ?? 'Free'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal-500">Booking Fee:</span>
                    <span className="font-semibold text-ink">{formatPrice(bookingFeeTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-charcoal-200 pt-2">
                    <span className="text-charcoal-500">Total Amount:</span>
                    <span className="font-display text-2xl font-bold text-whisky-700">
                      {formatPrice(totalCharge)}
                    </span>
                  </div>
                </div>
                <StripePayment
                  orderId={createdOrderId}
                  amount={totalCharge}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
                {error && (
                  <div className="rounded-xl border border-status-danger/30 bg-status-dangerSoft px-4 py-3 text-sm text-status-danger">
                    {error}
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowPayment(false)
                    setCreatedOrderId(null)
                    setError('')
                  }}
                  className="btn-secondary w-full"
                >
                  Back to Booking Details
                </button>
              </div>
            ) : (
              <form onSubmit={handleBooking} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-status-danger/30 bg-status-dangerSoft px-4 py-3 text-sm text-status-danger">
                    {error}
                  </div>
                )}

                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={bookingForm.customerName}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerName: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Email *</label>
                  <input
                    type="email"
                    required
                    value={bookingForm.customerEmail}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerEmail: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    value={bookingForm.customerPhone}
                    onChange={(e) => setBookingForm({ ...bookingForm, customerPhone: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Number of Tickets</label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setTicketQuantity(Math.max(1, ticketQuantity - 1))}
                      aria-label="Decrease ticket quantity"
                      className="grid h-10 w-10 place-items-center rounded-full border border-charcoal-300 bg-white text-ink transition-colors hover:bg-charcoal-50"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-semibold text-ink">{ticketQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setTicketQuantity(Math.min(eventDetails.availableSpots, ticketQuantity + 1))}
                      aria-label="Increase ticket quantity"
                      className="grid h-10 w-10 place-items-center rounded-full border border-charcoal-300 bg-white text-ink transition-colors hover:bg-charcoal-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Special Requests</label>
                  <textarea
                    value={bookingForm.specialRequests}
                    onChange={(e) => setBookingForm({ ...bookingForm, specialRequests: e.target.value })}
                    rows={3}
                    className="input-field"
                  />
                </div>

                <div className="space-y-2 border-t border-charcoal-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal-500">Tickets:</span>
                    <span className="font-semibold text-ink">{formatPrice(totalPrice) ?? 'Free'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-charcoal-500">Booking Fee:</span>
                    <span className="font-semibold text-ink">{formatPrice(bookingFeeTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-charcoal-200 pt-2">
                    <span className="text-charcoal-500">Total:</span>
                    <span className="font-display text-2xl font-bold text-whisky-700">
                      {formatPrice(totalCharge)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
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
