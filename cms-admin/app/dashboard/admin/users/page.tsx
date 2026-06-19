'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Loader2,
  ShieldCheck,
  User as UserIcon,
  PauseCircle,
  PlayCircle,
  UserPlus,
  Crown,
  Mail,
  X,
  Save,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'super_admin'
  isActive: boolean
  passwordSetAt: string | null
  inviteAccepted: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const me = auth.getUser()
  const queryClient = useQueryClient()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'admin' as 'admin' | 'super_admin',
  })

  const { data: users = [], isLoading } = useQuery<AdminUser[]>(
    'admin-users',
    async () => (await api.get('/admin/users')).data,
    { enabled: me?.role === 'super_admin' },
  )

  const inviteMutation = useMutation(
    async () => (await api.post('/auth/admin/invite', inviteForm)).data,
    {
      onSuccess: (data) => {
        toast.success(data.message || 'Invite sent')
        if (data.emailSent === false) {
          toast('Email did not send — SMTP may be unconfigured. Share the invite link manually.', { icon: '⚠️' })
        }
        setShowInvite(false)
        setInviteForm({ email: '', firstName: '', lastName: '', role: 'admin' })
        queryClient.invalidateQueries('admin-users')
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message
        toast.error(Array.isArray(msg) ? msg[0] : msg || 'Invite failed')
        return undefined
      },
    },
  )

  const roleMutation = useMutation(
    async ({ id, role }: { id: number; role: string }) =>
      (await api.patch(`/admin/users/${id}/role`, { role })).data,
    {
      onSuccess: (_, vars) => {
        toast.success(`Role updated to ${vars.role}`)
        queryClient.invalidateQueries('admin-users')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Role change failed')
      },
    },
  )

  const activeMutation = useMutation(
    async ({ id, isActive }: { id: number; isActive: boolean }) =>
      (await api.patch(`/admin/users/${id}/active`, { isActive })).data,
    {
      onSuccess: (_, vars) => {
        toast.success(vars.isActive ? 'Re-activated' : 'Suspended')
        queryClient.invalidateQueries('admin-users')
      },
      onError: (err: any) => {
        toast.error(err.response?.data?.message || 'Update failed')
      },
    },
  )

  if (me?.role !== 'super_admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">SuperAdmin only</p>
      </div>
    )
  }

  const superAdminCount = users.filter((u) => u.role === 'super_admin').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team & Admins</h1>
          <p className="text-gray-600 mt-1">Invite admins, change roles, suspend accounts.</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg inline-flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Invite admin
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2 text-sm">
        <ShieldCheck className="h-5 w-5 text-yellow-700 mt-0.5 flex-shrink-0" />
        <p className="text-yellow-900">
          The platform always needs at least one active SuperAdmin. You can&apos;t demote or suspend yourself,
          and the last SuperAdmin can&apos;t be demoted — promote someone else first.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <UserIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">No admin users yet</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Person</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invite</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => {
                const isSelf = me?.id === u.id
                const isLastSA = u.role === 'super_admin' && superAdminCount <= 1
                return (
                  <tr key={u.id}>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {u.firstName} {u.lastName}
                        {isSelf && <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">you</span>}
                      </div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${
                          u.role === 'super_admin'
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {u.role === 'super_admin' && <Crown className="h-3 w-3" />}
                        {u.role === 'super_admin' ? 'SuperAdmin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {u.inviteAccepted ? (
                        <span className="text-green-700">Accepted</span>
                      ) : (
                        <span className="text-yellow-700">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Active</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-200 text-gray-700">Suspended</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        {/* Promote to SuperAdmin */}
                        {u.role === 'admin' && !isSelf && (
                          <button
                            title="Promote to SuperAdmin"
                            onClick={() => {
                              if (!confirm(`Promote ${u.email} to SuperAdmin?`)) return
                              roleMutation.mutate({ id: u.id, role: 'super_admin' })
                            }}
                            disabled={roleMutation.isLoading}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50"
                          >
                            <Crown className="h-4 w-4" />
                          </button>
                        )}
                        {/* Demote SuperAdmin to Admin */}
                        {u.role === 'super_admin' && !isSelf && !isLastSA && (
                          <button
                            title="Demote to Admin"
                            onClick={() => {
                              if (!confirm(`Demote ${u.email} to Admin?`)) return
                              roleMutation.mutate({ id: u.id, role: 'admin' })
                            }}
                            disabled={roleMutation.isLoading}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                          >
                            <UserIcon className="h-4 w-4" />
                          </button>
                        )}
                        {/* Suspend / re-activate */}
                        {!isSelf && (u.isActive ? (
                          <button
                            title="Suspend"
                            onClick={() => {
                              if (!confirm(`Suspend ${u.email}? They will no longer be able to sign in.`)) return
                              activeMutation.mutate({ id: u.id, isActive: false })
                            }}
                            disabled={activeMutation.isLoading || isLastSA}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <PauseCircle className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            title="Re-activate"
                            onClick={() => activeMutation.mutate({ id: u.id, isActive: true })}
                            disabled={activeMutation.isLoading}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                          >
                            <PlayCircle className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowInvite(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invite a new admin</h3>
              <button onClick={() => setShowInvite(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                inviteMutation.mutate()
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                  <input
                    required
                    value={inviteForm.firstName}
                    onChange={(e) => setInviteForm({ ...inviteForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                  <input
                    required
                    value={inviteForm.lastName}
                    onChange={(e) => setInviteForm({ ...inviteForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  They&apos;ll get an email with a link to set their password. Expires in 24 hours.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="admin">Admin (manages content, vendors, orders)</option>
                  <option value="super_admin">SuperAdmin (full platform control)</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isLoading}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {inviteMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Send invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
