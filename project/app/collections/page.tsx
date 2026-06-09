'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { apiService } from '@/lib/api'
import { Bar, Distillery, Event } from '@/lib/types'
import LoadingSpinner from '../../components/LoadingSpinner'

// Fallback collections from featured items
const fallbackCollections = [
  {
    id: 1,
    name: 'Featured Bars',
    description: 'Discover the finest bars and lounges with premium experiences',
    image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=400&fit=crop',
    itemCount: 0,
    discount: 'New',
    featured: true
  },
  {
    id: 2,
    name: 'Premium Distilleries',
    description: 'Explore craft spirit producers and their exceptional offerings',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop',
    itemCount: 0,
    discount: null,
    featured: false
  },
  {
    id: 3,
    name: 'Exclusive Events',
    description: 'Join premium tastings, masterclasses, and social gatherings',
    image: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop',
    itemCount: 0,
    discount: null,
    featured: false
  },
]

export default function CollectionsPage() {
  const [bars, setBars] = useState<Bar[]>([])
  const [distilleries, setDistilleries] = useState<Distillery[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [barsRes, distilleriesRes, eventsRes] = await Promise.all([
          apiService.getBars({ isActive: true, limit: 8 }),
          apiService.getDistilleries({ isActive: true, limit: 8 }),
          apiService.getEvents({ isActive: true, limit: 8 }),
        ])
        setBars(barsRes.data.data || barsRes.data || [])
        setDistilleries(distilleriesRes.data.data || distilleriesRes.data || [])
        setEvents(eventsRes.data.data || eventsRes.data || [])
      } catch (err) {
        console.error('Error fetching collections:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const collections = [
    {
      id: 1,
      name: 'Featured Bars',
      description: 'Discover the finest bars and lounges with premium experiences',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=400&fit=crop',
      itemCount: bars.length,
      discount: bars.length > 0 ? `${bars.length} Active` : null,
      featured: true,
      link: '/bars',
    },
    {
      id: 2,
      name: 'Premium Distilleries',
      description: 'Explore craft spirit producers and their exceptional offerings',
      image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop',
      itemCount: distilleries.length,
      discount: null,
      featured: false,
      link: '/distilleries',
    },
    {
      id: 3,
      name: 'Exclusive Events',
      description: 'Join premium tastings, masterclasses, and social gatherings',
      image: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop',
      itemCount: events.length,
      discount: events.filter(e => e.isFeatured).length > 0 ? `${events.filter(e => e.isFeatured).length} Featured` : null,
      featured: false,
      link: '/events',
    },
  ]

  const featuredItems = [...bars.slice(0, 2), ...distilleries.slice(0, 2)].map((item: any) => ({
    id: item.id,
    name: item.name,
    type: item.type || 'Experience',
    image: item.image,
    location: item.location,
    rating: item.rating,
    link: item.specialties ? `/distilleries/${item.id}` : `/bars/${item.id}`,
  }))

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="bg-gray-50">
          <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Collections
                </h1>
                <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                  Discover curated collections of bars, distilleries, and exclusive events
                </p>
              </div>
            </div>
          </section>
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Collections
              </h1>
              <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                Discover curated collections of bars, distilleries, and exclusive events
              </p>
            </div>
          </div>
        </section>

        {/* Featured Collection */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-64 md:h-96">
                <img 
                  src={collections[0].image} 
                  alt={collections[0].name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-2xl mx-auto px-6 text-white">
                    <div className="mb-4">
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {collections[0].discount || 'Featured'}
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                      {collections[0].name}
                    </h2>
                    <p className="text-lg text-gray-200 mb-6">
                      {collections[0].description}
                    </p>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-300">
                        {collections[0].itemCount} venues available
                      </span>
                      <Link href={collections[0].link} className="btn-primary inline-block">
                        Explore Collection
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* All Collections */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Explore Collections
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Browse through our carefully curated collections to find the perfect experience
              </p>
            </div>

            {/* Collections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.filter(c => !c.featured).map((collection) => (
                <Link 
                  key={collection.id} 
                  href={collection.link}
                  className="group cursor-pointer block"
                >
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative h-48">
                      <div 
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{ backgroundImage: `url(${collection.image})` }}
                      />
                      {collection.discount && (
                        <div className="absolute top-4 left-4">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {collection.discount}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                        {collection.name}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {collection.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {collection.itemCount} venues
                        </span>
                        <span className="text-primary-600 font-semibold">
                          Explore →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Items */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Venues
              </h2>
              <p className="text-lg text-gray-600">
                Handpicked bars and distilleries from our collection
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <Link 
                  key={item.id} 
                  href={item.link}
                  className="group cursor-pointer block"
                >
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="relative h-48">
                      <div 
                        className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                        style={{ backgroundImage: `url(${item.image})` }}
                      />
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-2">
                          <span className="text-yellow-500 text-sm font-bold">★</span>
                          <span className="text-gray-900 text-sm font-semibold ml-1">
                            {item.rating || '4.5'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {item.location}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-primary-600 font-semibold">
                          {item.type}
                        </span>
                        <span className="text-primary-600 font-semibold">
                          View →
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Special Offers */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-r from-accent-500 to-purple-600 rounded-2xl p-8 md:p-12 text-white">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Exclusive Experiences
                </h2>
                <p className="text-lg text-accent-100 mb-8 max-w-2xl mx-auto">
                  Don't miss out on these premium events and tastings. Book now and create unforgettable memories!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/events" className="bg-white text-accent-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors text-center">
                    View All Events
                  </Link>
                  <Link href="/bars" className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-accent-600 transition-colors text-center">
                    Explore Bars
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Subscribe to our newsletter for exclusive events and new venue updates
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
} 