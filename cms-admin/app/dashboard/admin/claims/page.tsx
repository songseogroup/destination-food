'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { Check, Loader2, Store, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

type ClaimStatus = 'pending' | 'approved' | 'rejected'

interface Claim {
  id: number
  entityType: 'bar' | 'distillery' | 'event'
  entityId: number
  claimantName: string
  claimantEmail: string
  claimantPhone?: string | null
  message?: string | null
  status: ClaimStatus
  createdAt: string
  listing?: { id: number; name: string; userId?: number | null } | null
}

const STATUS_STYLE: Record<ClaimStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
}

export default function AdminClaimsPage() {
  const user = auth.getUser()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<ClaimStatus | 'all'>('pending')

  const isStaff = user?.role === 'admin' || user?.role === 'super_admin'

  const { data: claims = [], isLoading } = useQuery<Claim[]>(
    ['admin-claims', filter],
    async () =>
      (await api.get('/claims/admin', { params: filter === 'all' ? {} : { status: filter } })).data,
    { enabled: isStaff },
  )

  const decide = useMutation(
    async ({ id, action, note }: { id: number; action: 'approve' | 'reject'; note?: string }) =>
      (await api.patch(`/claims/admin/${id}/${action}`, action === 'reject' ? { note } : {})).data,
    {
      onSuccess: (_, vars) => {
        toast.success(vars.action === 'approve' ? 'Claim approved — listing handed over' : 'Claim rejected')
        queryClient.invalidateQueries('admin-claims')
      },
      onError: (err: any) => {
        // The common case — no operator account yet — comes back as a clear message.
        toast.error(err.response?.data?.message || 'Could not update the claim', { duration: 6000 })
      },
    },
  )

  if (!isStaff) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">Admins only</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Listing Claims</h1>
        <p className="mt-1 text-gray-600">
          Business owners asking to take over a listing. Approving hands the listing to the operator
          account matching their email — invite them as a vendor first if they don&apos;t have one.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{claims.length} claims</span>
      </div>

      <div className="overflow-hidden rounded-lg bg-white shadow">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : claims.length === 0 ? (
          <div className="p-16 text-center">
            <Store className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-700">
              {filter === 'pending' ? 'No claims waiting on you' : 'No claims match this filter'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {claims.map((c) => (
              <li key={c.id} className={`p-5 ${c.status !== 'pending' ? 'opacity-70' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">
                      {c.listing?.name || `${c.entityType} #${c.entityId}`}
                      <span className="ml-2 text-xs font-normal capitalize text-gray-400">
                        {c.entityType}
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-gray-600">
                      {c.claimantName} · {c.claimantEmail}
                      {c.claimantPhone ? ` · ${c.claimantPhone}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[c.status]}`}
                  >
                    {c.status}
                  </span>
                </div>

                {c.message && (
                  <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    “{c.message}”
                  </p>
                )}

                {c.listing?.userId ? (
                  <p className="mt-3 text-xs text-amber-700">
                    This listing already has an owner — approving is no longer possible.
                  </p>
                ) : null}

                {c.status === 'pending' && (
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        const note = window.prompt('Reason for rejecting (optional):') ?? undefined
                        decide.mutate({ id: c.id, action: 'reject', note })
                      }}
                      disabled={decide.isLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-100 px-3 py-1.5 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        if (!window.confirm(`Hand ${c.listing?.name || 'this listing'} to ${c.claimantEmail}?`))
                          return
                        decide.mutate({ id: c.id, action: 'approve' })
                      }}
                      disabled={decide.isLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-3 py-1.5 text-xs text-green-700 hover:bg-green-200 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve &amp; hand over
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
