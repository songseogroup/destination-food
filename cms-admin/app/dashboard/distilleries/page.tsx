'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { isPlatformRole } from '@/lib/roles'
import { Distillery } from '@/lib/types'
import { DistilleryForm } from '@/components/DistilleryForm'
import { Modal } from '@/components/Modal'
import toast from 'react-hot-toast'

export default function DistilleriesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDistillery, setEditingDistillery] = useState<Distillery | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()
  // Platform staff (admin + super_admin) can create listings. This was
  // isSuperAdmin only, which paired with the backend's @Roles(ADMIN, ...) —
  // that omitted SUPER_ADMIN — meant nobody could actually create one.
  const canCreate = isPlatformRole(auth.getUser()?.role)

  const { data: distilleriesData, isLoading } = useQuery(
    ['distilleries', currentPage, searchTerm],
    () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
      })
      if (searchTerm) {
        return api.get(`/distilleries/search?q=${searchTerm}`).then(res => ({ data: res.data, total: res.data.length }))
      }
      return api.get(`/distilleries?${params}`).then(res => res.data)
    }
  )

  const deleteMutation = useMutation(
    (id: number) => api.delete(`/distilleries/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('distilleries')
        toast.success('Distillery deleted successfully')
      },
      onError: () => {
        toast.error('Failed to delete distillery')
      },
    }
  )

  const toggleActiveMutation = useMutation(
    ({ id, isActive }: { id: number; isActive: boolean }) => 
      api.patch(`/distilleries/${id}`, { isActive: !isActive }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('distilleries')
        toast.success('Distillery status updated')
      },
      onError: () => {
        toast.error('Failed to update distillery status')
      },
    }
  )

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this distillery?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleToggleActive = (distillery: Distillery) => {
    toggleActiveMutation.mutate({ id: distillery.id, isActive: distillery.isActive })
  }

  const handleEdit = (distillery: Distillery) => {
    setEditingDistillery(distillery)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingDistillery(null)
  }

  const handleFormSuccess = () => {
    queryClient.invalidateQueries('distilleries')
    handleFormClose()
    toast.success(
      editingDistillery ? 'Distillery updated successfully' : 'Distillery created successfully'
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distilleries Management</h1>
          <p className="text-gray-600">Manage distilleries and craft spirit producers</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Distillery
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
                placeholder="Search distilleries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Distilleries Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distillery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Established
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
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
                  <td colSpan={7} className="px-6 py-4 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                  </td>
                </tr>
              ) : distilleriesData?.data?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    No distilleries found
                  </td>
                </tr>
              ) : (
                distilleriesData?.data?.map((distillery: Distillery) => (
                  <tr key={distillery.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={distillery.image}
                          alt={distillery.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{distillery.name}</div>
                          <div className="text-sm text-gray-500">{distillery.priceRange}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {distillery.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {distillery.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {distillery.established}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {distillery.products?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        distillery.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {distillery.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(distillery)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit distillery details"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(distillery)}
                          className="text-gray-600 hover:text-gray-900"
                          title={distillery.isActive ? 'Disable' : 'Enable'}
                        >
                          {distillery.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(distillery.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete distillery"
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
        {distilleriesData?.total > 10 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, distilleriesData.total)} of {distilleriesData.total} results
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
                disabled={currentPage * 10 >= distilleriesData.total}
                className="btn-secondary disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Distillery Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleFormClose}
        title={editingDistillery ? 'Edit Distillery' : 'Add New Distillery'}
        size="xl"
      >
        <DistilleryForm
          distillery={editingDistillery}
          onSuccess={handleFormSuccess}
          onCancel={handleFormClose}
        />
      </Modal>
    </div>
  )
}
