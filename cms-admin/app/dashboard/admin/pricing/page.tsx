'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Loader2, Save, Percent, DollarSign, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

interface PricingConfig {
  tastingOrBarEventCommissionPercent: number
  distilleryTourCommissionPercent: number
  festivalCommissionPercent: number
  bookingFeeThresholdLow: number
  bookingFeeThresholdMid: number
  bookingFeeLow: number
  bookingFeeMid: number
  bookingFeeHigh: number
}

const DEFAULTS: PricingConfig = {
  tastingOrBarEventCommissionPercent: 10,
  distilleryTourCommissionPercent: 12,
  festivalCommissionPercent: 8,
  bookingFeeThresholdLow: 50,
  bookingFeeThresholdMid: 150,
  bookingFeeLow: 2,
  bookingFeeMid: 4,
  bookingFeeHigh: 6,
}

export default function PricingConfigPage() {
  const user = auth.getUser()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<PricingConfig>(DEFAULTS)
  const [dirty, setDirty] = useState(false)

  const { data, isLoading } = useQuery<PricingConfig>(
    'pricing-config',
    async () => (await api.get('/stripe/admin/pricing-config')).data,
    {
      enabled: user?.role === 'super_admin' || user?.role === 'admin',
      onSuccess: (d) => {
        setForm({ ...DEFAULTS, ...d })
        setDirty(false)
      },
    },
  )

  const saveMutation = useMutation(
    async (patch: Partial<PricingConfig>) =>
      (await api.patch('/stripe/admin/pricing-config', patch)).data,
    {
      onSuccess: () => {
        toast.success('Pricing updated')
        queryClient.invalidateQueries('pricing-config')
        setDirty(false)
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message
        toast.error(Array.isArray(msg) ? msg[0] : msg || 'Update failed')
      },
    },
  )

  useEffect(() => {
    if (data) setForm({ ...DEFAULTS, ...data })
  }, [data])

  const update = <K extends keyof PricingConfig>(key: K, value: number) => {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
  }

  if (user?.role !== 'super_admin' && user?.role !== 'admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">SuperAdmin or Admin only</p>
      </div>
    )
  }

  // Example calculation to show the platform fee for a sample ticket.
  const ticketAmount = 200
  const guests = 2
  const subtotal = ticketAmount * guests
  const commission = (subtotal * form.tastingOrBarEventCommissionPercent) / 100
  const perTicketFee =
    ticketAmount <= form.bookingFeeThresholdLow
      ? form.bookingFeeLow
      : ticketAmount <= form.bookingFeeThresholdMid
      ? form.bookingFeeMid
      : form.bookingFeeHigh
  const bookingFee = perTicketFee * guests
  const platformTake = commission + bookingFee
  const ownerPayout = subtotal - commission

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Platform Pricing</h1>
        <p className="text-gray-600 mt-1">
          Commission rates and booking fees that apply to every booking on the platform.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How pricing works</p>
              <p>
                Every booking takes a <strong>commission</strong> (% of the ticket subtotal) and a flat{' '}
                <strong>booking fee</strong> (per ticket, tiered by ticket price). Both go to the platform; the
                rest is paid out to the vendor.
              </p>
            </div>
          </div>

          {/* Commission rates */}
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
              <Percent className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Commission (% of ticket subtotal)</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <PercentField
                label="Bars / tastings / events"
                description="Bar reservations, tastings, and standard events"
                value={form.tastingOrBarEventCommissionPercent}
                onChange={(v) => update('tastingOrBarEventCommissionPercent', v)}
              />
              <PercentField
                label="Distillery tours"
                description="Distillery tour and tasting experiences"
                value={form.distilleryTourCommissionPercent}
                onChange={(v) => update('distilleryTourCommissionPercent', v)}
              />
              <PercentField
                label="Festivals"
                description="Multi-day or large-format events"
                value={form.festivalCommissionPercent}
                onChange={(v) => update('festivalCommissionPercent', v)}
              />
            </div>
          </section>

          {/* Booking fees */}
          <section className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-5 w-5 text-primary-500" />
              <h2 className="text-lg font-semibold text-gray-900">Booking fee (flat per ticket)</h2>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Charged on top of the ticket price. Tiered by ticket price so cheaper tickets don&apos;t get hit too hard.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <DollarField
                label="Low tier — fee per ticket"
                description={`Applied when ticket price ≤ $${form.bookingFeeThresholdLow}`}
                value={form.bookingFeeLow}
                onChange={(v) => update('bookingFeeLow', v)}
              />
              <DollarField
                label={`Low tier — threshold ≤`}
                description="Tickets at or below this price use the low fee"
                value={form.bookingFeeThresholdLow}
                onChange={(v) => update('bookingFeeThresholdLow', v)}
              />
              <DollarField
                label="Mid tier — fee per ticket"
                description={`Applied when $${form.bookingFeeThresholdLow} < ticket ≤ $${form.bookingFeeThresholdMid}`}
                value={form.bookingFeeMid}
                onChange={(v) => update('bookingFeeMid', v)}
              />
              <DollarField
                label={`Mid tier — threshold ≤`}
                description="Tickets at or below this price use the mid fee"
                value={form.bookingFeeThresholdMid}
                onChange={(v) => update('bookingFeeThresholdMid', v)}
              />
              <DollarField
                label="High tier — fee per ticket"
                description={`Applied when ticket > $${form.bookingFeeThresholdMid}`}
                value={form.bookingFeeHigh}
                onChange={(v) => update('bookingFeeHigh', v)}
              />
            </div>
          </section>

          {/* Live preview */}
          <section className="bg-gray-900 text-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-1">Live example</h2>
            <p className="text-sm text-gray-400 mb-4">
              A {guests}-guest booking at ${ticketAmount} per ticket, in the bars/tastings category:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <PreviewRow label="Ticket subtotal" value={`$${subtotal.toFixed(2)}`} />
              <PreviewRow label={`Booking fee (${guests} × $${perTicketFee})`} value={`$${bookingFee.toFixed(2)}`} />
              <PreviewRow label={`Customer pays`} value={`$${(subtotal + bookingFee).toFixed(2)}`} bold />
              <PreviewRow label={`Platform commission (${form.tastingOrBarEventCommissionPercent}%)`} value={`$${commission.toFixed(2)}`} />
              <PreviewRow label="Platform total revenue" value={`$${platformTake.toFixed(2)}`} highlight />
              <PreviewRow label="Vendor payout" value={`$${ownerPayout.toFixed(2)}`} highlight />
            </div>
          </section>

          {/* Save bar */}
          <div className="sticky bottom-4 z-20">
            <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-4 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                {dirty ? 'You have unsaved changes.' : 'All changes saved.'}
              </p>
              <button
                onClick={() => saveMutation.mutate(form)}
                disabled={!dirty || saveMutation.isLoading}
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saveMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PercentField({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input
          type="number"
          step="0.1"
          min="0"
          max="100"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full pl-3 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  )
}

function DollarField({
  label,
  description,
  value,
  onChange,
}: {
  label: string
  description: string
  value: number
  onChange: (n: number) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
        <input
          type="number"
          step="0.5"
          min="0"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{description}</p>
    </div>
  )
}

function PreviewRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${highlight ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-gray-800'}`}>
      <span className={`text-sm ${highlight ? 'text-primary-300' : 'text-gray-400'}`}>{label}</span>
      <span className={`${bold || highlight ? 'font-bold' : 'font-medium'} text-white`}>{value}</span>
    </div>
  )
}
