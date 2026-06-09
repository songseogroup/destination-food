'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiService } from '@/lib/api'
import { Bar } from '@/lib/types'

export default function FeaturedBars() {
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBars = async () => {
      try {
        const response = await apiService.getBars({ limit: 3 })
        setBars(response.data.data || [])
      } catch (error) {
        console.error('Error fetching bars:', error)
        setBars([])
      } finally {
        setLoading(false)
      }
    }

    fetchBars()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Featured Bars
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Experience the finest bars and lounges in the city
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
            Featured Bars
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Experience the finest bars and lounges in the city
          </p>
        </div>

        {bars.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bars.map((bar) => (
            <Link 
              key={bar.id} 
              href={`/bars/${bar.id}`}
              className="group cursor-pointer block"
            >
              <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-yellow-500/20 transition-shadow">
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
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors">
                    {bar.name}
                  </h3>
                  <p className="text-gray-400 mb-2">{bar.type}</p>
                  <p className="text-gray-500 text-sm mb-4">{bar.location}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center">
                      <span className="mr-1">📍</span>
                      {bar.location}
                    </div>
                    <div className="text-primary-500 font-medium">
                      {bar.products?.length || 0} products
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      {bar.type} • {bar.location}
                    </div>
                    <div className="text-primary-500 font-semibold">
                      View Details →
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
            <p className="text-gray-400 mb-6">Premium bars and lounges will be available soon</p>
            <div className="inline-flex items-center px-4 py-2 bg-primary-500/20 border border-primary-500/30 rounded-lg">
              <span className="text-primary-500 text-sm font-medium">Stay tuned for updates!</span>
            </div>
          </div>
        )}

        {bars.length > 0 && (
          <div className="text-center mt-12">
            <Link 
              href="/bars" 
              className="btn-secondary text-lg px-8 py-3"
            >
              View All Bars
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
