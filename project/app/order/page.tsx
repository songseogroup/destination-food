'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Clock, MapPin, Calendar, Users, ArrowRight, Star, Wine, Building2, PartyPopper } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LoadingSpinner from '../../components/LoadingSpinner'
import { apiService } from '../../lib/api'
import { Bar, Distillery, Event } from '../../lib/types'

const bookingSteps = [
  {
    id: 1,
    title: 'Choose Experience',
    description: 'Browse bars, distilleries, and events',
    icon: '�',
    status: 'completed'
  },
  {
    id: 2,
    title: 'Select Date & Time',
    description: 'Pick when you want to visit',
    icon: '�',
    status: 'completed'
  },
  {
    id: 3,
    title: 'Review & Pay',
    description: 'Confirm your booking details',
    icon: '💳',
    status: 'active'
  },
  {
    id: 4,
    title: 'Enjoy Your Visit',
    description: 'Receive confirmation and enjoy',
    icon: '🎉',
    status: 'pending'
  }
]

const quickActions = [
  {
    title: 'Book a Bar',
    description: 'Reserve your spot at top bars',
    icon: <Wine className="w-6 h-6" />,
    color: 'bg-gradient-to-r from-amber-600 to-orange-600',
    href: '/bars'
  },
  {
    title: 'Distillery Tour',
    description: 'Book exclusive distillery experiences',
    icon: <Building2 className="w-6 h-6" />,
    color: 'bg-gradient-to-r from-emerald-600 to-teal-600',
    href: '/distilleries'
  },
  {
    title: 'Event Tickets',
    description: 'Get tickets for special events',
    icon: <PartyPopper className="w-6 h-6" />,
    color: 'bg-gradient-to-r from-purple-600 to-pink-600',
    href: '/events'
  },
  {
    title: 'Group Booking',
    description: 'Book for groups and parties',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-gradient-to-r from-blue-600 to-indigo-600',
    href: '/collections'
  }
]

export default function OrderPage() {
  const [featuredBars, setFeaturedBars] = useState<Bar[]>([])
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [barsRes, eventsRes] = await Promise.all([
          apiService.getBars({ isActive: true, limit: 3 }),
          apiService.getEvents({ isActive: true, isFeatured: true, limit: 3 })
        ])

        const bars = barsRes.data.data || barsRes.data || []
        const events = eventsRes.data.data || eventsRes.data || []

        setFeaturedBars(bars.slice(0, 3))
        setFeaturedEvents(events.slice(0, 3))
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="py-20">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-amber-600 to-orange-700 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Book Your Next Experience
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Discover and book exclusive bar experiences, distillery tours, and special events
              </p>
              
              {/* Booking Progress */}
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {bookingSteps.map((step, index) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className={`relative p-4 rounded-lg ${
                        step.status === 'completed' 
                          ? 'bg-green-500/20 border border-green-400'
                          : step.status === 'active'
                          ? 'bg-white/20 border border-white'
                          : 'bg-white/10 border border-white/30'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`text-2xl ${step.status === 'completed' ? 'text-green-300' : 'text-white'}`}>
                          {step.status === 'completed' ? '✅' : step.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{step.title}</h3>
                          <p className="text-xs text-white/80">{step.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What are you looking for?
              </h2>
              <p className="text-lg text-gray-600">
                Choose your experience type to get started
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Link href={action.href}>
                    <div className={`${action.color} text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer`}>
                      <div className="mb-4">{action.icon}</div>
                      <h3 className="text-xl font-bold mb-2">{action.title}</h3>
                      <p className="text-white/90">{action.description}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Bars */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Bars
              </h2>
              <p className="text-lg text-gray-600">
                Discover our top-rated bars and lounges
              </p>
            </motion.div>

            {featuredBars.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Wine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bars available</h3>
                <p className="text-gray-600">Check back soon for new bar listings!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredBars.map((bar, index) => (
                    <motion.div
                      key={bar.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Link href={`/bars/${bar.id}`}>
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                          <div className="relative h-48">
                            <div 
                              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                              style={{ backgroundImage: `url(${bar.image})` }}
                            />
                            <div className="absolute top-4 left-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                bar.isOpen 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-red-500 text-white'
                              }`}>
                                {bar.isOpen ? 'Open' : 'Closed'}
                              </span>
                            </div>
                            <div className="absolute top-4 right-4">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-current inline" />
                                <span className="text-gray-900 text-sm font-semibold ml-1">
                                  {bar.rating || 'New'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                              {bar.name}
                            </h3>
                            <p className="text-gray-600 mb-3">{bar.type} • {bar.location}</p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span>{bar.priceRange}</span>
                              <span>{bar.reviews || 0} reviews</span>
                            </div>

                            <button className="w-full btn-primary flex items-center justify-center gap-2">
                              View Details
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center mt-12"
                >
                  <Link href="/bars" className="btn-secondary text-lg px-8 py-3">
                    View All Bars
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </section>

        {/* Featured Events */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Upcoming Events
              </h2>
              <p className="text-lg text-gray-600">
                Don&apos;t miss out on these special experiences
              </p>
            </motion.div>

            {featuredEvents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No upcoming events</h3>
                <p className="text-gray-600">Check back soon for exciting new events!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <Link href={`/events/${event.id}`}>
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group">
                          <div className="relative h-48">
                            <div 
                              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                              style={{ backgroundImage: `url(${event.image})` }}
                            />
                            <div className="absolute top-4 left-4">
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500 text-white">
                                {event.category}
                              </span>
                            </div>
                          </div>

                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                              {event.name}
                            </h3>
                            <p className="text-gray-600 mb-3 line-clamp-2">{event.description}</p>
                            
                            <div className="space-y-2 text-sm text-gray-500 mb-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>{event.date}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                <span>{event.time}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{event.location}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary-600">{event.price}</span>
                              <button className="btn-primary text-sm px-4 py-2">
                                Get Tickets
                              </button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="text-center mt-12"
                >
                  <Link href="/events" className="btn-secondary text-lg px-8 py-3">
                    View All Events
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Book With ByFoods?
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Calendar className="w-8 h-8" />,
                  title: 'Easy Booking',
                  description: 'Book your experiences in just a few clicks'
                },
                {
                  icon: <Users className="w-8 h-8" />,
                  title: 'Group Options',
                  description: 'Perfect for groups, parties, and corporate events'
                },
                {
                  icon: <Star className="w-8 h-8" />,
                  title: 'Verified Venues',
                  description: 'All venues are vetted and verified for quality'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="bg-gray-50 rounded-xl p-8">
                    <div className="text-primary-600 mb-4 flex justify-center">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
} 