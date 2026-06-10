'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiService } from '../lib/api'
import { Distillery } from '../lib/types'

export default function FeaturedDistilleries() {
  const [distilleries, setDistilleries] = useState<Distillery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDistilleries = async () => {
      try {
        const response = await apiService.getDistilleries({ limit: 3 })
        setDistilleries(response.data.data || [])
      } catch (error) {
        console.error('Error fetching featured distilleries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDistilleries()
  }, [])
  return (
    <section className="py-16 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Premium Distilleries
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Discover the finest craft spirit producers and their exceptional offerings
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : distilleries.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {distilleries.map((distillery) => (
              <Link 
                key={distillery.id} 
                href={`/distilleries/${distillery.id}`}
                className="group cursor-pointer block"
              >
              <div className="bg-black rounded-xl shadow-lg overflow-hidden hover:shadow-yellow-500/20 transition-shadow">
                <div className="relative h-48">
                  <div 
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundImage: `url(${distillery.image})` }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      distillery.isOpen 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {distillery.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>
                  {distillery.established && (
                    <div className="absolute bottom-4 left-4">
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded font-semibold">
                        Est. {distillery.established}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary-500 transition-colors">
                    {distillery.name}
                  </h3>
                  <p className="text-gray-400 mb-2">{distillery.type}</p>
                  <p className="text-gray-500 text-sm mb-4">{distillery.location}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <div className="flex items-center">
                      <span className="mr-1">📍</span>
                      {distillery.location}
                    </div>
                    <div className="text-primary-500 font-medium">
                      {distillery.products?.length || 0} products
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      {distillery.type}{distillery.established ? ` • Est. ${distillery.established}` : ''}
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
          <div className="text-center py-12">
            <p className="text-gray-400">No distilleries available</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Link 
            href="/distilleries" 
            className="btn-secondary text-lg px-8 py-3"
          >
            View All Distilleries
          </Link>
        </div>
      </div>
    </section>
  )
}
