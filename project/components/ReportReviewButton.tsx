'use client'

import { useState } from 'react'
import { Flag, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

const REASONS = [
  { value: 'fake', label: "It's fake", hint: "This didn't happen, or it's not a real guest." },
  { value: 'spam', label: 'Spam or advertising', hint: 'Promoting something, or posted repeatedly.' },
  { value: 'harassment', label: 'Harassment or abuse', hint: 'Attacks a person, or is hateful.' },
  { value: 'other', label: 'Something else', hint: 'Tell us below.' },
] as const

/**
 * Reporting a review.
 *
 * Quiet by design — a prominent "report" on every review invites use as a
 * weapon against unflattering ones. It's there for the person who genuinely
 * needs it, not advertised to everyone reading.
 */
export default function ReportReviewButton({ reviewId }: { reviewId: number }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('fake')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    try {
      await api.post(`/reviews/${reviewId}/report`, { reason, note: note.trim() || undefined })
      setDone(true)
      setOpen(false)
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Could not send that report. Please try again, or email us.',
      )
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <p className="mt-3 text-xs text-charcoal-500">
        Thanks — we&apos;ve hidden this review while we look at it.
      </p>
    )
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-charcoal-400 transition-colors hover:text-charcoal-700"
        >
          <Flag className="h-3 w-3" />
          Report
        </button>
      ) : (
        <div className="rounded-xl border border-charcoal-200 bg-cream p-4">
          <p className="text-sm font-semibold text-ink">What&apos;s wrong with this review?</p>

          <div className="mt-3 space-y-2">
            {REASONS.map((r) => (
              <label key={r.value} className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="radio"
                  name={`report-${reviewId}`}
                  value={r.value}
                  checked={reason === r.value}
                  onChange={() => setReason(r.value)}
                  className="mt-1 accent-whisky-500"
                />
                <span>
                  <span className="block text-sm text-ink">{r.label}</span>
                  <span className="block text-xs text-charcoal-500">{r.hint}</span>
                </span>
              </label>
            ))}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Anything else we should know? (optional)"
            className="input-field mt-3 text-sm"
          />

          {error && (
            <p role="alert" className="mt-2 text-xs text-status-danger">
              {error}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button type="button" onClick={submit} disabled={busy} className="btn-primary text-sm">
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3.5 w-3.5" />}
              Send report
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-charcoal-500">
            We hide a reported review while we look at it, and put it back if the report
            doesn&apos;t hold up. We don&apos;t remove reviews for being negative.
          </p>
        </div>
      )}
    </div>
  )
}
