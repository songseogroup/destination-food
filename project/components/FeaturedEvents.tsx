'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiService } from '@/lib/api'
import { Event } from '@/lib/types'

export default function FeaturedEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiService.getEvents({ limit: 3 })
        setEvents(response.data.data || [])
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Exclusive Events
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Join premium tastings, masterclasses, and social gatherings
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-700"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }
  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Exclusive Events
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Join premium tastings, masterclasses, and social gatherings
          </p>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event) => (
            <Link 
              key={event.id} 
              href={`/events/${event.id}`}
              className="group cursor-pointer block"
            >
              <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-yellow-500/20 transition-shadow">
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

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors">
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
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-yellow-500 font-bold text-lg">
                      {event.price}
                    </div>
                    <div className="text-primary-500 font-semibold">
                      Book Now →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
            <p className="text-gray-400 mb-6">Exclusive events and tastings will be announced soon</p>
            <div className="inline-flex items-center px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-lg">
              <span className="text-primary-500 text-sm font-medium">Stay tuned for updates!</span>
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="text-center mt-12">
            <Link 
              href="/events" 
              className="btn-secondary text-lg px-8 py-3"
            >
              View All Events
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
