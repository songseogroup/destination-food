'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Save,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { api } from '../../lib/api'
import { useCustomerAuth } from '../../contexts/CustomerAuthContext'

type Tab = 'profile' | 'password'

export default function AccountPage() {
  const router = useRouter()
  const { customer, isAuthenticated, isLoading: authLoading } = useCustomerAuth()
  const [tab, setTab] = useState<Tab>('profile')

  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [pwShow, setPwShow] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)

  // Redirect to login if not authenticated.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/auth/login')
  }, [authLoading, isAuthenticated, router])

  // Initial load — pull the fresh row from the backend so we render the
  // canonical state (auth context can be stale).
  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    setProfileLoading(true)
    api
      .get('/customers/me')
      .then((res) => {
        if (cancelled) return
        setProfile({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
        })
      })
      .catch(() => {
        if (!cancelled && customer) {
          setProfile({
            firstName: customer.firstName || '',
            lastName: customer.lastName || '',
            email: customer.email || '',
            phone: (customer as any).phone || '',
          })
        }
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, customer])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSaved(false)
    setProfileSaving(true)
    try {
      await api.patch('/customers/me', {
        firstName: profile.firstName.trim() || undefined,
        lastName: profile.lastName.trim() || undefined,
        email: profile.email.trim(),
        phone: profile.phone.trim() || undefined,
      })
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 4000)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setProfileError(Array.isArray(msg) ? msg.join(' • ') : msg || 'Could not save changes.')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSaved(false)
    if (pw.newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.')
      return
    }
    if (pw.newPassword !== pw.confirm) {
      setPwError('New password and confirmation do not match.')
      return
    }
    setPwSaving(true)
    try {
      await api.post('/customers/me/change-password', {
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      })
      setPwSaved(true)
      setPw({ currentPassword: '', newPassword: '', confirm: '' })
      setTimeout(() => setPwSaved(false), 4000)
    } catch (err: any) {
      const msg = err.response?.data?.message
      setPwError(Array.isArray(msg) ? msg.join(' • ') : msg || 'Could not change password.')
    } finally {
      setPwSaving(false)
    }
  }

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-charcoal-400" />
      </div>
    )
  }

  const initials = `${profile.firstName[0] || ''}${profile.lastName[0] || ''}` || 'D'

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header card */}
        <div className="card p-6 flex items-center gap-5 mb-8">
          <div className="w-16 h-16 rounded-full bg-whisky-500 text-white flex items-center justify-center text-xl font-bold uppercase shadow-gold">
            {initials}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">My Account</h1>
            <p className="text-sm text-charcoal-500 mt-0.5">
              {profile.firstName} {profile.lastName} · {profile.email}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-charcoal-200">
          <TabButton active={tab === 'profile'} onClick={() => setTab('profile')}>
            <UserIcon className="h-4 w-4" />
            Profile
          </TabButton>
          <TabButton active={tab === 'password'} onClick={() => setTab('password')}>
            <Lock className="h-4 w-4" />
            Password
          </TabButton>
        </div>

        {tab === 'profile' &&
          (profileLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-charcoal-400" />
            </div>
          ) : (
            <form onSubmit={handleProfileSave} className="card p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="First name"
                  icon={UserIcon}
                  value={profile.firstName}
                  onChange={(v) => setProfile({ ...profile, firstName: v })}
                  placeholder="First"
                />
                <Field
                  label="Last name"
                  icon={UserIcon}
                  value={profile.lastName}
                  onChange={(v) => setProfile({ ...profile, lastName: v })}
                  placeholder="Last"
                />
              </div>
              <Field
                label="Email"
                icon={Mail}
                type="email"
                value={profile.email}
                onChange={(v) => setProfile({ ...profile, email: v })}
                placeholder="you@example.com"
              />
              <Field
                label="Phone"
                icon={Phone}
                value={profile.phone}
                onChange={(v) => setProfile({ ...profile, phone: v })}
                placeholder="+1 555 123 4567"
              />

              {profileError && (
                <div
                  role="alert"
                  className="rounded-xl border border-status-danger/25 bg-status-dangerSoft px-3 py-2 text-sm text-status-danger"
                >
                  {profileError}
                </div>
              )}
              {profileSaved && (
                <div className="flex items-center gap-2 rounded-xl border border-status-success/25 bg-status-successSoft px-3 py-2 text-sm text-status-success">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved.
                </div>
              )}

              <button type="submit" disabled={profileSaving} className="btn-primary px-5 py-2.5">
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save changes
              </button>
            </form>
          ))}

        {tab === 'password' && (
          <form onSubmit={handlePasswordSave} className="card p-6 space-y-5">
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
              <div
                role="alert"
                className="rounded-xl border border-status-danger/25 bg-status-dangerSoft px-3 py-2 text-sm text-status-danger"
              >
                {pwError}
              </div>
            )}
            {pwSaved && (
              <div className="flex items-center gap-2 rounded-xl border border-status-success/25 bg-status-successSoft px-3 py-2 text-sm text-status-success">
                <CheckCircle2 className="h-4 w-4" />
                Password updated.
              </div>
            )}

            <button type="submit" disabled={pwSaving} className="btn-primary px-5 py-2.5">
              {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
              Update password
            </button>
          </form>
        )}
      </main>
      <Footer />
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
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px flex items-center gap-2 transition-colors ${
        active
          ? 'border-whisky-500 text-whisky-700'
          : 'border-transparent text-charcoal-500 hover:text-ink'
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
  placeholder,
}: {
  label: string
  icon: React.ElementType
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-10"
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
      <label className="label">{label}</label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input-field pl-10 pr-11"
        />
        {onShow && (
          <button
            type="button"
            onClick={onShow}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 transition-colors hover:text-whisky-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-charcoal-500">{hint}</p>}
    </div>
  )
}
