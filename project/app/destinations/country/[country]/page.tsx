import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Header from '../../../../components/Header'
import Footer from '../../../../components/Footer'
import DestinationView from '../../../../components/DestinationView'
import { fetchDestination, unslug } from '../../../../lib/destinations'
import { countPhrase } from '../../../../lib/destination-copy'

interface Props {
  params: { country: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const country = unslug(params.country)
  const data = await fetchDestination('country', country)

  if (!data || data.total === 0) {
    return { title: `Whisky in ${country}`, robots: { index: false } }
  }

  const description = `${countPhrase(data.counts)} across ${country}. Rated and reviewed by guests who booked through Destination Whisky.`

  return {
    title: `Whisky in ${country} — Bars, Distilleries & Tours`,
    description,
    alternates: { canonical: `/destinations/country/${params.country}` },
    openGraph: {
      title: `Whisky in ${country}`,
      description,
      type: 'website',
      images: data.topRated[0]?.image ? [data.topRated[0].image] : undefined,
    },
  }
}

export default async function CountryPage({ params }: Props) {
  const country = unslug(params.country)
  const data = await fetchDestination('country', country)

  if (!data || data.total === 0) notFound()

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <DestinationView data={data} label={country} kicker="Country" />
      <Footer />
    </div>
  )
}
