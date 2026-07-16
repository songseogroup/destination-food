'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useMutation, useQuery } from 'react-query'
import { api } from '@/lib/api'
import { AdminDetailNav } from '@/components/AdminDetailNav'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Edit, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface MenuItem {
  id: number
  name: string
  description?: string
  price: number
  category: string
  isAvailable: boolean
}

export default function BarMenuPage() {
  const params = useParams()
  const id = params.id as string

  const { data: bar, isLoading: barLoading } = useQuery(
    ['bar', id],
    () => api.get(`/bars/${id}`).then((res) => res.data),
  )

  const { data: menuItems = [], isLoading: menuLoading, refetch } = useQuery<MenuItem[]>(
    ['bar-menu', id],
    () => api.get(`/bars/${id}/menu`).then((res) => res.data || []),
  )

  const deleteMutation = useMutation(
    (itemId: number) => api.delete(`/bars/${id}/menu/${itemId}`),
    {
      onSuccess: () => {
        refetch()
        toast.success('Menu item deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete menu item')
      },
    },
  )

  if (barLoading) return <LoadingSpinner />
  if (!bar) return <div className="text-center py-12 text-gray-500">Bar not found</div>

  return (
    <div className="space-y-6">
      <AdminDetailNav id={id} type="bars" name={bar.name} isActive={bar.isActive !== false} />

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Menu Items</h2>
            <p className="mt-1 text-sm text-gray-600">Create and maintain the customer-facing bar menu.</p>
          </div>
          <Link href={`/dashboard/bars/${id}/menu/new`} className="btn-primary">
            <Plus className="h-5 w-5 mr-2" />
            Add Menu Item
          </Link>
        </div>

        {menuLoading ? (
          <div className="text-center py-12 text-gray-500">Loading menu...</div>
        ) : menuItems.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {menuItems.map((item) => (
              <div key={item.id} className="grid grid-cols-1 gap-4 p-5 transition-colors hover:bg-gray-50 lg:grid-cols-[minmax(0,1fr)_160px_140px] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium capitalize text-gray-600">
                      {item.category}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.isAvailable ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {item.isAvailable ? 'Available' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                    {item.description || 'No description yet.'}
                  </p>
                </div>
                <div className="text-lg font-semibold text-gray-900">${Number(item.price).toFixed(2)}</div>
                <div className="flex items-center gap-2 lg:justify-end">
                  <Link
                    href={`/dashboard/bars/${id}/menu/${item.id}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    title="Edit menu item"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Delete this item?')) {
                        deleteMutation.mutate(item.id)
                      }
                    }}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    title="Delete menu item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <h3 className="text-base font-semibold text-gray-900">No menu items yet</h3>
            <p className="mt-2 max-w-md text-sm text-gray-600">Start with the items customers ask for most, then keep pricing and availability current from here.</p>
            <Link href={`/dashboard/bars/${id}/menu/new`} className="btn-primary mt-5">
              <Plus className="h-5 w-5 mr-2" />
              Add Menu Item
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
