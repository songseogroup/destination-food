'use client'

import { useState, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Plus,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

type Slot = 'top_hero' | 'right_rail' | 'mid_inline' | 'featured_above'

interface Banner {
  id: number
  slot: Slot
  title: string
  subtitle?: string
  imageUrl: string
  linkUrl?: string
  priority: number
  isActive: boolean
  startsAt?: string
  endsAt?: string
  impressions: number
  clicks: number
}

const SLOT_LABELS: Record<Slot, string> = {
  top_hero: 'Below hero — between Banner and Featured Bars',
  mid_inline: 'Between Featured Bars and Distilleries',
  featured_above: 'Between Distilleries and Events',
  right_rail: 'Between Events and Blogs',
}

const SLOT_ORDER: Slot[] = ['top_hero', 'mid_inline', 'featured_above', 'right_rail']

export default function BannerAdminPage() {
  const user = auth.getUser()
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Partial<Banner>>({
    slot: 'top_hero',
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    priority: 0,
    isActive: true,
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  const { data: banners = [], isLoading } = useQuery<Banner[]>(
    'admin-banners',
    async () => (await api.get('/admin/banners')).data,
    { enabled: user?.role === 'super_admin' },
  )

  const createMutation = useMutation(
    async (payload: Partial<Banner>) => (await api.post('/admin/banners', payload)).data,
    {
      onSuccess: () => {
        toast.success('Banner created')
        setShowForm(false)
        setForm({ slot: 'top_hero', title: '', subtitle: '', imageUrl: '', linkUrl: '', priority: 0, isActive: true })
        queryClient.invalidateQueries('admin-banners')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Create failed')
      },
    },
  )

  const updateMutation = useMutation(
    async ({ id, patch }: { id: number; patch: Partial<Banner> }) =>
      (await api.patch(`/admin/banners/${id}`, patch)).data,
    {
      onSuccess: () => {
        toast.success('Banner updated')
        queryClient.invalidateQueries('admin-banners')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Update failed')
      },
    },
  )

  const deleteMutation = useMutation(
    async (id: number) => (await api.delete(`/admin/banners/${id}`)).data,
    {
      onSuccess: () => {
        toast.success('Banner deleted')
        queryClient.invalidateQueries('admin-banners')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Delete failed')
      },
    },
  )

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/upload/image', fd)
      const url = res.data.url || res.data.secure_url || res.data
      setForm((f) => ({ ...f, imageUrl: typeof url === 'string' ? url : '' }))
      toast.success('Image uploaded')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">SuperAdmin only</p>
      </div>
    )
  }

  const grouped: Record<Slot, Banner[]> = {
    top_hero: [],
    right_rail: [],
    mid_inline: [],
    featured_above: [],
  }
  banners.forEach((b) => grouped[b.slot]?.push(b))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-600 mt-1">Manage promotional banners shown on the public website</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          New Banner
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Create banner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slot</label>
              <select
                value={form.slot}
                onChange={(e) => setForm({ ...form, slot: e.target.value as Slot })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {SLOT_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {SLOT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority (higher = first)</label>
              <input
                type="number"
                value={form.priority || 0}
                onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Yamazaki Distillery Tour - Limited Spots"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (optional)</label>
              <input
                value={form.subtitle || ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Short tagline shown under the title"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Click-through URL (optional)</label>
              <input
                value={form.linkUrl || ''}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f)
                }}
                className="text-sm"
              />
              {uploading && <p className="text-xs text-gray-500 mt-1">Uploading…</p>}
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" className="mt-2 h-20 rounded object-cover" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Starts at (optional)</label>
              <input
                type="datetime-local"
                value={form.startsAt || ''}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ends at (optional)</label>
              <input
                type="datetime-local"
                value={form.endsAt || ''}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() =>
                createMutation.mutate({
                  ...form,
                  startsAt: form.startsAt || undefined,
                  endsAt: form.endsAt || undefined,
                })
              }
              disabled={!form.title || !form.imageUrl || createMutation.isLoading}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        SLOT_ORDER.map((slot) => (
          <section key={slot} className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{SLOT_LABELS[slot]}</h3>
                <p className="text-xs text-gray-500">Slot key: <code>{slot}</code></p>
              </div>
              <span className="text-sm text-gray-500">{grouped[slot].length} banners</span>
            </div>
            {grouped[slot].length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                No banners in this slot
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {grouped[slot].map((b) => (
                  <div key={b.id} className="p-4 flex items-center gap-4">
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="h-16 w-24 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate">{b.title}</h4>
                        {b.linkUrl && (
                          <a href={b.linkUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </a>
                        )}
                      </div>
                      {b.subtitle && <p className="text-sm text-gray-600 truncate">{b.subtitle}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        priority {b.priority} · {b.impressions} impressions · {b.clicks} clicks
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        updateMutation.mutate({ id: b.id, patch: { isActive: !b.isActive } })
                      }
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      title={b.isActive ? 'Hide' : 'Show'}
                    >
                      {b.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${b.title}"?`)) deleteMutation.mutate(b.id)
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  )
}
