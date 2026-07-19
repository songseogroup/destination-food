'use client'

import { useQuery } from 'react-query'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  RotateCcw,
  Banknote,
  Users,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { RevenueTrendChart, RevenueDonut, RevenueSplitFlow } from '@/components/charts/RevenueCharts'

interface MonthPoint {
  label: string
  gross: number
  revenue: number
}
interface ListingTypeRow {
  type: string
  gross: number
  revenue: number
}
interface TopEarner {
  userId: number
  name: string
  grossBookings: number
  platformRevenue: number
}
interface PlatformFinancials {
  monthlySeries: MonthPoint[]
  byListingType: ListingTypeRow[]
  grossBookings: number
  platformRevenue: number
  platformRevenueGross: number
  operatorEarnings: number
  totalRefunds: number
  refundCount: number
  totalPayouts: number
  pendingPayoutAmount: number
  pendingPayoutCount: number
  paymentCount: number
  averageBookingValue: number
  refundRate: number
  thisMonthRevenue: number
  lastMonthRevenue: number
  topEarners: TopEarner[]
}

const money = (n: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n || 0)
const moneyExact = (n: number) =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(n || 0)

export default function PlatformRevenuePage() {
  const user = auth.getUser()

  const { data, isLoading } = useQuery<PlatformFinancials>(
    'platform-financials',
    async () => (await api.get('/stripe/admin/platform-financials')).data,
    { enabled: user?.role === 'super_admin', refetchInterval: 60000 },
  )

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">SuperAdmin only</p>
      </div>
    )
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    )
  }

  const momDelta = data.lastMonthRevenue
    ? ((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100
    : null
  const momUp = (momDelta ?? 0) >= 0

  // Headline cards. Platform revenue is what DW keeps; the rest gives the P&L shape.
  const cards = [
    { label: 'Gross bookings', value: money(data.grossBookings), sub: `${data.paymentCount} paid bookings`, icon: Receipt, tone: 'ink' },
    { label: 'Platform revenue (DW)', value: money(data.platformRevenue), sub: 'commission + fees, net of refunds', icon: Wallet, tone: 'gold' },
    { label: 'Paid to operators', value: money(data.operatorEarnings), sub: 'their share of bookings', icon: Banknote, tone: 'ink' },
    { label: 'Refunds issued', value: money(data.totalRefunds), sub: `${data.refundCount} refunds · ${(data.refundRate * 100).toFixed(1)}% rate`, icon: RotateCcw, tone: 'danger' },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1614] via-[#2b2018] to-[#3a2a14] px-6 py-8 text-white sm:px-10">
        <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="relative">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-300">Destination Whisky</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Platform Revenue &amp; P&amp;L</h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Everything across the platform — total bookings, what Destination Whisky keeps, what goes
            to operators, refunds, and where the money is being made.
          </p>
          <div className="mt-5 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/50">Platform revenue this month</p>
              <p className="font-display text-4xl font-bold text-primary-300">{money(data.thisMonthRevenue)}</p>
            </div>
            {momDelta !== null && (
              <div
                className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold ${
                  momUp ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'
                }`}
              >
                {momUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {Math.abs(momDelta).toFixed(0)}% vs last month
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          const toneClass =
            c.tone === 'gold'
              ? 'border-primary-200 bg-primary-50'
              : c.tone === 'danger'
                ? 'border-red-100 bg-red-50/50'
                : 'border-gray-200 bg-white'
          return (
            <div key={c.label} className={`rounded-2xl border p-5 shadow-sm ${toneClass}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{c.label}</span>
                <Icon className={`h-5 w-5 ${c.tone === 'gold' ? 'text-primary-600' : c.tone === 'danger' ? 'text-red-500' : 'text-gray-400'}`} />
              </div>
              <p className={`mt-2 font-display text-3xl font-bold ${c.tone === 'gold' ? 'text-primary-700' : 'text-gray-900'}`}>
                {c.value}
              </p>
              <p className="mt-1 text-xs text-gray-500">{c.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Revenue trend — the showpiece */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1614] via-[#221a12] to-[#2b2014] p-6 shadow-sm sm:p-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-white">Revenue trend</h2>
            <p className="text-sm text-white/50">Gross bookings across the last 8 months · dotted line is DW revenue</p>
          </div>
          <span className="rounded-full bg-primary-500/15 px-3 py-1 text-xs font-semibold text-primary-300 ring-1 ring-primary-400/25">
            live
          </span>
        </div>
        <RevenueTrendChart data={data.monthlySeries} />
      </div>

      {/* Money flow + listing-type donut */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">Where every dollar goes</h2>
          <RevenueSplitFlow
            gross={data.grossBookings}
            platformRevenue={data.platformRevenueGross}
            operatorEarnings={data.operatorEarnings}
            refunds={data.totalRefunds}
          />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold text-gray-900">Revenue by experience type</h2>
          <RevenueDonut
            centerLabel="Gross"
            centerValue={money(data.grossBookings)}
            segments={[
              { label: 'Bars', value: data.byListingType.find((r) => r.type === 'Bars')?.gross || 0, color: '#B8862F' },
              { label: 'Distilleries', value: data.byListingType.find((r) => r.type === 'Distilleries')?.gross || 0, color: '#8a5a2b' },
              { label: 'Events', value: data.byListingType.find((r) => r.type === 'Events')?.gross || 0, color: '#E0B457' },
            ]}
          />
        </div>
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Avg booking value', value: moneyExact(data.averageBookingValue) },
          { label: 'Payouts completed', value: money(data.totalPayouts) },
          { label: 'Pending payouts', value: money(data.pendingPayoutAmount), sub: `${data.pendingPayoutCount} awaiting approval` },
          { label: 'Platform revenue (gross)', value: money(data.platformRevenueGross), sub: 'before refunds' },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{m.label}</p>
            <p className="mt-1 text-xl font-bold text-gray-900">{m.value}</p>
            {m.sub && <p className="text-xs text-gray-400">{m.sub}</p>}
          </div>
        ))}
      </div>

      {/* Where the money is made — top earners */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
          <Users className="h-5 w-5 text-primary-600" />
          <h2 className="font-bold text-gray-900">Where the money is made — top operators</h2>
        </div>
        {data.topEarners.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <TrendingUp className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium">No booking revenue yet</p>
            <p className="text-sm">Once bookings are paid, the biggest earners show up here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">#</th>
                  <th className="px-5 py-3 font-medium">Operator</th>
                  <th className="px-5 py-3 text-right font-medium">Gross bookings</th>
                  <th className="px-5 py-3 text-right font-medium">DW revenue</th>
                  <th className="px-5 py-3 text-right font-medium">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.topEarners.map((e, i) => {
                  const share = data.grossBookings ? (e.grossBookings / data.grossBookings) * 100 : 0
                  return (
                    <tr key={e.userId} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-900">{e.name}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{moneyExact(e.grossBookings)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-primary-700">{moneyExact(e.platformRevenue)}</td>
                      <td className="px-5 py-3 text-right text-gray-500">{share.toFixed(0)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Read-out note */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-600">
        <p className="mb-1 flex items-center gap-1.5 font-semibold text-gray-800">
          {momUp ? <TrendingUp className="h-4 w-4 text-green-600" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          How to read this
        </p>
        <p>
          <span className="font-medium text-gray-800">Platform revenue (DW)</span> is what Destination
          Whisky actually keeps — commission plus booking fees, already net of refunds. Gross bookings
          is the full amount customers paid; the difference goes to operators. Stripe&apos;s own
          processing fees are passed to operators, so they aren&apos;t a platform cost here.
        </p>
      </div>
    </div>
  )
}
