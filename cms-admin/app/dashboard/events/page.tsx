'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star } from 'lucide-react'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { isPlatformRole } from '@/lib/roles'
import { Event } from '@/lib/types'
import { EventForm } from '@/components/EventForm'
import { Modal } from '@/components/Modal'
import toast from 'react-hot-toast'

export default function EventsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()
  // Platform staff (admin + super_admin) can create listings. This was
  // isSuperAdmin only, which paired with the backend's @Roles(ADMIN, ...) —
  // that omitted SUPER_ADMIN — meant nobody could actually create one.
  const canCreate = isPlatformRole(auth.getUser()?.role)

  const { data: eventsData, isLoading } = useQuery(
    ['events', currentPage, searchTerm],
    () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })
      if (searchTerm) {
        return api.get(`/events/search?q=${searchTerm}`).then(res => ({ data: res.data, total: res.data.length }))
      }
      return api.get(`/events?${params}`).then(res => res.data)
    }
  )

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/events/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events')
        toast.success('Event deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete event')
      },
    }
  )

  const toggleActiveMutation = useMutation(
    ({ id, isActive }: { id: number; isActive: boolean }) => 
      api.patch(`/events/${id}`, { isActive: !isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events')
        toast.success('Event status updated')
      },
      onError: () => {
        toast.error('Failed to update event status')
      },
    }
  )

  const toggleFeaturedMutation = useMutation(
    ({ id, isFeatured }: { id: number; isFeatured: boolean }) => 
      api.patch(`/events/${id}`, { isFeatured: !isFeatured }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('events')
        toast.success('Event featured status updated')
      },
      onError: () => {
        toast.error('Failed to update event featured status')
      },
    }
  )

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this event?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleActive = (event: Event) => {
    toggleActiveMutation.mutate({ id: event.id, isActive: event.isActive })
  }

  const handleToggleFeatured = (event: Event) => {
    toggleFeaturedMutation.mutate({ id: event.id, isFeatured: event.isFeatured })
  }

  const handleEdit = (event: Event) => {
    setEditingEvent(event)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingEvent(null)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries('events')
    handleFormClose()
    toast.success(editingEvent ? 'Event updated successfully' : 'Event created successfully')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600">Manage events and activities</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </td>
                </tr>
              ) : eventsData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No events found
                  </td>
                </tr>
              ) : (
                eventsData?.data?.map((event: Event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={event.image}
                          alt={event.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{event.name}</div>
                            {event.isFeatured && (
                              <Star className="h-4 w-4 text-yellow-500 ml-2" />
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{event.type} • {event.category}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(event.date)}</div>
                      <div className="text-gray-500">{event.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="font-medium">{event.price}</div>
                      <div className="text-gray-500">{event.capacity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit event details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(event)}
                          className={`${event.isFeatured ? 'text-yellow-600' : 'text-gray-400'} hover:text-yellow-600`}
                          title={event.isFeatured ? 'Remove from featured' : 'Add to featured'}
                        >
                          <Star className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(event)}
                          className="text-gray-600 hover:text-gray-900"
                          title={event.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {event.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {eventsData?.total > 10 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, eventsData.total)} of {eventsData.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={currentPage * 10 >= eventsData.total}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleFormClose}
        title={editingEvent ? 'Edit Event' : 'Add New Event'}
        size="xl"
      >
        <EventForm
          event={editingEvent}
          onSuccess={handleFormSuccess}
          onCancel={handleFormClose}
        />
      </Modal>
    </div>
  )
}
