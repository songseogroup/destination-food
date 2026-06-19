'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, MapPin, Clock, Phone, Share2, Heart, Calendar, Award, Users, Factory, X } from 'lucide-react'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import LoadingSpinner from '../../../components/LoadingSpinner'
import StripePayment from '../../../components/StripePayment'
import ReviewsSection from '../../../components/ReviewsSection'
import { apiService } from '../../../lib/api'
import { Distillery } from '../../../lib/types'


export default function DistilleryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const [distillery, setDistillery] = useState<Distillery | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')
  const [isFavorite, setIsFavorite] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [selectedTour, setSelectedTour] = useState<any>(null)
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!distillery) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="bg-black py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Distillery Not Found</h1>
            <button onClick={() => router.push('/distilleries')} className="text-primary-500 hover:text-primary-600">
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
        bookingDate: bookingForm.bookingDate,
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
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative h-96 overflow-hidden">
          <div 
            className="w-full h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${distilleryDetails.images[selectedImage]})` }}
          >
            <div className="absolute inset-0 bg-black/50"></div>
          </div>
          
          <div className="absolute inset-0 flex items-end">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2">{distilleryDetails.name}</h1>
                  <p className="text-xl text-gray-300">{distilleryDetails.type} • Est. {distilleryDetails.established}</p>
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
              {distilleryDetails.images.map((image, index) => (
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
                      <h2 className="text-2xl font-bold mb-4">About {distilleryDetails.name}</h2>
                      <p className="text-gray-300 leading-relaxed mb-6">{distilleryDetails.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 p-4 rounded-lg">
                          <h3 className="font-semibold text-lg mb-2">Founded</h3>
                          <p className="text-gray-300">{distilleryDetails.founded}</p>
                        </div>
                        <div className="bg-gray-900 p-4 rounded-lg">
                          <h3 className="font-semibold text-lg mb-2">Founder</h3>
                          <p className="text-gray-300">{distilleryDetails.founder}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold mb-4">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {distilleryDetails.specialties.map((specialty) => (
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
                      <h3 className="text-xl font-semibold mb-4">Awards & Recognition</h3>
                      <div className="space-y-3">
                        {distilleryDetails.awards.map((award, index) => (
                          <div key={index} className="flex items-center space-x-3 bg-gray-900 p-3 rounded-lg">
                            <Award className="w-5 h-5 text-primary-500" />
                            <span className="text-gray-300">{award}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'products' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-bold mb-6">Our Whiskeys</h2>
                      <div className="space-y-4">
                        {distilleryDetails.products.whiskeys.map((whiskey, index) => (
                          <div key={index} className="bg-gray-900 p-6 rounded-lg">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h3 className="font-semibold text-xl">{whiskey.name}</h3>
                                <p className="text-primary-400 text-sm">{whiskey.age}</p>
                              </div>
                              <span className="text-primary-500 font-bold text-xl">{whiskey.price}</span>
                            </div>
                            <p className="text-gray-300">{whiskey.description}</p>
                            <button className="mt-4 bg-primary-500 hover:bg-primary-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors">
                              Add to Cart
                            </button>
                          </div>
                        ))}
                      </div>
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
                      <h2 className="text-2xl font-bold mb-6">Distillery Tours</h2>
                      {distilleryDetails.products.tours && distilleryDetails.products.tours.length > 0 ? (
                        <div className="space-y-6">
                          {distilleryDetails.products.tours.map((tour, index) => (
                            <div key={index} className="bg-gray-900 p-6 rounded-lg">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-xl">{tour.name}</h3>
                                  <p className="text-gray-400">{tour.duration}</p>
                                </div>
                                <span className="text-primary-500 font-bold text-xl">{tour.price}</span>
                              </div>
                              <p className="text-gray-300 mb-4">{tour.description}</p>
                              <button 
                                onClick={() => handleTourBooking(tour)}
                                className="bg-primary-500 hover:bg-primary-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
                              >
                                Book Tour
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-900 p-6 rounded-lg text-center">
                          <p className="text-gray-400 mb-4">No tours available at this time.</p>
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
                            className="bg-primary-500 hover:bg-primary-600 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
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
                {/* Quick Info */}
                <div className="bg-gray-900 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      distilleryDetails.isOpen ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {distilleryDetails.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                    <span className="text-primary-500 font-bold">{distilleryDetails.priceRange}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{distilleryDetails.address}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">{distilleryDetails.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Factory className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-300">Est. {distilleryDetails.established}</span>
                    </div>
                  </div>

                  {distilleryDetails.products.tours && distilleryDetails.products.tours.length > 0 ? (
                    <button 
                      onClick={() => {
                        setSelectedTour(distilleryDetails.products.tours[0])
                        setShowBookingModal(true)
                      }}
                      className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors"
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
                      className="w-full mt-6 bg-primary-500 hover:bg-primary-600 text-black font-semibold py-3 px-4 rounded-lg transition-colors"
                    >
                      Book Tour
                    </button>
                  )}
                </div>

                {/* Hours */}
                <div className="bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Hours</h3>
                  <div className="space-y-2">
                    {Object.entries(distilleryDetails.hours).map(([day, hours]) => (
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
      {showBookingModal && selectedTour && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-lg max-w-md w-full p-6 relative max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => {
                setShowBookingModal(false)
                setSelectedTour(null)
                setShowPayment(false)
                setCreatedOrderId(null)
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-4">
              {showPayment ? 'Complete Payment' : 'Book Tour'}
            </h2>
            <p className="text-gray-400 mb-2">{selectedTour.name}</p>
            <p className="text-primary-500 font-semibold mb-6">{selectedTour.price} per person</p>

            {showPayment && createdOrderId ? (
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded">
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
                      <div className="bg-gray-800 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Tickets:</span>
                          <span className="text-white font-semibold">${ticketTotal}</span>
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
                    </>
                  )
                })()}
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

                {(() => {
                  const priceValue = parseInt(selectedTour.price.replace('$', '')) || 0
                  const ticketTotal = priceValue * bookingForm.numberOfGuests
                  const bookingFeePerTicket = priceValue < 50 ? 2 : priceValue <= 150 ? 3 : 4
                  const bookingFeeTotal = bookingFeePerTicket * bookingForm.numberOfGuests
                  const totalCharge = ticketTotal + bookingFeeTotal

                  return (
                    <div className="border-t border-gray-700 pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tickets:</span>
                        <span className="text-white font-semibold">${ticketTotal}</span>
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
                  )
                })()}

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBookingModal(false)
                      setSelectedTour(null)
                    }}
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
