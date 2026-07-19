'use client'

import { useState } from 'react'
import { BadgeCheck, Loader2, Store } from 'lucide-react'
import { api } from '../lib/api'

/**
 * "Own this business? Claim it."
 *
 * Shown only on listings with no owner — you can't claim something already
 * managed by someone. The form is deliberately public: a real owner taking over
 * a listing we seeded shouldn't have to create an account just to raise their
 * hand. An admin reviews the claim and, on approval, hands the listing over.
 */
export default function ClaimListing({
  entityType,
  entityId,
  listingName,
}: {
  entityType: 'bar' | 'distillery' | 'event'
  entityId: number
  listingName: string
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ claimantName: '', claimantEmail: '', claimantPhone: '', message: '' })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.post('/claims', {
        entityType,
        entityId,
        claimantName: form.claimantName.trim(),
        claimantEmail: form.claimantEmail.trim(),
        claimantPhone: form.claimantPhone.trim() || undefined,
        message: form.message.trim() || undefined,
      })
      setDone(true)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Could not send that claim. Please try again, or email us.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-status-success/30 bg-status-successSoft p-5">
        <div className="flex items-center gap-2 text-status-success">
          <BadgeCheck className="h-5 w-5" />
          <p className="font-semibold">Claim received</p>
        </div>
        <p className="mt-1 text-sm text-charcoal-600">
          We&apos;ll review it and be in touch at {form.claimantEmail}. Once approved, you&apos;ll be able
          to manage {listingName}.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-charcoal-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-whisky-50 text-whisky-600">
          <Store className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">Own this business?</p>
          <p className="text-sm text-charcoal-600">
            Claim {listingName} to manage its details, photos and bookings.
          </p>
        </div>
      </div>

      {!open ? (
        <button onClick={() => setOpen(true)} className="btn-secondary mt-4 w-full sm:w-auto">
          Claim this listing
        </button>
      ) : (
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              value={form.claimantName}
              onChange={set('claimantName')}
              placeholder="Your name"
              className="input-field"
            />
            <input
              required
              type="email"
              value={form.claimantEmail}
              onChange={set('claimantEmail')}
              placeholder="Business email"
              className="input-field"
            />
          </div>
          <input
            value={form.claimantPhone}
            onChange={set('claimantPhone')}
            placeholder="Phone (optional)"
            className="input-field"
          />
          <textarea
            value={form.message}
            onChange={set('message')}
            rows={3}
            placeholder="Tell us how you're connected to this business (optional but helps us verify)."
            className="input-field"
          />

          {error && (
            <p role="alert" className="text-sm text-status-danger">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit claim'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
          <p className="text-xs text-charcoal-500">
            We verify claims before granting access — this doesn&apos;t change anything on the site
            until an admin approves it.
          </p>
        </form>
      )}
    </div>
  )
}
