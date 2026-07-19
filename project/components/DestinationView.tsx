import Link from 'next/link'
import { ArrowLeft, Flame, MessageSquare, Star } from 'lucide-react'
import ListingCard, { ListingCardProps } from './ListingCard'
import { ListingGrid } from './ui/Section'
import { formatPrice } from '../lib/format'

export interface DestinationListing {
  kind: 'bar' | 'distillery' | 'event'
  id: number
  name: string
  image: string
  location: string
  city: string | null
  rating: number
  reviews: number
  type?: string
  priceRange?: string
  price?: string
  date?: string
}

export interface DestinationData {
  city?: string
  country?: string
  total: number
  counts: { bars: number; distilleries: number; events: number }
  topRated: DestinationListing[]
  mostReviewed: DestinationListing[]
  trending: DestinationListing[]
  all: DestinationListing[]
}

const PATH: Record<DestinationListing['kind'], string> = {
  bar: 'bars',
  distillery: 'distilleries',
  event: 'events',
}

function toCard(l: DestinationListing): ListingCardProps {
  return {
    href: `/${PATH[l.kind]}/${l.id}`,
    image: l.image,
    title: l.name,
    // Events carry no rating today, so the stars row is omitted rather than
    // showing a hollow zero.
    rating: l.kind === 'event' ? undefined : l.rating || null,
    reviews: l.kind === 'event' ? undefined : l.reviews,
    meta: [l.location, l.type],
    tags: [{ label: l.kind === 'bar' ? 'Bar' : l.kind === 'distillery' ? 'Distillery' : 'Event' }],
    price: l.kind === 'event' ? formatPrice(l.price) : l.priceRange || null,
    pricePrefix: l.kind === 'event' ? 'From' : undefined,
  }
}

function Shelf({
  title,
  blurb,
  icon: Icon,
  listings,
}: {
  title: string
  blurb: string
  icon: typeof Star
  listings: DestinationListing[]
}) {
  // An empty shelf says nothing useful, so it isn't rendered at all.
  if (listings.length === 0) return null
  return (
    <section className="py-10">
      <div className="mb-5 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-whisky-50 text-whisky-600">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
          <p className="text-sm text-charcoal-600">{blurb}</p>
        </div>
      </div>
      <ListingGrid>
        {listings.map((l) => (
          <ListingCard key={`${l.kind}-${l.id}`} {...toCard(l)} />
        ))}
      </ListingGrid>
    </section>
  )
}

/**
 * A destination landing page — the same shape for a city or a country.
 *
 * The three shelves are the client's spec: top rated, most reviewed, trending.
 * Each is a different question a visitor might be asking ("what's best?", "what
 * do people actually go to?", "what's happening now?"), so a single ranked list
 * wouldn't do — and any shelf we can't answer honestly is left out rather than
 * padded.
 */
export default function DestinationView({
  data,
  label,
  kicker,
}: {
  data: DestinationData
  /** "Sydney" or "Australia" */
  label: string
  kicker: string
}) {
  const { counts, total } = data
  const parts = [
    counts.bars && `${counts.bars} ${counts.bars === 1 ? 'bar' : 'bars'}`,
    counts.distilleries &&
      `${counts.distilleries} ${counts.distilleries === 1 ? 'distillery' : 'distilleries'}`,
    counts.events && `${counts.events} ${counts.events === 1 ? 'event' : 'events'}`,
  ].filter(Boolean) as string[]

  return (
    <main className="bg-cream">
      <section className="border-b border-charcoal-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link
            href="/destinations"
            className="inline-flex items-center gap-1.5 text-sm text-charcoal-600 transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            All destinations
          </Link>
          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-whisky-600">{kicker}</p>
          <h1 className="section-title mt-2">Whisky in {label}</h1>
          <p className="mt-3 text-charcoal-600">
            {total > 0
              ? `${parts.join(' · ')} — rated and reviewed by people who actually went.`
              : `We don't have anything in ${label} yet.`}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl divide-y divide-charcoal-200 px-4 sm:px-6 lg:px-8">
        <Shelf
          title="Top rated"
          blurb="Highest rated, by guests who booked through us."
          icon={Star}
          listings={data.topRated}
        />
        <Shelf
          title="Most reviewed"
          blurb="The places people keep coming back to talk about."
          icon={MessageSquare}
          listings={data.mostReviewed}
        />
        <Shelf
          title="Trending this month"
          blurb="Getting the most attention right now."
          icon={Flame}
          listings={data.trending}
        />

        {total === 0 && (
          <section className="py-20 text-center">
            <p className="text-charcoal-600">
              Nothing listed in {label} yet — but we&apos;re adding places all the time.
            </p>
            <Link href="/collections" className="btn-secondary mt-6 inline-flex">
              Browse everywhere else
            </Link>
          </section>
        )}
      </div>
    </main>
  )
}
