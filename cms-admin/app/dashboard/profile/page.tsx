'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'react-query'
import {
  User as UserIcon,
  Mail,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Shield,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { roleLabels } from '@/lib/roles'

type Tab = 'profile' | 'password'

export default function ProfilePage() {
  const localUser = auth.getUser()
  const [tab, setTab] = useState<Tab>('profile')

  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' })
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwShow, setPwShow] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const { data: me, isLoading } = useQuery(
    'me',
    async () => (await api.get('/auth/me')).data,
    { enabled: !!localUser },
  )

  useEffect(() => {
    if (me) {
      setProfile({
        firstName: me.firstName || '',
        lastName: me.lastName || '',
        email: me.email || '',
      })
    }
  }, [me])

  const profileMutation = useMutation(
    async () =>
      (
        await api.patch('/auth/me', {
          firstName: profile.firstName.trim() || undefined,
          lastName: profile.lastName.trim() || undefined,
          email: profile.email.trim(),
        })
      ).data,
    {
      onSuccess: (updated) => {
        // Sync the locally cached user so the sidebar avatar / Header refresh.
        if (updated && localUser) {
          auth.setAuth(auth.getToken() || '', {
            ...localUser,
            firstName: updated.firstName,
            lastName: updated.lastName,
            email: updated.email,
          })
        }
        setProfileSaved(true)
        setTimeout(() => setProfileSaved(false), 4000)
        toast.success('Profile updated')
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message
        setProfileError(Array.isArray(msg) ? msg.join(' • ') : msg || 'Could not save.')
      },
    },
  )

  const passwordMutation = useMutation(
    async () =>
      (
        await api.post('/auth/change-password', {
          currentPassword: pw.currentPassword,
          newPassword: pw.newPassword,
        })
      ).data,
    {
      onSuccess: () => {
        setPw({ currentPassword: '', newPassword: '', confirm: '' })
        setPwSaved(true)
        setTimeout(() => setPwSaved(false), 4000)
        toast.success('Password updated')
      },
      onError: (err: any) => {
        const msg = err.response?.data?.message
        setPwError(Array.isArray(msg) ? msg.join(' • ') : msg || 'Could not change password.')
      },
    },
  )

  if (!localUser) {
    return (
      <div className="p-6">
        <p className="text-gray-700">Please sign in.</p>
      </div>
    )
  }

  const initials = `${profile.firstName[0] || ''}${profile.lastName[0] || ''}` || 'A'

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-xl font-bold uppercase">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {profile.firstName} {profile.lastName} ·{' '}
            <span className="inline-flex items-center gap-1 text-primary-700 font-medium">
              <Shield className="h-3.5 w-3.5" />
              {roleLabels[localUser.role] || localUser.role}
            </span>
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
          <UserIcon className="h-4 w-4" />
          Profile
        </TabButton>
        <TabButton active={tab === 'password'} onClick={() => setTab('password')}>
          <Lock className="h-4 w-4" />
          Password
        </TabButton>
      </div>

      {tab === 'profile' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setProfileError(null)
            profileMutation.mutate()
          }}
          className="bg-white rounded-lg shadow p-6 space-y-4 max-w-2xl"
        >
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="First name"
                  icon={UserIcon}
                  value={profile.firstName}
                  onChange={(v) => setProfile({ ...profile, firstName: v })}
                />
                <Field
                  label="Last name"
                  icon={UserIcon}
                  value={profile.lastName}
                  onChange={(v) => setProfile({ ...profile, lastName: v })}
                />
              </div>
              <Field
                label="Email"
                icon={Mail}
                type="email"
                value={profile.email}
                onChange={(v) => setProfile({ ...profile, email: v })}
              />

              {profileError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{profileError}</div>
              )}
              {profileSaved && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved.
                </div>
              )}

              <button
                type="submit"
                disabled={profileMutation.isLoading}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
              >
                {profileMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            </>
          )}
        </form>
      )}

      {tab === 'password' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setPwError(null)
            if (pw.newPassword.length < 6) {
              setPwError('New password must be at least 6 characters.')
              return
            }
            if (pw.newPassword !== pw.confirm) {
              setPwError('New password and confirmation do not match.')
              return
            }
            passwordMutation.mutate()
          }}
          className="bg-white rounded-lg shadow p-6 space-y-4 max-w-2xl"
        >
          <PasswordField
            label="Current password"
            value={pw.currentPassword}
            onChange={(v) => setPw({ ...pw, currentPassword: v })}
            show={pwShow}
            onShow={() => setPwShow(!pwShow)}
          />
          <PasswordField
            label="New password"
            value={pw.newPassword}
            onChange={(v) => setPw({ ...pw, newPassword: v })}
            show={pwShow}
            hint="At least 6 characters"
          />
          <PasswordField
            label="Confirm new password"
            value={pw.confirm}
            onChange={(v) => setPw({ ...pw, confirm: v })}
            show={pwShow}
          />

          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{pwError}</div>
          )}
          {pwSaved && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Password updated.
            </div>
          )}

          <button
            type="submit"
            disabled={passwordMutation.isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg disabled:opacity-50"
          >
            {passwordMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
            Update password
          </button>
        </form>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 ${
        active ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  icon: Icon,
  type = 'text',
  value,
  onChange,
}: {
  label: string
  icon: React.ElementType
  type?: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>
    </div>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  onShow,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onShow?: () => void
  hint?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {onShow && (
          <button
            type="button"
            onClick={onShow}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary-500"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  )
}
