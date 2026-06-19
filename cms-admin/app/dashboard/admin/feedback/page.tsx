'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Loader2,
  MessageCircle,
  Bug,
  Lightbulb,
  AlertTriangle,
  Smile,
  Mail,
  Clock,
  CheckCircle2,
  Archive,
  Trash2,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

interface Feedback {
  id: number
  customerId: number | null
  name: string
  email: string
  category: string
  subject: string
  message: string
  status: 'new' | 'in_progress' | 'resolved' | 'archived'
  adminNotes: string | null
  respondedAt: string | null
  createdAt: string
}

interface Stats {
  total: number
  new: number
  inProgress: number
  resolved: number
}

const CATEGORY_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  general: { icon: MessageCircle, label: 'General', color: 'text-gray-600 bg-gray-100' },
  bug: { icon: Bug, label: 'Bug report', color: 'text-red-700 bg-red-100' },
  feature_request: { icon: Lightbulb, label: 'Feature request', color: 'text-blue-700 bg-blue-100' },
  complaint: { icon: AlertTriangle, label: 'Complaint', color: 'text-yellow-700 bg-yellow-100' },
  compliment: { icon: Smile, label: 'Compliment', color: 'text-green-700 bg-green-100' },
}

const STATUS_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800', icon: MessageCircle },
  in_progress: { label: 'In progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-700', icon: Archive },
}

export default function FeedbackPage() {
  const user = auth.getUser()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | Feedback['status']>('all')
  const [openId, setOpenId] = useState<number | null>(null)
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({})

  const { data: items = [], isLoading } = useQuery<Feedback[]>(
    ['admin-feedback', filter],
    async () => {
      const params: Record<string, string> = {}
      if (filter !== 'all') params.status = filter
      return (await api.get('/admin/feedback', { params })).data
    },
    { enabled: user?.role === 'super_admin', refetchInterval: 60000 },
  )

  const { data: stats } = useQuery<Stats>(
    'admin-feedback-stats',
    async () => (await api.get('/admin/feedback/stats')).data,
    { enabled: user?.role === 'super_admin', refetchInterval: 60000 },
  )

  const updateMutation = useMutation(
    async ({ id, patch }: { id: number; patch: Partial<{ status: string; adminNotes: string }> }) =>
      (await api.patch(`/admin/feedback/${id}`, patch)).data,
    {
      onSuccess: () => {
        toast.success('Feedback updated')
        queryClient.invalidateQueries(['admin-feedback', filter])
        queryClient.invalidateQueries('admin-feedback-stats')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Update failed')
      },
    },
  )

  const deleteMutation = useMutation(
    async (id: number) => (await api.delete(`/admin/feedback/${id}`)).data,
    {
      onSuccess: () => {
        toast.success('Feedback deleted')
        queryClient.invalidateQueries(['admin-feedback', filter])
        queryClient.invalidateQueries('admin-feedback-stats')
      },
      onError: () => {
        toast.error('Delete failed')
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
        <h1 className="text-3xl font-bold text-gray-900">Customer Feedback</h1>
        <p className="text-gray-600 mt-1">Everything that comes in through the public feedback form</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} />
          <StatCard label="New" value={stats.new} accent="blue" />
          <StatCard label="In progress" value={stats.inProgress} accent="yellow" />
          <StatCard label="Resolved" value={stats.resolved} accent="green" />
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-2">
        {(['all', 'new', 'in_progress', 'resolved', 'archived'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === f ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_META[f]?.label || f}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-500">{items.length} entries</span>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <MessageCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No feedback yet</p>
            <p className="text-sm text-gray-500 mt-1">
              When customers send feedback, it shows up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {items.map((f) => {
              const category = CATEGORY_META[f.category] || CATEGORY_META.general
              const CategoryIcon = category.icon
              const status = STATUS_META[f.status]
              const StatusIcon = status.icon
              const isOpen = openId === f.id
              const noteDraft = draftNotes[f.id] ?? f.adminNotes ?? ''

              return (
                <li key={f.id} className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${category.color}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{f.subject}</p>
                        <p className="text-xs text-gray-500">
                          {f.name} · <a href={`mailto:${f.email}`} className="text-primary-600 hover:underline">{f.email}</a> ·{' '}
                          {new Date(f.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                    {isOpen ? f.message : f.message.length > 240 ? f.message.slice(0, 240) + '…' : f.message}
                  </p>
                  {f.message.length > 240 && (
                    <button
                      onClick={() => setOpenId(isOpen ? null : f.id)}
                      className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                    >
                      {isOpen ? 'Show less' : 'Read full message'}
                    </button>
                  )}

                  {/* Actions row */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {f.status !== 'in_progress' && (
                      <button
                        onClick={() => updateMutation.mutate({ id: f.id, patch: { status: 'in_progress' } })}
                        className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200"
                      >
                        Mark in progress
                      </button>
                    )}
                    {f.status !== 'resolved' && (
                      <button
                        onClick={() => updateMutation.mutate({ id: f.id, patch: { status: 'resolved' } })}
                        className="text-xs px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                      >
                        Mark resolved
                      </button>
                    )}
                    {f.status !== 'archived' && (
                      <button
                        onClick={() => updateMutation.mutate({ id: f.id, patch: { status: 'archived' } })}
                        className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Archive
                      </button>
                    )}
                    <a
                      href={`mailto:${f.email}?subject=Re: ${encodeURIComponent(f.subject)}`}
                      className="text-xs px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 inline-flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      Reply by email
                    </a>
                    <button
                      onClick={() => {
                        if (confirm('Delete this feedback? This is permanent.')) deleteMutation.mutate(f.id)
                      }}
                      className="text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 inline-flex items-center gap-1 ml-auto"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>

                  {/* Internal notes */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-1">Internal notes (not visible to customer)</p>
                    <textarea
                      value={noteDraft}
                      onChange={(e) =>
                        setDraftNotes((d) => ({ ...d, [f.id]: e.target.value }))
                      }
                      placeholder="Notes for your team — what was done, who was contacted…"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    {noteDraft !== (f.adminNotes || '') && (
                      <button
                        onClick={() =>
                          updateMutation.mutate({ id: f.id, patch: { adminNotes: noteDraft } })
                        }
                        className="mt-2 text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg inline-flex items-center gap-1"
                      >
                        <Save className="h-3 w-3" />
                        Save note
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'blue' | 'yellow' | 'green' }) {
  const accentClass =
    accent === 'blue'
      ? 'text-blue-700'
      : accent === 'yellow'
      ? 'text-yellow-700'
      : accent === 'green'
      ? 'text-green-700'
      : 'text-gray-900'
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accentClass}`}>{value}</p>
    </div>
  )
}
