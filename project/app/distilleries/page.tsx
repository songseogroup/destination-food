'use client'

import React, { useState, useEffect } from 'react'
import { Factory, Search } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import SitePromoBand from '../../components/SitePromoBand'
import { useBadges } from '../../lib/useBadges'
import ListingCard, { ListingCardSkeleton } from '../../components/ListingCard'
import { EmptyState, ListingGrid } from '../../components/ui/Section'
import { apiService } from '../../lib/api'
import { Distillery } from '../../lib/types'

/** Rating bands for the filter. 4.5+ is the one the spec calls for. */
const RATING_OPTIONS = [
  { value: 'any', label: 'Any rating' },
  { value: '4.5', label: '4.5+ stars' },
  { value: '4', label: '4+ stars' },
  { value: '3', label: '3+ stars' },
]

export default function DistilleriesPage() {
  const badgesFor = useBadges()
  const [distilleries, setDistilleries] = useState<Distillery[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [locationFilter, setLocationFilter] = useState('All Locations')
  const [ratingFilter, setRatingFilter] = useState('any')

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

    // An unrated listing (rating null) falls out of every band, which is what
    // someone asking for "4.5+ stars" means. New venues are only hidden while
    // this filter is on — the default is "Any rating", which shows them.
    const matchesRating =
      ratingFilter === 'any' || Number(distillery.rating || 0) >= Number(ratingFilter)

    return matchesSearch && matchesType && matchesLocation && matchesRating
  })

  const uniqueTypes = ['All Types', ...Array.from(new Set(distilleries.map(d => d.type)))]
  const uniqueLocations = ['All Locations', ...Array.from(new Set(distilleries.map(d => d.location)))]
  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="border-b border-charcoal-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
                Premium Distilleries
              </h1>
              <p className="mt-4 text-lg text-charcoal-600">
                Explore the finest distilleries and craft spirit producers
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
                <label htmlFor="distilleries-search" className="sr-only">
                  Search distilleries
                </label>
                <input
                  id="distilleries-search"
                  type="text"
                  placeholder="Search distilleries, spirits, or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-11"
                />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <label htmlFor="distilleries-type" className="sr-only">
                  Filter by type
                </label>
                <select
                  id="distilleries-type"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="input-field sm:w-52"
                >
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <label htmlFor="distilleries-location" className="sr-only">
                  Filter by location
                </label>
                <select
                  id="distilleries-location"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="input-field sm:w-52"
                >
                  {uniqueLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <label htmlFor="distilleries-rating" className="sr-only">
                  Filter by rating
                </label>
                <select
                  id="distilleries-rating"
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="input-field sm:w-44"
                >
                  {RATING_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Distilleries Grid */}
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
            ) : filteredDistilleries.length > 0 ? (
              <ListingGrid>
                {filteredDistilleries.map((distillery) => (
                  <ListingCard
                    key={distillery.id}
                    href={`/distilleries/${distillery.id}`}
                    image={distillery.image}
                    title={distillery.name}
                    rating={distillery.rating}
                    reviews={distillery.reviews}
                    meta={[
                      distillery.location,
                      distillery.established && `Est. ${distillery.established}`,
                    ]}
                    tags={distillery.specialties?.slice(0, 2).map((s) => ({ label: s })) ?? []}
                    status={distillery.isOpen ? 'open' : 'closed'}
                    price={distillery.priceRange}
                    listingBadges={badgesFor('distillery', distillery.id)}
                  />
                ))}
              </ListingGrid>
            ) : (
              <EmptyState
                icon={<Factory className="h-12 w-12" strokeWidth={1.25} />}
                title="No distilleries found"
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
