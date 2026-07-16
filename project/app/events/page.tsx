'use client'

import React, { useState, useEffect } from 'react'
import { CalendarDays, Search } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import SitePromoBand from '../../components/SitePromoBand'
import ListingCard, { ListingCardSkeleton } from '../../components/ListingCard'
import { EmptyState, ListingGrid } from '../../components/ui/Section'
import { apiService } from '../../lib/api'
import { Event } from '../../lib/types'
import { formatPrice, formatEventDate, formatEventTime } from '../../lib/format'

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
    <div className="min-h-screen bg-cream">
      <Header />

      <main>
        {/* Hero Section */}
        <section className="border-b border-charcoal-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
                Premium Events
              </h1>
              <p className="mt-4 text-lg text-charcoal-600">
                Join exclusive tastings, masterclasses, and social events
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
                <label htmlFor="events-search" className="sr-only">
                  Search events
                </label>
                <input
                  id="events-search"
                  type="text"
                  placeholder="Search events, venues, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-11"
                />
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <label htmlFor="events-category" className="sr-only">
                  Filter by category
                </label>
                <select
                  id="events-category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="input-field sm:w-52"
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
            ) : filteredEvents.length > 0 ? (
              <ListingGrid>
                {filteredEvents.map((event) => (
                  /*
                   * No `rating` prop: the Event entity carries no rating/reviews
                   * columns, and omitting it drops the stars row entirely.
                   * Passing null here would render a misleading "New".
                   */
                  <ListingCard
                    key={event.id}
                    href={`/events/${event.id}`}
                    image={event.image}
                    title={event.name}
                    meta={[
                      event.location,
                      [formatEventDate(event.date), formatEventTime(event.time)]
                        .filter(Boolean)
                        .join(', '),
                    ]}
                    tags={[{ label: event.category }]}
                    badge={event.isFeatured ? { label: 'Featured' } : null}
                    pricePrefix="From"
                    price={formatPrice(event.price)}
                    priceSuffix="per guest"
                  />
                ))}
              </ListingGrid>
            ) : (
              <EmptyState
                icon={<CalendarDays className="h-12 w-12" strokeWidth={1.25} />}
                title="No events found"
                description="Try a different search term, or clear the category filter."
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
