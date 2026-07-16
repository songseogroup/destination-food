'use client'

import React, { useState, useEffect } from 'react'
import { GlassWater } from 'lucide-react'
import { apiService } from '@/lib/api'
import { Bar } from '@/lib/types'
import ListingCard, { ListingCardSkeleton } from './ListingCard'
import Section, { EmptyState } from './ui/Section'
import CardCarousel from './ui/CardCarousel'

/**
 * `content` comes from the CMS (homepage_content.content) via the section
 * registry. Every field is optional and falls back to the shipped copy, so the
 * section still renders correctly if the API is down or a field is blank.
 */
interface FeaturedBarsProps {
  content?: {
    title?: string
    description?: string
    viewAllLabel?: string
    tone?: 'cream' | 'white'
  }
}

export default function FeaturedBars({ content }: FeaturedBarsProps = {}) {
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBars = async () => {
      try {
        // A carousel needs more than one page of cards to be worth scrolling.
        const response = await apiService.getBars({ limit: 12 })
        setBars(response.data.data || [])
      } catch (error) {
        console.error('Error fetching bars:', error)
        setBars([])
      } finally {
        setLoading(false)
      }
    }

    fetchBars()
  }, [])

  return (
    <Section
      title={content?.title || 'Featured Whisky Bars'}
      subtitle={content?.description || 'Rare drams, deep back bars, and the people who know them best'}
      viewAllHref={bars.length > 0 ? '/bars' : undefined}
      viewAllLabel={content?.viewAllLabel || 'View all bars'}
      align="left"
      tone={content?.tone || 'cream'}
    >
      {loading ? (
        <CardCarousel label="featured whisky bars">
          {[1, 2, 3, 4].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </CardCarousel>
      ) : bars.length > 0 ? (
        <CardCarousel label="featured whisky bars">
          {bars.map((bar) => (
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
        </CardCarousel>
      ) : (
        <EmptyState
          icon={<GlassWater className="h-12 w-12" strokeWidth={1.25} />}
          title="Bars coming soon"
          description="We're pouring over the list. Great whisky bars will appear here shortly."
        />
      )}
    </Section>
  )
}
