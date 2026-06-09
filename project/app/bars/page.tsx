'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LoadingSpinner from '../../components/LoadingSpinner'
import { apiService } from '../../lib/api'
import { Bar } from '../../lib/types'

export default function BarsPage() {
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [locationFilter, setLocationFilter] = useState('All Locations')

  useEffect(() => {
    const fetchBars = async () => {
      try {
        setLoading(true)
        const response = await apiService.getBars()
        setBars(response.data.data || [])
      } catch (error) {
        console.error('Error fetching bars:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBars()
  }, [])

  const filteredBars = bars.filter((bar) => {
    const matchesSearch = 
      bar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bar.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bar.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'All Types' || bar.type === typeFilter
    const matchesLocation = locationFilter === 'All Locations' || bar.location === locationFilter
    
    return matchesSearch && matchesType && matchesLocation
  })

  const uniqueTypes = ['All Types', ...Array.from(new Set(bars.map(bar => bar.type)))]
  const uniqueLocations = ['All Locations', ...Array.from(new Set(bars.map(bar => bar.location)))]
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Premium Bars & Lounges
              </h1>
              <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
                Discover the finest bars, lounges, and nightlife venues in the city
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
                  placeholder="Search bars, locations, or types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-4">
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                >
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                >
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Bars Grid */}
        <section className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredBars.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBars.map((bar) => (
                  <Link key={bar.id} href={`/bars/${bar.id}`}>
                    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-yellow-500/20 transition-shadow group cursor-pointer">
                  {/* Bar Image */}
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
                    <div className="absolute bottom-4 left-4">
                      <span className="px-2 py-1 bg-yellow-500 text-black text-xs rounded font-semibold">
                        {bar.priceRange}
                      </span>
                    </div>
                  </div>

                  {/* Bar Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                      {bar.name}
                    </h3>
                    <p className="text-gray-400 mb-2">{bar.type}</p>
                    <p className="text-gray-500 text-sm mb-4">{bar.location}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center">
                        <span className="mr-1">📍</span>
                        {bar.location}
                      </div>
                      <div className="text-yellow-400">
                        {bar.products?.length || 0} products
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {bar.specialties.slice(0, 2).map((specialty) => (
                        <span 
                          key={specialty} 
                          className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        {bar.type} • {bar.location}
                      </div>
                      <div className="text-yellow-400 font-semibold">
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
                <p className="text-gray-400 text-lg">No bars found</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
