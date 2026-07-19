import type { Metadata } from 'next'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { fetchDestinationIndex, slugify } from '../../lib/destinations'

export const metadata: Metadata = {
  title: 'Destinations — Whisky Bars, Distilleries & Tours by City',
  description:
    'Browse whisky bars, distilleries, tastings and tours by city and country. Rated and reviewed by guests who booked through Destination Whisky.',
  alternates: { canonical: '/destinations' },
}

export const revalidate = 3600

export default async function DestinationsIndexPage() {
  const data = await fetchDestinationIndex()
  const cities = data?.cities || []
  const countries = data?.countries || []

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main>
        <section className="border-b border-charcoal-200 bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs uppercase tracking-[0.2em] text-whisky-600">Destinations</p>
            <h1 className="section-title mt-2">Where do you want to drink?</h1>
            <p className="mt-3 max-w-2xl text-charcoal-600">
              Every city we list, with the best-rated and busiest places in each.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {cities.length === 0 ? (
            <div className="card px-6 py-16 text-center">
              <MapPin className="mx-auto h-8 w-8 text-charcoal-300" />
              <p className="mt-4 text-charcoal-600">No destinations listed yet.</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold text-ink">Cities</h2>
              <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cities.map((c) => (
                  <li key={c.city}>
                    <Link
                      href={`/destinations/${slugify(c.city)}`}
                      className="card flex items-center justify-between px-5 py-4 transition-colors hover:border-whisky-300"
                    >
                      <span className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-whisky-500" />
                        <span>
                          <span className="block font-medium text-ink">{c.city}</span>
                          {c.country && (
                            <span className="block text-xs text-charcoal-500">{c.country}</span>
                          )}
                        </span>
                      </span>
                      <span className="text-sm text-charcoal-500">
                        {c.count} {c.count === 1 ? 'place' : 'places'}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              {countries.length > 0 && (
                <>
                  <h2 className="mt-12 font-display text-xl font-semibold text-ink">Countries</h2>
                  <ul className="mt-5 flex flex-wrap gap-3">
                    {countries.map((c) => (
                      <li key={c.country}>
                        <Link
                          href={`/destinations/country/${slugify(c.country)}`}
                          className="inline-flex items-center gap-2 rounded-full border border-charcoal-200 bg-white px-4 py-2 text-sm text-charcoal-700 transition-colors hover:border-whisky-300 hover:text-ink"
                        >
                          {c.country}
                          <span className="text-charcoal-400">{c.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
