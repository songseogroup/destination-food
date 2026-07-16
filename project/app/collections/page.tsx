'use client'

import React, { Suspense, useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SearchX, X } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import SitePromoBand from '../../components/SitePromoBand'
import ListingCard, { ListingCardSkeleton } from '../../components/ListingCard'
import type { ListingCardProps } from '../../components/ListingCard'
import { EmptyState } from '../../components/ui/Section'
import { apiService } from '@/lib/api'
import { Bar, Distillery, Event } from '@/lib/types'
import { formatEventDate, formatEventTime, formatPrice } from '@/lib/format'

/**
 * `rating` is decimal(3,2) in Postgres and arrives as a string ("4.50") — it is
 * passed straight through to ListingCard, which coerces and formats it. There is
 * deliberately no fallback value: a venue with no rating renders "New" rather
 * than the invented "4.5" this page used to print on every card.
 */
function toBarCard(bar: Bar): ListingCardProps {
  return {
    href: `/bars/${bar.id}`,
    image: bar.image,
    title: bar.name,
    rating: bar.rating,
    reviews: bar.reviews,
    meta: [bar.location, bar.type],
    tags: (bar.specialties || []).slice(0, 2).map((label) => ({ label })),
    status: bar.isOpen ? 'open' : 'closed',
  }
}

function toDistilleryCard(distillery: Distillery): ListingCardProps {
  return {
    href: `/distilleries/${distillery.id}`,
    image: distillery.image,
    title: distillery.name,
    rating: distillery.rating,
    reviews: distillery.reviews,
    meta: [distillery.location, distillery.type],
    tags: (distillery.specialties || []).slice(0, 2).map((label) => ({ label })),
    status: distillery.isOpen ? 'open' : 'closed',
  }
}

/**
 * Note the absent `rating` key. Event has no rating column, so omitting the prop
 * makes ListingCard skip the stars row entirely; passing `null` would wrongly
 * advertise the event as "New" (an unrated-but-ratable listing).
 */
function toEventCard(event: Event): ListingCardProps {
  return {
    href: `/events/${event.id}`,
    image: event.image,
    title: event.name,
    meta: [event.location, formatEventDate(event.date), formatEventTime(event.time)],
    tags: event.category ? [{ label: event.category }] : [],
    pricePrefix: 'From',
    price: formatPrice(event.price),
    badge: event.isFeatured ? { label: 'Featured' } : null,
  }
}

/** Case-insensitive substring match across a listing's searchable text. */
function matches(query: string, ...fields: (string | null | undefined)[]) {
  const q = query.toLowerCase()
  return fields.some((field) => (field || '').toLowerCase().includes(q))
}

function BrowseHero() {
  return (
    <section className="border-b border-charcoal-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="section-title text-4xl md:text-5xl">Collections</h1>
          <p className="section-subtitle mt-4">
            Discover curated collections of bars, distilleries, and exclusive events
          </p>
        </div>
      </div>
    </section>
  )
}

function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CollectionsContent() {
  const [bars, setBars] = useState<Bar[]>([])
  const [distilleries, setDistilleries] = useState<Distillery[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  // The header search box and the homepage hero both submit to /collections?q=…,
  // which makes this page the search results surface. With no `q` it is the
  // browse page it has always been.
  const searchParams = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [barsRes, distilleriesRes, eventsRes] = await Promise.all([
          apiService.getBars({ isActive: true, limit: 8 }),
          apiService.getDistilleries({ isActive: true, limit: 8 }),
          apiService.getEvents({ isActive: true, limit: 8 }),
        ])
        setBars(barsRes.data.data || barsRes.data || [])
        setDistilleries(distilleriesRes.data.data || distilleriesRes.data || [])
        setEvents(eventsRes.data.data || eventsRes.data || [])
      } catch (err) {
        console.error('Error fetching collections:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const collections = [
    {
      id: 1,
      name: 'Featured Bars',
      description: 'Discover the finest bars and lounges with premium experiences',
      image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=600&h=400&fit=crop',
      itemCount: bars.length,
      discount: bars.length > 0 ? `${bars.length} Active` : null,
      featured: true,
      link: '/bars',
    },
    {
      id: 2,
      name: 'Premium Distilleries',
      description: 'Explore craft spirit producers and their exceptional offerings',
      image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop',
      itemCount: distilleries.length,
      discount: null,
      featured: false,
      link: '/distilleries',
    },
    {
      id: 3,
      name: 'Exclusive Events',
      description: 'Join premium tastings, masterclasses, and social gatherings',
      image: 'https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop',
      itemCount: events.length,
      discount: events.filter(e => e.isFeatured).length > 0 ? `${events.filter(e => e.isFeatured).length} Featured` : null,
      featured: false,
      link: '/events',
    },
  ]

  const results: ListingCardProps[] = query
    ? [
        ...bars.filter((b) => matches(query, b.name, b.location, b.type)).map(toBarCard),
        ...distilleries
          .filter((d) => matches(query, d.name, d.location, d.type))
          .map(toDistilleryCard),
        ...events
          .filter((e) => matches(query, e.name, e.location, e.type, e.category))
          .map(toEventCard),
      ]
    : []

  // The old featured-venue mapping keyed off `item.specialties` to choose the
  // link — but Bar carries `specialties` too, so every bar linked to
  // /distilleries/:id. Mapping each type explicitly removes the guess.
  const featuredVenues: ListingCardProps[] = [
    ...bars.slice(0, 2).map(toBarCard),
    ...distilleries.slice(0, 2).map(toDistilleryCard),
  ]

  /* ---------------- Search results ---------------- */
  if (query) {
    return (
      <main className="bg-cream">
        <section className="border-b border-charcoal-200 bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="section-title">
              Results for <span className="text-whisky-600">&ldquo;{query}&rdquo;</span>
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {!loading && (
                <p className="text-charcoal-600">
                  {results.length} {results.length === 1 ? 'result' : 'results'} across bars,
                  distilleries and events
                </p>
              )}
              <Link
                href="/collections"
                className="inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 bg-white px-3 py-1.5 text-sm font-medium text-charcoal-600 transition-colors hover:border-charcoal-300 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
                Clear search
              </Link>
            </div>
          </div>
        </section>

        {loading ? (
          <SkeletonGrid />
        ) : (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {results.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {results.map((card) => (
                    <ListingCard key={card.href} {...card} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={<SearchX className="mx-auto h-10 w-10" strokeWidth={1.5} />}
                  title={`No matches for "${query}"`}
                  description="Try a different name, city or venue type — or browse the full collections below."
                />
              )}
            </div>
          </section>
        )}

        {!loading && results.length === 0 && (
          <section className="pb-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap justify-center gap-4">
                {collections.map((collection) => (
                  <Link key={collection.id} href={collection.link} className="btn-secondary">
                    Browse {collection.name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    )
  }

  /* ---------------- Browse ---------------- */
  if (loading) {
    return (
      <main className="bg-cream">
        <BrowseHero />
        <SkeletonGrid />
      </main>
    )
  }

  return (
    <main className="bg-cream">
      <BrowseHero />

      {/* Site-wide promo — same campaign on every page. */}
      <SitePromoBand className="py-12" />

      {/* Featured Collection */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="card overflow-hidden">
            <div className="relative h-64 md:h-96">
              <img
                src={collections[0].image}
                alt=""
                className="h-full w-full object-cover"
              />
              {/* A scrim on photography, not a dark theme — the type sits on the image. */}
              <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/85 via-charcoal-950/50 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="mx-auto max-w-2xl px-6 text-white">
                  <span className="inline-flex items-center rounded-full bg-whisky-500 px-3 py-1 text-sm font-semibold text-white shadow-soft">
                    {collections[0].discount || 'Featured'}
                  </span>
                  <h2 className="mt-4 font-display text-3xl font-bold md:text-4xl">
                    {collections[0].name}
                  </h2>
                  <p className="mt-4 text-lg text-charcoal-100">{collections[0].description}</p>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <span className="text-sm text-charcoal-200">
                      {collections[0].itemCount} venues available
                    </span>
                    <Link href={collections[0].link} className="btn-primary">
                      Explore Collection
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* All Collections */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="section-title">Explore Collections</h2>
            <p className="section-subtitle mt-3">
              Browse through our carefully curated collections to find the perfect experience
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {collections.filter(c => !c.featured).map((collection) => (
              <Link key={collection.id} href={collection.link} className="group block">
                <article className="card-interactive h-full overflow-hidden">
                  <div className="relative h-48 overflow-hidden bg-charcoal-100">
                    <img
                      src={collection.image}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    {collection.discount && (
                      <span className="absolute left-3 top-3 rounded-full bg-whisky-500 px-3 py-1 text-xs font-semibold text-white shadow-soft">
                        {collection.discount}
                      </span>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-ink transition-colors group-hover:text-whisky-700">
                      {collection.name}
                    </h3>
                    <p className="mt-2 text-charcoal-600">{collection.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm text-charcoal-500">
                        {collection.itemCount} venues
                      </span>
                      <span className="text-sm font-semibold text-whisky-700">Explore →</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="border-y border-charcoal-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="section-title">Featured Venues</h2>
            <p className="section-subtitle mt-3">
              Handpicked bars and distilleries from our collection
            </p>
          </div>

          {featuredVenues.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredVenues.map((card) => (
                <ListingCard key={card.href} {...card} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No venues yet"
              description="Bars and distilleries will appear here as they join the platform."
            />
          )}
        </div>
      </section>

      {/* Special Offers */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="gradient-bg rounded-3xl p-8 text-white md:p-12">
            <div className="text-center">
              <h2 className="font-display text-3xl font-bold md:text-4xl">
                Exclusive Experiences
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-whisky-50">
                Don&apos;t miss out on these premium events and tastings. Book now and create
                unforgettable memories!
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/events"
                  className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 font-semibold text-whisky-700 transition-colors hover:bg-whisky-50"
                >
                  View All Events
                </Link>
                <Link
                  href="/bars"
                  className="inline-flex items-center justify-center rounded-full border-2 border-white px-8 py-3 font-semibold text-white transition-colors hover:bg-white hover:text-whisky-700"
                >
                  Explore Bars
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t border-charcoal-200 bg-white py-12">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="section-title">Stay Updated</h2>
          <p className="mt-4 text-lg text-charcoal-600">
            Subscribe to our newsletter for exclusive events and new venue updates
          </p>
          <div className="mx-auto mt-8 flex max-w-md flex-col gap-4 sm:flex-row">
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Email address"
              className="input-field flex-1 rounded-full"
            />
            <button className="btn-primary whitespace-nowrap">Subscribe</button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function CollectionsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <Header />
      {/* useSearchParams() opts the tree into client-side bailout; without a
          Suspense boundary Next 14 fails the production build for this route. */}
      <Suspense
        fallback={
          <main className="bg-cream">
            <BrowseHero />
            <SkeletonGrid />
          </main>
        }
      >
        <CollectionsContent />
      </Suspense>
      <Footer />
    </div>
  )
}
