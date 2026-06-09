'use client'

import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import { 
  ArrowDownRight,
  ArrowUpRight,
  Loader2,
  Filter,
  Search
} from 'lucide-react'
import { api } from '@/lib/api'
import { useState } from 'react'

interface Transaction {
  id: number
  type: 'payment' | 'refund' | 'payout' | 'fee' | 'adjustment'
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  amount: number
  platformFee: number
  organizerEarnings: number
  currency: string
  description: string
  createdAt: string
  metadata?: {
    ticketTotal?: number | string
    bookingFeeTotal?: number | string
    commissionRate?: number | string
    commissionAmount?: number | string
    ticketQuantity?: number | string
  }
  order?: {
    id: number
  }
}

export default function TransactionsPage() {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: transactions, isLoading } = useQuery<Transaction[]>(
    'transactions',
    async () => {
      const response = await api.get('/stripe/transactions?limit=100')
      return response.data
    },
    {
      refetchInterval: 30000,
    }
  )

  const filteredTransactions = transactions?.filter((tx) => {
    const matchesFilter = filter === 'all' || tx.type === filter
    const matchesSearch = search === '' || 
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      tx.id.toString().includes(search)
    return matchesFilter && matchesSearch
  })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <ArrowDownRight className="h-5 w-5 text-green-600" />
      case 'payout':
        return <ArrowUpRight className="h-5 w-5 text-blue-600" />
      case 'refund':
        return <ArrowUpRight className="h-5 w-5 text-red-600" />
      default:
        return <ArrowDownRight className="h-5 w-5 text-gray-600" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'payment':
        return 'text-green-600 bg-green-50'
      case 'payout':
        return 'text-blue-600 bg-blue-50'
      case 'refund':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const totalRevenue = filteredTransactions
    ?.filter(tx => tx.type === 'payment' && tx.status === 'completed')
    .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0) || 0

  const totalPayouts = filteredTransactions
    ?.filter(tx => tx.type === 'payout' && tx.status === 'completed')
    .reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount.toString())), 0) || 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">View all your financial transactions</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Payouts</p>
          <p className="text-2xl font-bold text-blue-600">${totalPayouts.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600 mb-2">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900">{filteredTransactions?.length || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="payment">Payments</option>
              <option value="payout">Payouts</option>
              <option value="refund">Refunds</option>
              <option value="fee">Fees</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions && filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(transaction.type)}
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(transaction.type)}`}>
                          {transaction.type.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{transaction.description}</div>
                      {transaction.order && (
                        <div className="text-xs text-gray-500">Order #{transaction.order.id}</div>
                      )}
                      {transaction.type === 'payment' && transaction.metadata && (
                        <div className="text-xs text-gray-500 mt-1">
                          Tickets ${parseFloat((transaction.metadata.ticketTotal || 0).toString()).toFixed(2)}
                          {' · '}Booking fee ${parseFloat((transaction.metadata.bookingFeeTotal || 0).toString()).toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-semibold ${
                          transaction.type === 'payment'
                            ? 'text-green-600'
                            : transaction.type === 'refund' || transaction.type === 'payout'
                            ? 'text-red-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {transaction.type === 'payment' ? '+' : '-'}$
                        {Math.abs(parseFloat(transaction.amount.toString())).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${parseFloat(transaction.platformFee.toString()).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      ${parseFloat(transaction.organizerEarnings.toString()).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}
                      >
                        {transaction.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                      <br />
                      <span className="text-xs">
                        {new Date(transaction.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
