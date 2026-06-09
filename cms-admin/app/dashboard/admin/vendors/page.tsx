'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { CheckCircle2, XCircle, PauseCircle, PlayCircle, Loader2, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { roleLabels } from '@/lib/roles'

interface Vendor {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'bar' | 'distillery' | 'event_host' | 'tour_operator'
  approvalStatus: 'pending' | 'approved' | 'rejected'
  isActive: boolean
  listingCount: number
  kycStatus: string | null
  payoutsEnabled: boolean
  createdAt: string
}

const APPROVAL_STYLE: Record<string, string> = {
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function VendorAdminPage() {
  const user = auth.getUser()
  const queryClient = useQueryClient()
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>(
    ['admin-vendors', roleFilter, statusFilter],
    async () => {
      const params: Record<string, string> = {}
      if (roleFilter) params.role = roleFilter
      if (statusFilter) params.approvalStatus = statusFilter
      const res = await api.get('/admin/vendors', { params })
      return res.data
    },
    { enabled: user?.role === 'super_admin' },
  )

  const approvalMutation = useMutation(
    async ({ id, approvalStatus }: { id: number; approvalStatus: string }) =>
      (await api.patch(`/admin/vendors/${id}/approval`, { approvalStatus })).data,
    {
      onSuccess: (_, vars) => {
        toast.success(`Vendor ${vars.approvalStatus}`)
        queryClient.invalidateQueries('admin-vendors')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Update failed')
      },
    },
  )

  const activeMutation = useMutation(
    async ({ id, isActive }: { id: number; isActive: boolean }) =>
      (await api.patch(`/admin/vendors/${id}/active`, { isActive })).data,
    {
      onSuccess: (_, vars) => {
        toast.success(vars.isActive ? 'Vendor re-activated' : 'Vendor suspended')
        queryClient.invalidateQueries('admin-vendors')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Update failed')
      },
    },
  )

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">SuperAdmin only</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vendor Control</h1>
        <p className="text-gray-600 mt-1">Approve, reject, and suspend businesses on the platform</p>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-3">
        <Filter className="h-5 w-5 text-gray-500" />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All roles</option>
          <option value="bar">Bar</option>
          <option value="distillery">Distillery</option>
          <option value="event_host">Event Host</option>
          <option value="tour_operator">Tour Operator</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">{vendors.length} vendors</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No vendors match these filters.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">KYC</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approval</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vendors.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {v.firstName} {v.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{v.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{roleLabels[v.role] || v.role}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{v.listingCount}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      {(v.kycStatus || 'none').replace(/_/g, ' ')}
                    </span>
                    {v.payoutsEnabled && (
                      <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        payouts
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${APPROVAL_STYLE[v.approvalStatus] || 'bg-gray-100 text-gray-700'}`}>
                      {v.approvalStatus.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {v.isActive ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Active</span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">Suspended</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {v.approvalStatus !== 'approved' && (
                        <button
                          title="Approve"
                          onClick={() => approvalMutation.mutate({ id: v.id, approvalStatus: 'approved' })}
                          disabled={approvalMutation.isLoading}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {v.approvalStatus !== 'rejected' && (
                        <button
                          title="Reject"
                          onClick={() => {
                            if (!confirm(`Reject ${v.email}? All their listings will be hidden.`)) return
                            approvalMutation.mutate({ id: v.id, approvalStatus: 'rejected' })
                          }}
                          disabled={approvalMutation.isLoading}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                      {v.isActive ? (
                        <button
                          title="Suspend"
                          onClick={() => {
                            if (!confirm(`Suspend ${v.email}? All their listings will be hidden.`)) return
                            activeMutation.mutate({ id: v.id, isActive: false })
                          }}
                          disabled={activeMutation.isLoading}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg disabled:opacity-50"
                        >
                          <PauseCircle className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          title="Re-activate"
                          onClick={() => activeMutation.mutate({ id: v.id, isActive: true })}
                          disabled={activeMutation.isLoading}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
