'use client'

import React, { useState, useEffect } from 'react'
import { GlassWater, Search } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import SitePromoBand from '../../components/SitePromoBand'
import ListingCard, { ListingCardSkeleton } from '../../components/ListingCard'
import { EmptyState, ListingGrid } from '../../components/ui/Section'
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
    <div className="min-h-screen bg-cream">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="border-b border-charcoal-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
                Premium Bars &amp; Lounges
              </h1>
              <p className="mt-4 text-lg text-charcoal-600">
                Discover the finest bars, lounges, and nightlife venues in the city
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="border-b border-charcoal-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
                  strokeWidth={1.75}
                />
                <label htmlFor="bars-search" className="sr-only">
                  Search bars
                </label>
                <input
                  id="bars-search"
                  type="text"
                  placeholder="Search bars, locations, or types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-11"
                />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <label htmlFor="bars-type" className="sr-only">
                  Filter by type
                </label>
                <select
                  id="bars-type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input-field sm:w-52"
                >
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <label htmlFor="bars-location" className="sr-only">
                  Filter by location
                </label>
                <select
                  id="bars-location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="input-field sm:w-52"
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
        {/* Site-wide promo — same campaign on every page (byFood-style). */}
        <SitePromoBand className="pt-12" />

        <section className="bg-cream py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {loading ? (
              <ListingGrid>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <ListingCardSkeleton key={i} />
                ))}
              </ListingGrid>
            ) : filteredBars.length > 0 ? (
              <ListingGrid>
                {filteredBars.map((bar) => (
                  <ListingCard
                    key={bar.id}
                    href={`/bars/${bar.id}`}
                    image={bar.image}
                    title={bar.name}
                    rating={bar.rating}
                    reviews={bar.reviews}
                    meta={[bar.location, bar.type]}
                    tags={bar.specialties?.slice(0, 2).map((s) => ({ label: s })) ?? []}
                    status={bar.isOpen ? 'open' : 'closed'}
                    price={bar.priceRange}
                  />
                ))}
              </ListingGrid>
            ) : (
              <EmptyState
                icon={<GlassWater className="h-12 w-12" strokeWidth={1.25} />}
                title="No bars found"
                description="Try a different search term, or clear the type and location filters."
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
