'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Search, Eye } from 'lucide-react'

interface Customer {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  totalOrders: number
  totalSpent: number
  createdAt: string
}

export default function EventCustomersPage() {
  const params = useParams()
  const id = params.id as string
  const [searchTerm, setSearchTerm] = useState('')

  const { data: event, isLoading: eventLoading } = useQuery(
    ['event', id],
    () => api.get(`/events/${id}`).then(res => res.data)
  )

  const { data: customers, isLoading: customersLoading } = useQuery(
    ['event-customers', id, searchTerm],
    () => {
      if (searchTerm) {
        return api.get(`/events/${id}/customers/search?q=${searchTerm}`).then(res => res.data || [])
      }
      return api.get(`/events/${id}/customers`).then(res => res.data || [])
    }
  )

  if (eventLoading) return <LoadingSpinner />
  if (!event) return <div className="text-center py-12 text-gray-500">Event not found</div>

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="events" name={event.name} />

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Attendees/Customers</h2>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {customersLoading ? (
          <div className="text-center py-8">Loading attendees...</div>
        ) : customers && customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Tickets</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Total Spent</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer: Customer) => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-900">{customer.firstName} {customer.lastName}</td>
                    <td className="py-3 px-4 text-gray-600">{customer.email}</td>
                    <td className="py-3 px-4 text-gray-600">{customer.phone || '-'}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">{customer.totalOrders}</td>
                    <td className="py-3 px-4 text-gray-900 font-medium">${customer.totalSpent.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No attendees found
          </div>
        )}
      </div>
    </div>
  )
}
