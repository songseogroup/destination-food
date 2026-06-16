'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { CheckCircle2, XCircle, PauseCircle, PlayCircle, Loader2, Filter, FileText, X, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { roleLabels } from '@/lib/roles'

interface IdentityDoc {
  fileId: string
  uploadedAt: string
  filename: string
  url?: string
}
interface IdentityDocs {
  front?: IdentityDoc
  back?: IdentityDoc
}

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
  const [kycVendor, setKycVendor] = useState<Vendor | null>(null)
  const [kycDocs, setKycDocs] = useState<IdentityDocs | null>(null)
  const [kycLoading, setKycLoading] = useState(false)

  const openKycModal = async (vendor: Vendor) => {
    setKycVendor(vendor)
    setKycDocs(null)
    setKycLoading(true)
    try {
      const res = await api.get(`/stripe/admin/vendors/${vendor.id}/identity-documents`)
      setKycDocs(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not load documents')
    } finally {
      setKycLoading(false)
    }
  }

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
                      <button
                        title="View KYC documents"
                        onClick={() => openKycModal(v)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
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

      {/* KYC documents modal */}
      {kycVendor && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setKycVendor(null)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  KYC documents — {kycVendor.firstName} {kycVendor.lastName}
                </h3>
                <p className="text-xs text-gray-500">{kycVendor.email}</p>
              </div>
              <button
                onClick={() => setKycVendor(null)}
                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {kycLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                </div>
              ) : !kycDocs || (!kycDocs.front && !kycDocs.back) ? (
                <div className="text-center py-12">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">No identity documents uploaded</p>
                  <p className="text-sm text-gray-500 mt-1">
                    The vendor hasn&apos;t uploaded their ID yet. Once they do, you&apos;ll be able to view both sides here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(['front', 'back'] as const).map((side) => {
                    const doc = kycDocs?.[side]
                    return (
                      <div key={side} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-medium text-gray-900">ID {side}</p>
                          {doc?.fileId ? (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                              Uploaded
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                              Missing
                            </span>
                          )}
                        </div>
                        {doc?.fileId ? (
                          <>
                            <p className="text-xs text-gray-500 truncate mb-1">
                              <strong>File:</strong> {doc.filename}
                            </p>
                            <p className="text-xs text-gray-500 mb-3">
                              <strong>Uploaded:</strong>{' '}
                              {new Date(doc.uploadedAt).toLocaleString()}
                            </p>
                            {doc.url ? (
                              <a
                                href={doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600"
                              >
                                <ExternalLink className="h-4 w-4" />
                                View document
                              </a>
                            ) : (
                              <p className="text-xs text-gray-500 italic">
                                View link unavailable. File ID: {doc.fileId}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">Not yet uploaded by the vendor.</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                View links expire after 1 hour. Reopen this modal to get a fresh link.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
