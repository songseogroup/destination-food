'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  ArrowUpRight,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface Payout {
  id: number
  amount: number
  status: string
  currency: string
  reason?: string
  rejectionReason?: string
  requestedAt: string
  approvedAt?: string
  processedAt?: string
  createdAt: string
}

export default function PayoutsPage() {
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const { data: payouts, isLoading } = useQuery<Payout[]>(
    'payouts',
    async () => {
      const response = await api.get('/stripe/payouts')
      return response.data
    },
    {
      refetchInterval: 30000,
    }
  )

  const { data: summary } = useQuery(
    'financial-summary',
    async () => {
      const response = await api.get('/stripe/financial-summary')
      return response.data
    }
  )

  const requestPayoutMutation = useMutation(
    async (data: { amount: number; reason?: string }) => {
      const response = await api.post('/stripe/payouts/request', data)
      return response.data
    },
    {
      onSuccess: () => {
        toast.success('Payout request submitted successfully')
        setShowRequestModal(false)
        setAmount('')
        setReason('')
        queryClient.invalidateQueries('payouts')
        queryClient.invalidateQueries('financial-summary')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Failed to request payout')
      },
    }
  )

  const handleRequestPayout = () => {
    const amountNum = parseFloat(amount)
    if (!amountNum || amountNum <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (amountNum > (summary?.availableBalance || 0)) {
      toast.error('Insufficient balance')
      return
    }

    requestPayoutMutation.mutate({ amount: amountNum, reason: reason || undefined })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      pending_admin_approval: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        label: 'Pending Approval',
      },
      pending_super_admin_approval: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: Clock,
        label: 'Pending Super Admin',
      },
      approved: {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircle2,
        label: 'Approved',
      },
      processing: {
        color: 'bg-blue-100 text-blue-800',
        icon: Clock,
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

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status }

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600 mt-1">Request and manage your payouts</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          disabled={!summary || summary.availableBalance <= 0}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Request Payout
        </button>
      </div>

      {/* Available Balance Card */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm font-medium">Available Earnings</p>
            <p className="text-3xl font-bold mt-2">${summary?.availableBalance.toFixed(2) || '0.00'}</p>
            <p className="text-primary-100 text-sm mt-2">
              Pending: ${summary?.pendingPayoutAmount.toFixed(2) || '0.00'}
            </p>
          </div>
          <DollarSign className="h-16 w-16 text-primary-200 opacity-50" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
        Payouts are based on your earnings after platform commission. Booking fees charged to customers
        are collected by the platform and are not part of payoutable earnings.
      </div>

      {/* Payouts List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Payout History</h2>
        </div>
        <div className="p-6">
          {payouts && payouts.length > 0 ? (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <motion.div
                  key={payout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        ${payout.amount.toFixed(2)} {payout.currency.toUpperCase()}
                      </h3>
                      {getStatusBadge(payout.status)}
                    </div>
                    {payout.reason && (
                      <p className="text-sm text-gray-600 mb-1">Reason: {payout.reason}</p>
                    )}
                    {payout.rejectionReason && (
                      <p className="text-sm text-red-600 mb-1">
                        Rejection: {payout.rejectionReason}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Requested: {new Date(payout.requestedAt).toLocaleString()}
                      {payout.approvedAt && (
                        <> • Approved: {new Date(payout.approvedAt).toLocaleString()}</>
                      )}
                      {payout.processedAt && (
                        <> • Processed: {new Date(payout.processedAt).toLocaleString()}</>
                      )}
                    </p>
                  </div>
                  <ArrowUpRight className="h-6 w-6 text-gray-400" />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No payouts yet</p>
              <p className="text-sm">Request your first payout to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Request Payout Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Payout</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={summary?.availableBalance || 0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: ${summary?.availableBalance.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Add a note about this payout request..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowRequestModal(false)
                  setAmount('')
                  setReason('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestPayout}
                disabled={requestPayoutMutation.isLoading || !amount}
                className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requestPayoutMutation.isLoading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
