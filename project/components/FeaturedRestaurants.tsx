'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiService } from '@/lib/api'
import { Bar } from '@/lib/types'
import LoadingSpinner from './LoadingSpinner'

export default function FeaturedRestaurants() {
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBars = async () => {
      try {
        const response = await apiService.getBars({ isActive: true, limit: 6 })
        const data = response.data.data || response.data || []
        setBars(data.slice(0, 6))
      } catch (err) {
        console.error('Error fetching bars:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchBars()
  }, [])

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Bars
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover the best bars and lounges with premium experiences
            </p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </section>
    )
  }

  if (bars.length === 0) {
    return null
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Bars
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the best bars and lounges with premium experiences
          </p>
        </div>

        {/* Bars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {bars.map((bar) => (
            <Link 
              key={bar.id} 
              href={`/bars/${bar.id}`}
              className="card group cursor-pointer block"
            >
              {/* Bar Image */}
              <div className="relative overflow-hidden rounded-t-xl">
                <div 
                  className="w-full h-48 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundImage: `url(${bar.image})` }}
                ></div>
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
                    <span className="text-yellow-500 text-sm font-bold">★</span>
                    <span className="text-gray-900 text-sm font-semibold ml-1">
                      {bar.rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bar Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {bar.name}
                </h3>
                <p className="text-gray-600 mb-3">{bar.type} • {bar.location}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <span className="mr-1">�</span>
                    {bar.priceRange}
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">👥</span>
                    {bar.reviews} reviews
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {bar.specialties?.slice(0, 3).map((specialty) => (
                    <span 
                      key={specialty} 
                      className="px-2 py-1 bg-primary-100 text-primary-600 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {bar.location}
                  </div>
                  <div className="text-primary-600 font-semibold">
                    View Details →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link 
            href="/bars" 
            className="btn-secondary text-lg px-8 py-3"
          >
            View All Bars
          </Link>
        </div>
      </div>
    </section>
  )
} 