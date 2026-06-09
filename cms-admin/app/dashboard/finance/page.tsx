'use client'

import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { api } from '@/lib/api'
import Link from 'next/link'
import { KYCOnboardingStepper } from '@/components/KYCOnboardingStepper'

interface FinancialSummary {
  totalRevenue: number
  availableBalance: number
  pendingBalance: number
  totalPayouts: number
  pendingPayoutAmount: number
  transactionCount: number
}

export default function FinancePage() {
  const { data: summary, isLoading } = useQuery<FinancialSummary>(
    'financial-summary',
    async () => {
      const response = await api.get('/stripe/financial-summary')
      return response.data
    },
    {
      refetchInterval: 30000,
    }
  )

  const { data: recentTransactions } = useQuery(
    'recent-transactions',
    async () => {
      const response = await api.get('/stripe/transactions?limit=5')
      return response.data
    }
  )

  const { data: accountStatus } = useQuery(
    'stripe-account-status',
    async () => {
      const response = await api.get('/stripe/connect/account-status')
      return response.data
    }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const stats = [
    {
      name: 'Total Revenue',
      value: `$${summary?.totalRevenue.toFixed(2) || '0.00'}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+12.5%',
      changeType: 'positive',
    },
    {
      name: 'Available Earnings',
      value: `$${summary?.availableBalance.toFixed(2) || '0.00'}`,
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: null,
    },
    {
      name: 'Pending Payouts',
      value: `$${summary?.pendingPayoutAmount.toFixed(2) || '0.00'}`,
      icon: ArrowUpRight,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: null,
    },
    {
      name: 'Total Payouts',
      value: `$${summary?.totalPayouts.toFixed(2) || '0.00'}`,
      icon: ArrowDownRight,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: null,
    },
  ]

  const needsOnboarding = !accountStatus || accountStatus.kycStatus !== 'verified'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your revenue, payouts, and transactions</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/finance/payouts"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            View Payouts
          </Link>
          <Link
            href="/dashboard/finance/transactions"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            View Transactions
          </Link>
        </div>
      </div>

      {needsOnboarding && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800 mb-1">Complete Stripe Onboarding</p>
              <p className="text-sm text-yellow-700">
                You need to complete Stripe onboarding before you can receive payments and request payouts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                {stat.change && (
                  <p
                    className={`text-sm mt-2 flex items-center ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {stat.change}
                  </p>
                )}
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* KYC Onboarding */}
      {needsOnboarding && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Stripe Onboarding</h2>
          <KYCOnboardingStepper />
        </div>
      )}

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {recentTransactions && recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.type === 'payment' ? 'Payment Received' : 'Payout'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                    {transaction.type === 'payment' && transaction.metadata && (
                      <p className="text-xs text-gray-500 mt-1">
                        Tickets ${parseFloat(transaction.metadata.ticketTotal || '0').toFixed(2)}
                        {' · '}Booking fee ${parseFloat(transaction.metadata.bookingFeeTotal || '0').toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'payment' ? '+' : '-'}$
                      {Math.abs(parseFloat(transaction.amount)).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">{transaction.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No transactions yet</p>
            </div>
          )}
          <div className="mt-6">
            <Link
              href="/dashboard/finance/transactions"
              className="text-primary-500 hover:text-primary-600 font-medium"
            >
              View all transactions →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
