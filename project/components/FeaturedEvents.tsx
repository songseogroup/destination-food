'use client'

import React, { useState, useEffect } from 'react'
import { CalendarDays, Sparkles } from 'lucide-react'
import { apiService } from '@/lib/api'
import { Event } from '@/lib/types'
import { formatPrice, formatEventDate, formatEventTime } from '@/lib/format'
import ListingCard, { ListingCardSkeleton } from './ListingCard'
import Section, { EmptyState } from './ui/Section'
import CardCarousel from './ui/CardCarousel'

/**
 * `content` comes from the CMS (homepage_content.content) via the section
 * registry. Every field is optional and falls back to the shipped copy, so the
 * section still renders correctly if the API is down or a field is blank.
 */
interface FeaturedEventsProps {
  content?: {
    title?: string
    description?: string
    viewAllLabel?: string
    tone?: 'cream' | 'white'
  }
}

export default function FeaturedEvents({ content }: FeaturedEventsProps = {}) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await apiService.getEvents({ limit: 12 })
        setEvents(response.data.data || [])
      } catch (error) {
        console.error('Error fetching events:', error)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  return (
    <Section
      title={content?.title || 'Upcoming Whisky Events'}
      subtitle={content?.description || 'Tastings, masterclasses and festivals worth clearing your calendar for'}
      viewAllHref={events.length > 0 ? '/events' : undefined}
      viewAllLabel={content?.viewAllLabel || 'View all events'}
      align="left"
      tone={content?.tone || 'cream'}
    >
      {loading ? (
        <CardCarousel label="upcoming whisky events">
          {[1, 2, 3, 4].map((i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </CardCarousel>
      ) : events.length > 0 ? (
        <CardCarousel label="upcoming whisky events">
          {events.map((event) => (
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
              tags={[
                { label: event.category, icon: <CalendarDays className="h-3 w-3" /> },
                ...(event.capacity ? [{ label: `${event.capacity} spots` }] : []),
              ]}
              badge={event.isFeatured ? { label: 'Featured', icon: <Sparkles className="h-3 w-3" /> } : null}
              pricePrefix="From"
              price={formatPrice(event.price)}
              priceSuffix="per guest"
            />
          ))}
        </CardCarousel>
      ) : (
        <EmptyState
          icon={<CalendarDays className="h-12 w-12" strokeWidth={1.25} />}
          title="No events scheduled yet"
          description="Tastings, masterclasses and festivals will be announced here."
        />
      )}
    </Section>
  )
}
