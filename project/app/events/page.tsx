'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LoadingSpinner from '../../components/LoadingSpinner'
import { apiService } from '../../lib/api'
import { Event } from '../../lib/types'

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All Categories')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await apiService.getEvents()
        setEvents(response.data.data || [])
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const filteredEvents = events.filter((event) => {
    const matchesSearch = 
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = categoryFilter === 'All Categories' || event.category === categoryFilter
    
    return matchesSearch && matchesCategory
  })

  const uniqueCategories = ['All Categories', ...Array.from(new Set(events.map(e => e.category)))]
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Premium Events
              </h1>
              <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
                Join exclusive tastings, masterclasses, and social events
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-8 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search events, venues, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-4">
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                >
                  {uniqueCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event) => (
                  <Link key={event.id} href={`/events/${event.id}`}>
                    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-yellow-500/20 transition-shadow group cursor-pointer">
                  {/* Event Image */}
                  <div className="relative h-48">
                    <div 
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url(${event.image})` }}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-yellow-500 text-black text-xs rounded-full font-semibold">
                        {event.category}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <div className="bg-black/80 backdrop-blur-sm rounded-full p-2">
                        <span className="text-yellow-500 text-sm font-bold">💰</span>
                        <span className="text-white text-sm font-semibold ml-1">
                          {event.price}
                        </span>
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4">
                      <span className="px-2 py-1 bg-black/70 text-white text-xs rounded">
                        {event.capacity}
                      </span>
                    </div>
                  </div>

                  {/* Event Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                      {event.name}
                    </h3>
                    <p className="text-gray-400 mb-2">{event.type}</p>
                    <p className="text-gray-500 text-sm mb-4">{event.description}</p>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="mr-2">📅</span>
                        {new Date(event.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric' 
                        })} at {event.time}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="mr-2">📍</span>
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-400">
                        <span className="mr-2">👥</span>
                        {event.capacity}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-yellow-400 font-bold text-lg">
                        {event.price}
                      </div>
                      <div className="text-yellow-400 font-semibold">
                        Book Now →
                      </div>
                    </div>
                  </div>
                </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No events found</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
