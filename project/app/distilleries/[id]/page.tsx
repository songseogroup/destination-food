'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Phone, Share2, Heart, Award, Factory, X } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import LoadingSpinner from '../../../components/LoadingSpinner'
import StripePayment from '../../../components/StripePayment'
import ReviewsSection from '../../../components/ReviewsSection'
import StarRating from '../../../components/ui/StarRating'
import BadgeChips from '../../../components/BadgeChips'
import { useEntityBadges } from '../../../lib/useBadges'
import ClaimListing from '../../../components/ClaimListing'
import SessionPicker, { BookableSession } from '../../../components/SessionPicker'
import { EmptyState } from '../../../components/ui/Section'
import { formatPrice } from '../../../lib/format'
import { apiService } from '../../../lib/api'
import { trackView } from '../../../lib/analytics'
import { Distillery } from '../../../lib/types'


export default function DistilleryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const badges = useEntityBadges('distillery', id ? Number(id) : undefined)
  const [distillery, setDistillery] = useState<Distillery | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const [isFavorite, setIsFavorite] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedTour, setSelectedTour] = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<BookableSession | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null)
  const [bookingForm, setBookingForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bookingDate: '',
    numberOfGuests: 2,
    specialRequests: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDistillery = async () => {
      try {
        setLoading(true)
        const response = await apiService.getDistillery(Number(id))
        setDistillery(response.data)
        // Record the view once the real id is known — fire-and-forget.
        if (response.data?.id) trackView('distillery', response.data.id)
      } catch (error) {
        console.error('Error fetching distillery:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchDistillery()
    }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!distillery) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="bg-cream py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-display text-2xl font-bold text-ink mb-4">Distillery Not Found</h1>
            <button
              onClick={() => router.push('/distilleries')}
              className="font-semibold text-whisky-700 transition-colors hover:text-whisky-600"
            >
              ← Back to Distilleries
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Use distillery data from API directly
  // Combine cover photo + gallery images so both are visible
  const distilleryDetails = {
    ...distillery,
    images: [distillery.image, ...(distillery.mediaGallery || [])],
    address: distillery.address || 'Address not available',
    phone: distillery.phone || 'Phone not available',
    website: distillery.website || '',
    hours: distillery.operatingHours || {},
    description: distillery.description || 'No description available.',
    founded: distillery.established || 'Unknown',
    founder: 'Unknown',
    awards: [],
    products: {
      whiskeys: [],
      tours: []
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: 'Products' },
    { id: 'tours', label: 'Tours' },
    { id: 'reviews', label: 'Reviews' }
  ]

  const handleTourBooking = (tour: typeof distilleryDetails.products.tours[0]) => {
    setSelectedTour(tour)
    setShowBookingModal(true)
  }

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTour) return

    setError('')
    setIsSubmitting(true)

    try {
      const price = parseInt(selectedTour.price.replace('$', ''))
      const orderData = {
        orderType: 'distillery_tour',
        distilleryId: parseInt(id),
        customerName: bookingForm.customerName,
        customerEmail: bookingForm.customerEmail,
        customerPhone: bookingForm.customerPhone,
        numberOfGuests: bookingForm.numberOfGuests,
        totalAmount: price * bookingForm.numberOfGuests,
        // A chosen session supplies the time; otherwise the free-text date stands.
        sessionId: selectedSession?.id,
        bookingDate: selectedSession ? selectedSession.startsAt : bookingForm.bookingDate,
        specialRequests: bookingForm.specialRequests || `Tour: ${selectedTour.name}`,
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

  const handlePaymentError = (message: string) => {
    setError(message)
  }

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />

      <main>
        {/* Hero image */}
        <section className="relative h-80 overflow-hidden md:h-96">
          <div
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${distilleryDetails.images[selectedImage]})` }}
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
              aria-label="Share this distillery"
              className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-charcoal-600 shadow-soft backdrop-blur transition-colors hover:bg-white hover:text-whisky-600"
            >
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </section>

        {/* Title block */}
        <section className="border-b border-charcoal-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="pill-gold">{distilleryDetails.type}</span>
              <span className={distilleryDetails.isOpen ? 'pill-open' : 'pill-closed'}>
                {distilleryDetails.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
              {distilleryDetails.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
              <StarRating
                rating={distillery.rating}
                reviews={distillery.reviews}
                size="md"
                variant="stars"
              />
              <span className="flex items-center gap-1.5 text-charcoal-600">
                <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                {distilleryDetails.location}
              </span>
              <span className="flex items-center gap-1.5 text-charcoal-600">
                <Factory className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                Est. {distilleryDetails.established}
              </span>
            </div>

            {badges.length > 0 && <BadgeChips badges={badges} size="md" className="mt-4" />}
          </div>
        </section>

        {/* Image Gallery */}
        {distilleryDetails.images.length > 1 && (
          <section className="bg-cream py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {distilleryDetails.images.map((image, index) => (
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
                      <h2 className="font-display text-2xl font-bold text-ink mb-4">
                        About {distilleryDetails.name}
                      </h2>
                      <p className="mb-6 leading-relaxed text-charcoal-600">
                        {distilleryDetails.description}
                      </p>

                      {!distillery.userId && (
                        <ClaimListing
                          entityType="distillery"
                          entityId={distillery.id}
                          listingName={distillery.name}
                        />
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="card p-4">
                          <h3 className="font-display text-lg font-semibold text-ink mb-2">Founded</h3>
                          <p className="text-charcoal-600">{distilleryDetails.founded}</p>
                        </div>
                        <div className="card p-4">
                          <h3 className="font-display text-lg font-semibold text-ink mb-2">Founder</h3>
                          <p className="text-charcoal-600">{distilleryDetails.founder}</p>
                        </div>
                      </div>
                    </div>

                    {distilleryDetails.specialties.length > 0 && (
                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink mb-4">Specialties</h3>
                        <div className="flex flex-wrap gap-2">
                          {distilleryDetails.specialties.map((specialty) => (
                            <span key={specialty} className="pill-gold">
                              {specialty}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {distilleryDetails.awards.length > 0 && (
                      <div>
                        <h3 className="font-display text-xl font-semibold text-ink mb-4">
                          Awards &amp; Recognition
                        </h3>
                        <div className="space-y-3">
                          {distilleryDetails.awards.map((award, index) => (
                            <div key={index} className="card flex items-center space-x-3 p-3">
                              <Award className="h-5 w-5 shrink-0 text-whisky-500" />
                              <span className="text-charcoal-600">{award}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'products' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="font-display text-2xl font-bold text-ink mb-6">Our Whiskeys</h2>
                      {distilleryDetails.products.whiskeys.length > 0 ? (
                        <div className="space-y-4">
                          {distilleryDetails.products.whiskeys.map((whiskey, index) => (
                            <div key={index} className="card p-6">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-display text-xl font-semibold text-ink">
                                    {whiskey.name}
                                  </h3>
                                  <p className="text-sm text-whisky-700">{whiskey.age}</p>
                                </div>
                                <span className="text-xl font-bold text-whisky-700">
                                  {formatPrice(whiskey.price)}
                                </span>
                              </div>
                              <p className="text-charcoal-600">{whiskey.description}</p>
                              <button className="btn-primary mt-4">Add to Cart</button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <EmptyState
                          title="Bottles coming soon"
                          description="This distillery hasn't listed its range yet. Check back shortly."
                        />
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'tours' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="font-display text-2xl font-bold text-ink mb-6">Distillery Tours</h2>
                      {distilleryDetails.products.tours && distilleryDetails.products.tours.length > 0 ? (
                        <div className="space-y-6">
                          {distilleryDetails.products.tours.map((tour, index) => (
                            <div key={index} className="card p-6">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-display text-xl font-semibold text-ink">
                                    {tour.name}
                                  </h3>
                                  <p className="text-charcoal-500">{tour.duration}</p>
                                </div>
                                <span className="text-xl font-bold text-whisky-700">
                                  {formatPrice(tour.price)}
                                </span>
                              </div>
                              <p className="mb-4 text-charcoal-600">{tour.description}</p>
                              <button onClick={() => handleTourBooking(tour)} className="btn-primary">
                                Book Tour
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="card p-8 text-center">
                          <p className="mb-4 text-charcoal-500">No tours available at this time.</p>
                          <button
                            onClick={() => {
                              const defaultTour = {
                                name: 'Standard Tour',
                                price: '$25',
                                duration: '1 hour',
                                description: 'Guided tour of the distillery'
                              }
                              handleTourBooking(defaultTour)
                            }}
                            className="btn-primary"
                          >
                            Book Standard Tour
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'reviews' && distillery && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ReviewsSection entityType="distillery" entityId={distillery.id} />
                  </motion.div>
                )}
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Booking panel */}
                <div className="card sticky top-24 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className={distilleryDetails.isOpen ? 'pill-open' : 'pill-closed'}>
                      {distilleryDetails.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                    <span className="font-bold text-whisky-700">{distilleryDetails.priceRange}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-charcoal-400" strokeWidth={1.75} />
                      <span className="text-charcoal-600">{distilleryDetails.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 shrink-0 text-charcoal-400" strokeWidth={1.75} />
                      <span className="text-charcoal-600">{distilleryDetails.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Factory className="h-5 w-5 shrink-0 text-charcoal-400" strokeWidth={1.75} />
                      <span className="text-charcoal-600">Est. {distilleryDetails.established}</span>
                    </div>
                  </div>

                  {distilleryDetails.products.tours && distilleryDetails.products.tours.length > 0 ? (
                    <button
                      onClick={() => {
                        setSelectedTour(distilleryDetails.products.tours[0])
                        setShowBookingModal(true)
                      }}
                      className="btn-primary mt-6 w-full"
                    >
                      Book Tour
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        // Create a default tour if none exists
                        const defaultTour = {
                          name: 'Standard Tour',
                          price: '$25',
                          duration: '1 hour',
                          description: 'Guided tour of the distillery'
                        }
                        setSelectedTour(defaultTour)
                        setShowBookingModal(true)
                      }}
                      className="btn-primary mt-6 w-full"
                    >
                      Book Tour
                    </button>
                  )}
                </div>

                {/* Hours */}
                {Object.keys(distilleryDetails.hours).length > 0 && (
                  <div className="card p-6">
                    <h3 className="font-display text-lg font-semibold text-ink mb-4">Hours</h3>
                    <div className="space-y-2">
                      {Object.entries(distilleryDetails.hours).map(([day, hours]) => (
                        <div key={day} className="flex justify-between">
                          <span className="capitalize text-charcoal-500">{day}</span>
                          <span className="text-charcoal-700">{hours}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="card p-6">
                  <h3 className="font-display text-lg font-semibold text-ink mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button className="btn-secondary w-full">Share Location</button>
                    <button className="btn-secondary w-full">Add to Favorites</button>
                    <button className="btn-secondary w-full">Write Review</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Booking Modal */}
      {showBookingModal && selectedTour && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setShowBookingModal(false)
                setSelectedTour(null)
                setShowPayment(false)
                setCreatedOrderId(null)
              }}
              aria-label="Close"
              className="absolute top-4 right-4 text-charcoal-400 transition-colors hover:text-ink"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="font-display text-2xl font-bold text-ink mb-1">
              {showPayment ? 'Complete Payment' : 'Book Tour'}
            </h2>
            <p className="text-charcoal-500">{selectedTour.name}</p>
            <p className="mb-6 font-semibold text-whisky-700">
              {formatPrice(selectedTour.price)} per person
            </p>

            {showPayment && createdOrderId ? (
              <div className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-status-danger/30 bg-status-dangerSoft px-4 py-3 text-sm text-status-danger">
                    {error}
                  </div>
                )}
                {(() => {
                  const priceValue = parseInt(selectedTour.price.replace('$', '')) || 0
                  const ticketTotal = priceValue * bookingForm.numberOfGuests
                  const bookingFeePerTicket = priceValue < 50 ? 2 : priceValue <= 150 ? 3 : 4
                  const bookingFeeTotal = bookingFeePerTicket * bookingForm.numberOfGuests
                  const totalCharge = ticketTotal + bookingFeeTotal

                  return (
                    <>
                      <div className="space-y-2 rounded-xl border border-charcoal-200 bg-charcoal-50 p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-charcoal-500">Tickets:</span>
                          <span className="font-semibold text-ink">
                            {formatPrice(ticketTotal) ?? 'Free'}
                          </span>
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
                    </>
                  )
                })()}
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

                <SessionPicker
                  entityType="distillery"
                  entityId={distillery.id}
                  guests={bookingForm.numberOfGuests}
                  value={selectedSession}
                  onChange={setSelectedSession}
                />

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
                  <label className="label">Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">Number of Guests *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={bookingForm.numberOfGuests}
                    onChange={(e) => setBookingForm({ ...bookingForm, numberOfGuests: parseInt(e.target.value) })}
                    className="input-field"
                  />
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

                {(() => {
                  const priceValue = parseInt(selectedTour.price.replace('$', '')) || 0
                  const ticketTotal = priceValue * bookingForm.numberOfGuests
                  const bookingFeePerTicket = priceValue < 50 ? 2 : priceValue <= 150 ? 3 : 4
                  const bookingFeeTotal = bookingFeePerTicket * bookingForm.numberOfGuests
                  const totalCharge = ticketTotal + bookingFeeTotal

                  return (
                    <div className="space-y-2 border-t border-charcoal-200 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-charcoal-500">Tickets:</span>
                        <span className="font-semibold text-ink">
                          {formatPrice(ticketTotal) ?? 'Free'}
                        </span>
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
                  )
                })()}

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false)
                      setSelectedTour(null)
                    }}
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
