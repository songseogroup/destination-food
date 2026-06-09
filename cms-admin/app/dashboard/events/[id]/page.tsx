'use client'

import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { Event } from '@/lib/types'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { EventForm } from '@/components/EventForm'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export default function EventDetailPage() {
  const params = useParams()
  const id = params.id as string

  const { data: event, isLoading } = useQuery(
    ['event', id],
    () => api.get(`/events/${id}`).then(res => res.data)
  )

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!event) {
    return <div className="text-center py-12 text-gray-500">Event not found</div>
  }

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="events" name={event.name} />
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Event Details</h2>
        <EventForm event={event} onSuccess={() => {}} onCancel={() => {}} />
      </div>
    </div>
  )
}
