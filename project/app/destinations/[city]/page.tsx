import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '../../../components/Header'
import Footer from '../../../components/Footer'
import DestinationView from '../../../components/DestinationView'
import { fetchDestination, unslug } from '../../../lib/destinations'
import { countPhrase } from '../../../lib/destination-copy'

interface Props {
  params: { city: string }
}

/**
 * Per-city SEO metadata, built from the real listing counts.
 *
 * The client's spec calls for SEO metadata on each destination page, and a
 * generic description on every city would defeat the point — "3 whisky bars and
 * 2 distilleries in Sydney" is what someone searching actually wants to see.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const city = unslug(params.city)
  const data = await fetchDestination('city', city)

  if (!data || data.total === 0) {
    return { title: `Whisky in ${city}`, robots: { index: false } }
  }

  const description = `${countPhrase(data.counts)} in ${city}. Rated and reviewed by guests who booked through Destination Whisky. Book tastings, tours and events.`

  return {
    title: `Whisky in ${city} — Bars, Distilleries & Tours`,
    description,
    alternates: { canonical: `/destinations/${params.city}` },
    openGraph: {
      title: `Whisky in ${city}`,
      description,
      type: 'website',
      images: data.topRated[0]?.image ? [data.topRated[0].image] : undefined,
    },
  }
}

export default async function CityPage({ params }: Props) {
  const city = unslug(params.city)
  const data = await fetchDestination('city', city)

  // A city we have nothing in isn't a page — it's a 404. Rendering an empty
  // shelf for every mistyped slug would let search engines index nothing pages.
  if (!data || data.total === 0) notFound()

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <DestinationView data={data} label={city} kicker="Destination" />
      <Footer />
    </div>
  )
}
