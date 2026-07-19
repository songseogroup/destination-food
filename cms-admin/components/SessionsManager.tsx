'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { CalendarClock, Loader2, Plus, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'

type EntityType = 'bar' | 'distillery' | 'event'

interface Session {
  id: number
  startsAt: string
  durationMinutes?: number | null
  capacity: number
  bookedCount: number
  remaining: number
  priceOverride?: number | null
  isActive: boolean
}

/** 'bars' | 'distilleries' | 'events' (route) → the singular the API expects. */
const SINGULAR: Record<string, EntityType> = {
  bars: 'bar',
  distilleries: 'distillery',
  events: 'event',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * An operator's bookable sessions for one listing.
 *
 * This is where capacity comes from: a slot with room for N, and a running count
 * of how many of those seats are taken. The manager can add and close slots but
 * can't shrink one below what's already booked, or delete one people are booked
 * into — the API enforces both; this just keeps the UI honest about them.
 */
export function SessionsManager({ type, entityId }: { type: string; entityId: string }) {
  const entityType = SINGULAR[type]
  const queryClient = useQueryClient()
  const key = ['sessions', type, entityId]

  const { data: sessions = [], isLoading } = useQuery<Session[]>(key, async () =>
    (await api.get(`/sessions/${entityType}/${entityId}`)).data,
  )

  const [form, setForm] = useState({ startsAt: '', capacity: 12, durationMinutes: '', priceOverride: '' })
  const [adding, setAdding] = useState(false)

  const createMut = useMutation(
    async () =>
      (
        await api.post('/sessions', {
          entityType,
          entityId: Number(entityId),
          startsAt: new Date(form.startsAt).toISOString(),
          capacity: Number(form.capacity),
          durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
          priceOverride: form.priceOverride ? Number(form.priceOverride) : undefined,
        })
      ).data,
    {
      onSuccess: () => {
        toast.success('Session added')
        setForm({ startsAt: '', capacity: 12, durationMinutes: '', priceOverride: '' })
        setAdding(false)
        queryClient.invalidateQueries(key)
      },
      onError: (e: any) => { toast.error(e.response?.data?.message || 'Could not add session') },
    },
  )

  const toggleMut = useMutation(
    async (s: Session) => (await api.patch(`/sessions/${s.id}`, { isActive: !s.isActive })).data,
    {
      onSuccess: () => queryClient.invalidateQueries(key),
      onError: (e: any) => { toast.error(e.response?.data?.message || 'Update failed') },
    },
  )

  const deleteMut = useMutation(async (id: number) => (await api.delete(`/sessions/${id}`)).data, {
    onSuccess: () => {
      toast.success('Session deleted')
      queryClient.invalidateQueries(key)
    },
    onError: (e: any) => { toast.error(e.response?.data?.message || 'Could not delete', { duration: 6000 }) },
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sessions &amp; capacity</h2>
          <p className="text-sm text-gray-600">
            The time slots guests can book, and how many places each has. Bookings can only ever fill
            what you open here.
          </p>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-3 py-2 text-sm font-medium text-white hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          Add session
        </button>
      </div>

      {adding && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!form.startsAt) return toast.error('Pick a date and time')
            createMut.mutate()
          }}
          className="grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Starts</span>
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Capacity</span>
            <input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Duration (min, optional)</span>
            <input
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-gray-700">Price/guest (optional)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              placeholder="listing default"
              value={form.priceOverride}
              onChange={(e) => setForm({ ...form, priceOverride: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={createMut.isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50"
            >
              {createMut.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save session'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <CalendarClock className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="font-medium text-gray-700">No sessions yet</p>
          <p className="text-sm text-gray-500">Add a slot above so guests have something to book.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 overflow-hidden rounded-xl border border-gray-200">
          {sessions.map((s) => {
            const full = s.remaining <= 0
            return (
              <li key={s.id} className={`flex flex-wrap items-center gap-3 p-4 ${!s.isActive ? 'opacity-60' : ''}`}>
                <CalendarClock className="h-5 w-5 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {fmt(s.startsAt)}
                    {s.durationMinutes ? ` · ${s.durationMinutes} min` : ''}
                    {s.priceOverride != null ? ` · $${Number(s.priceOverride).toFixed(2)}/guest` : ''}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="h-3.5 w-3.5" />
                    {s.bookedCount}/{s.capacity} booked
                    <span className={full ? 'font-medium text-red-600' : 'text-green-600'}>
                      · {full ? 'Full' : `${s.remaining} left`}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => toggleMut.mutate(s)}
                  className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                >
                  {s.isActive ? 'Close' : 'Reopen'}
                </button>
                <button
                  onClick={() => {
                    if (s.bookedCount > 0)
                      return toast.error('This session has bookings — close it instead of deleting.')
                    if (window.confirm('Delete this session?')) deleteMut.mutate(s.id)
                  }}
                  className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                  aria-label="Delete session"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
