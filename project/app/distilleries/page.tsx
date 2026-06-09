'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import LoadingSpinner from '../../components/LoadingSpinner'
import { apiService } from '../../lib/api'
import { Distillery } from '../../lib/types'

export default function DistilleriesPage() {
  const [distilleries, setDistilleries] = useState<Distillery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [locationFilter, setLocationFilter] = useState('All Locations')

  useEffect(() => {
    const fetchDistilleries = async () => {
      try {
        setLoading(true)
        const response = await apiService.getDistilleries()
        setDistilleries(response.data.data || [])
      } catch (error) {
        console.error('Error fetching distilleries:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDistilleries()
  }, [])

  const filteredDistilleries = distilleries.filter((distillery) => {
    const matchesSearch = 
      distillery.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distillery.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      distillery.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'All Types' || distillery.type === typeFilter
    const matchesLocation = locationFilter === 'All Locations' || distillery.location === locationFilter
    
    return matchesSearch && matchesType && matchesLocation
  })

  const uniqueTypes = ['All Types', ...Array.from(new Set(distilleries.map(d => d.type)))]
  const uniqueLocations = ['All Locations', ...Array.from(new Set(distilleries.map(d => d.location)))]
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-black py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Premium Distilleries
              </h1>
              <p className="text-xl text-black/80 mb-8 max-w-2xl mx-auto">
                Explore the finest distilleries and craft spirit producers
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
                  placeholder="Search distilleries, spirits, or locations..."
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

        {/* Distilleries Grid */}
        <section className="py-16 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : filteredDistilleries.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredDistilleries.map((distillery) => (
                  <Link key={distillery.id} href={`/distilleries/${distillery.id}`}>
                    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-yellow-500/20 transition-shadow group cursor-pointer">
                  {/* Distillery Image */}
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

                  {/* Distillery Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">
                      {distillery.name}
                    </h3>
                    <p className="text-gray-400 mb-2">{distillery.type}</p>
                    <p className="text-gray-500 text-sm mb-4">{distillery.location}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                      <div className="flex items-center">
                        <span className="mr-1">📍</span>
                        {distillery.location}
                      </div>
                      <div className="text-yellow-400">
                        {distillery.products?.length || 0} products
                      </div>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {distillery.specialties.slice(0, 2).map((specialty) => (
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
                        {distillery.type}{distillery.established ? ` • Est. ${distillery.established}` : ''}
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
                <p className="text-gray-400 text-lg">No distilleries found</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
