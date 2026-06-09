'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ListingMediaManager } from '@/components/ListingMediaManager'

export default function EventMediaPage() {
  const params = useParams()
  const id = params.id as string
  const [uploading, setUploading] = useState(false)

  const { data: event, isLoading, refetch: refetchEvent } = useQuery(
    ['event', id],
    () => api.get(`/events/${id}`).then((res) => res.data),
  )

  const { data: images = [], isLoading: imagesLoading, refetch } = useQuery(
    ['event-media', id],
    () => api.get(`/events/${id}/media`).then((res) => res.data || []),
  )

  if (isLoading) return <LoadingSpinner />
  if (!event) return <div className="text-center py-12 text-gray-500">Event not found</div>

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="events" name={event.name} />
      <ListingMediaManager
        entity={event}
        type="events"
        label="event"
        images={images}
        imagesLoading={imagesLoading}
        uploading={uploading}
        setUploading={setUploading}
        refetchImages={refetch}
        refetchEntity={refetchEvent}
      />
    </div>
  )
}
