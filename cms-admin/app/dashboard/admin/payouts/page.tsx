'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  User
} from 'lucide-react'
import { api } from '@/lib/api'
import { RoleGate } from '@/components/RoleGate'
import toast from 'react-hot-toast'
import { useState } from 'react'

interface Payout {
  id: number
  userId: number
  user?: {
    firstName: string
    lastName: string
    email: string
  }
  amount: number
  status: string
  currency: string
  reason?: string
  requestedAt: string
  createdAt: string
}

export default function AdminPayoutsPage() {
  return (
    <RoleGate allowedRoles={['super_admin']}>
      <AdminPayoutsContent />
    </RoleGate>
  )
}

function AdminPayoutsContent() {
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const queryClient = useQueryClient()

  const { data: payouts, isLoading } = useQuery<Payout[]>(
    'admin-payouts',
    async () => {
      const response = await api.get('/stripe/payouts')
      return response.data
    },
    {
      refetchInterval: 30000,
    }
  )

  const approveMutation = useMutation(
    async (payoutId: number) => {
      const response = await api.post(`/stripe/payouts/${payoutId}/approve`, {})
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Payout approved successfully')
        queryClient.invalidateQueries('admin-payouts')
        setSelectedPayout(null)
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to approve payout')
      },
    }
  )

  const rejectMutation = useMutation(
    async (data: { payoutId: number; reason: string }) => {
      const response = await api.post(`/stripe/payouts/${data.payoutId}/reject`, {
        rejectionReason: data.reason,
      })
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Payout rejected')
        queryClient.invalidateQueries('admin-payouts')
        setSelectedPayout(null)
        setRejectionReason('')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to reject payout')
      },
    }
  )

  const pendingPayouts = payouts?.filter(
    (p) => p.status === 'pending_super_admin_approval'
  ) || []

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending_admin_approval: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircle,
        label: 'Pending Admin',
      },
      pending_super_admin_approval: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: AlertCircle,
        label: 'Pending Approval',
      },
      approved: {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle2,
        label: 'Approved',
      },
      processing: {
        color: 'bg-blue-100 text-blue-800',
        icon: AlertCircle,
        label: 'Processing',
      },
      paid: {
        color: 'bg-green-100 text-green-800',
        icon: CheckCircle2,
        label: 'Paid',
      },
      failed: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        label: 'Failed',
      },
      rejected: {
        color: 'bg-red-100 text-red-800',
        icon: XCircle,
        label: 'Rejected',
      },
    }

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: status }

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${config.color}`}>
        <config.icon className="h-4 w-4" />
        {config.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payout Review</h1>
        <p className="text-gray-600 mt-1">Review and approve payout requests</p>
      </div>

      {/* Pending Payouts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Pending Approvals ({pendingPayouts.length})
          </h2>
        </div>
        <div className="p-6">
          {pendingPayouts.length > 0 ? (
            <div className="space-y-4">
              {pendingPayouts.map((payout) => (
                <motion.div
                  key={payout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {payout.user?.firstName} {payout.user?.lastName}
                          </h3>
                          <p className="text-sm text-gray-600">{payout.user?.email}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <p className="text-2xl font-bold text-gray-900">
                          ${payout.amount.toFixed(2)} {payout.currency.toUpperCase()}
                        </p>
                        {payout.reason && (
                          <p className="text-sm text-gray-600 mt-2">
                            <strong>Reason:</strong> {payout.reason}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Requested: {new Date(payout.requestedAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(payout.status)}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => approveMutation.mutate(payout.id)}
                      disabled={approveMutation.isLoading}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Approve
                    </button>
                    <button
                      onClick={() => setSelectedPayout(payout)}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2"
                    >
                      <XCircle className="h-5 w-5" />
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No pending payouts</p>
              <p className="text-sm">All payout requests have been processed</p>
            </div>
          )}
        </div>
      </div>

      {/* All Payouts */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Payouts</h2>
        </div>
        <div className="p-6">
          {payouts && payouts.length > 0 ? (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {payout.user?.firstName} {payout.user?.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{payout.user?.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-semibold text-gray-900">
                      ${payout.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(payout.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No payouts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Modal */}
      {selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reject Payout</h2>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Rejecting payout request from <strong>{selectedPayout.user?.firstName} {selectedPayout.user?.lastName}</strong>
              </p>
              <p className="text-lg font-semibold text-gray-900">
                Amount: ${selectedPayout.amount.toFixed(2)}
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Please provide a reason for rejecting this payout request..."
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedPayout(null)
                  setRejectionReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!rejectionReason.trim()) {
                    toast.error('Please provide a rejection reason')
                    return
                  }
                  rejectMutation.mutate({
                    payoutId: selectedPayout.id,
                    reason: rejectionReason,
                  })
                }}
                disabled={rejectMutation.isLoading || !rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejectMutation.isLoading ? 'Rejecting...' : 'Reject Payout'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
