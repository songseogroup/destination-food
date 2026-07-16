'use client'

import React, { useState, useEffect } from 'react'
import { Factory } from 'lucide-react'
import { apiService } from '../lib/api'
import { Distillery } from '../lib/types'
import ListingCard, { ListingCardSkeleton } from './ListingCard'
import Section, { EmptyState } from './ui/Section'
import CardCarousel from './ui/CardCarousel'

/**
 * `content` comes from the CMS (homepage_content.content) via the section
 * registry. Every field is optional and falls back to the shipped copy, so the
 * section still renders correctly if the API is down or a field is blank.
 */
interface FeaturedDistilleriesProps {
  content?: {
    title?: string
    description?: string
    viewAllLabel?: string
    tone?: 'cream' | 'white'
  }
}

export default function FeaturedDistilleries({ content }: FeaturedDistilleriesProps = {}) {
  const [distilleries, setDistilleries] = useState<Distillery[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDistilleries = async () => {
      try {
        const response = await apiService.getDistilleries({ limit: 12 })
        setDistilleries(response.data.data || [])
      } catch (error) {
        console.error('Error fetching featured distilleries:', error)
        setDistilleries([])
      } finally {
        setLoading(false)
      }
    }

    fetchDistilleries()
  }, [])

  return (
    <Section
      title={content?.title || 'Distilleries & Tours'}
      subtitle={content?.description || 'Go behind the still with the makers themselves'}
      viewAllHref={distilleries.length > 0 ? '/distilleries' : undefined}
      viewAllLabel={content?.viewAllLabel || 'View all distilleries'}
      align="left"
      tone={content?.tone || 'white'}
    >
      {loading ? (
        <CardCarousel label="featured distilleries">
          {[1, 2, 3, 4].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </CardCarousel>
      ) : distilleries.length > 0 ? (
        <CardCarousel label="featured distilleries">
          {distilleries.map((distillery) => (
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
            />
          ))}
        </CardCarousel>
      ) : (
        <EmptyState
          icon={<Factory className="h-12 w-12" strokeWidth={1.25} />}
          title="Distilleries coming soon"
          description="Craft distilleries and their tours will appear here shortly."
        />
      )}
    </Section>
  )
}
