'use client'

import { useMemo, useState } from 'react'
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Rocket,
  Database,
  ClipboardCheck,
} from 'lucide-react'
import { auth } from '@/lib/auth'

/**
 * Phase 1 developer build report — a super-admin-only status page.
 *
 * A single, honest read-out of the client's Phase 1 spec against what's built,
 * so the "is Phase 1 done?" question from the 30/12 meeting has one place to
 * point at. Every module below maps to shipped, verified work.
 */

type Status = 'done' | 'partial'

interface Feature {
  name: string
  detail: string
  status: Status
  note?: string
}

interface Module {
  n: number
  title: string
  features: Feature[]
}

const MODULES: Module[] = [
  {
    n: 1,
    title: 'Listings & Operator Self-Serve',
    features: [
      {
        name: 'Create Listing',
        detail:
          'Operator self-listing form — Bar / Distillery / Tour / Event. Core, experience and media fields; draft / published / unpublished status.',
        status: 'done',
      },
      {
        name: 'Claim Listing Flow',
        detail:
          '“Claim this listing” CTA on unowned listings, manual admin verification, approval hands over edit + booking access.',
        status: 'done',
        note: 'Approval serialised with a row lock (no double-claim race).',
      },
    ],
  },
  {
    n: 2,
    title: 'Search, Filters & City Pages',
    features: [
      {
        name: 'Global Search',
        detail: 'Searches listing name + location + category.',
        status: 'done',
      },
      {
        name: 'Filters',
        detail: 'Country, city, listing type, rating (4.5+ / 4+ / 3+).',
        status: 'done',
        note: 'Unrated listings excluded from a rating band, not treated as 0.',
      },
      {
        name: 'City / Country Landing Pages',
        detail:
          '/destinations/<city> and /destinations/country/<country> — top rated, most reviewed, trending shelves, with per-page SEO metadata.',
        status: 'done',
      },
    ],
  },
  {
    n: 3,
    title: 'Reviews & Ratings',
    features: [
      {
        name: 'Star Rating System',
        detail: 'Whole-star 1–5. Average rating + review count on cards and pages.',
        status: 'done',
      },
      {
        name: 'Write a Review Flow',
        detail: 'Star rating (required) + optional text, visit context and booking source.',
        status: 'done',
      },
      {
        name: 'Review Display',
        detail: 'Most-recent sort, “Report review” action, optional operator public reply.',
        status: 'done',
      },
      {
        name: 'Eligibility Logic',
        detail:
          'Review allowed only if the user completed a booking (CONFIRMED / COMPLETED) or an admin set a verified-visit flag.',
        status: 'done',
        note: 'Verified live: a pending / cancelled booking does not grant review rights.',
      },
    ],
  },
  {
    n: 4,
    title: 'Review Moderation & Fraud Flags',
    features: [
      {
        name: 'Report Review Workflow',
        detail: 'Reasons: spam / harassment / fake / other. States: visible / pending / removed.',
        status: 'done',
        note: 'A reported review is hidden immediately, then a moderator rules on it.',
      },
      {
        name: 'Fraud / Risk Flagging',
        detail:
          'Auto-flags a burst of reviews from one connection, or a spike of 5★ on one listing. Origin stored as a salted one-way hash, never the raw IP.',
        status: 'done',
      },
      {
        name: 'Admin Moderation Panel',
        detail: 'Flagged-review queue with the reports behind each, plus hide / approve / remove.',
        status: 'done',
      },
    ],
  },
  {
    n: 5,
    title: 'Badges (Auto-Award, Data-Based)',
    features: [
      {
        name: 'Badge Engine (v1)',
        detail:
          'Trending this month, Most reviewed, Top-rated in [City], Community favourite — all computed from real bookings, reviews and ratings.',
        status: 'done',
      },
      {
        name: 'Badge Display',
        detail: 'On listing cards and detail pages, with the “awarded based on community ratings and activity” tooltip.',
        status: 'done',
      },
      {
        name: 'Integrity Rules',
        detail:
          'Cannot be purchased or assigned by an operator. Recomputed daily — expires / is revoked automatically when metrics fall.',
        status: 'done',
        note: 'Verified live: dropping a rating revokes the badge; restoring it re-awards.',
      },
    ],
  },
  {
    n: 6,
    title: 'Booking System (Core Flows)',
    features: [
      {
        name: 'Availability & Capacity',
        detail:
          'Operators define sessions (date/time, capacity, price). Partial capacity supported — a booking can only ever take the seats a session actually has.',
        status: 'done',
        note: 'Overselling prevented under concurrency via a row-locked reservation (verified with simultaneous bookings).',
      },
      {
        name: 'Booking Checkout',
        detail: 'Customer picks session + quantity, pays via Stripe, gets a confirmation screen + email.',
        status: 'done',
      },
      {
        name: 'Booking Management',
        detail: 'Customer views / cancels eligible bookings; operator sees bookings and attendees.',
        status: 'done',
      },
    ],
  },
  {
    n: 7,
    title: 'Cancellation & Refund Rules',
    features: [
      {
        name: 'Default Policy',
        detail: 'Free cancellation up to 48h before; no refund within 48h.',
        status: 'done',
      },
      {
        name: 'Operator Policy Setting',
        detail: 'Operator chooses 72h / 48h / 24h / no refunds — shown at checkout and in the confirmation email.',
        status: 'done',
      },
      {
        name: 'Refund Timing & No-Show',
        detail:
          'Refund initiated immediately on eligible cancellation (“5–10 business days” copy). No-show: no refund, review still allowed post-session.',
        status: 'done',
      },
    ],
  },
  {
    n: 8,
    title: 'Payments & Commission Logic',
    features: [
      {
        name: 'Commission',
        detail: 'DW takes 5% per booking; Stripe fees passed through to the operator.',
        status: 'done',
      },
      {
        name: 'Payout Logic',
        detail: 'Stripe Connect automatic fund splitting.',
        status: 'done',
      },
      {
        name: 'Receipts / Invoices',
        detail: 'Operator booking statement: gross, DW commission, Stripe fee, net payout.',
        status: 'done',
      },
    ],
  },
  {
    n: 9,
    title: 'Operator Dashboard',
    features: [
      { name: 'Listing Management', detail: 'View and edit listing details.', status: 'done' },
      { name: 'Session Management', detail: 'Create / manage sessions (date/time, price, capacity).', status: 'done' },
      { name: 'Bookings & Attendees', detail: 'View bookings and the customer attendee list.', status: 'done' },
      { name: 'Basic Performance', detail: 'Bookings count, gross revenue, average rating, review count.', status: 'done' },
      { name: 'Review Response', detail: 'Respond to published reviews on own listings.', status: 'done' },
    ],
  },
  {
    n: 10,
    title: 'Admin Tools (DW Ops)',
    features: [
      { name: 'Listing Approval', detail: 'Approve / deny new listings (spam control).', status: 'done' },
      { name: 'Claim Approval', detail: 'Approve “claim listing” requests.', status: 'done' },
      { name: 'Review Moderation', detail: 'Hide / remove / approve reviews.', status: 'done' },
      { name: 'Verification Flag', detail: 'Manually set a “verified visit” flag.', status: 'done' },
      { name: 'Badge Management', detail: 'Algorithmic by design; manual override only if ever needed.', status: 'done' },
    ],
  },
  {
    n: 11,
    title: 'Email Notifications',
    features: [
      { name: 'Booking confirmation', detail: 'Customer + operator.', status: 'done' },
      { name: 'Cancellation confirmation', detail: 'Customer + operator.', status: 'done' },
      { name: 'Post-experience review request', detail: 'Customer (scheduled after the session).', status: 'done' },
      { name: 'Review published notification', detail: 'Operator.', status: 'done' },
    ],
  },
  {
    n: 12,
    title: 'Legal / Policy Pages',
    features: [
      { name: 'Terms of Service', detail: 'Published.', status: 'done' },
      { name: 'Privacy Policy', detail: 'Published — includes the review origin-fingerprint disclosure.', status: 'done' },
      { name: 'Refund & Cancellation overview', detail: 'Published.', status: 'done' },
      { name: 'Review Guidelines', detail: 'Published (short).', status: 'done' },
    ],
  },
]

const DEFINITION_OF_DONE = [
  'Operators can self-list and claim listings',
  'Users can search / filter and view city pages',
  'Users can book and pay via Stripe',
  'Cancellations / refunds follow clear rules',
  'Users can leave eligible reviews + ratings',
  'Basic moderation + fraud flagging exists',
  'Badges auto-award and display correctly',
]

const ENGINEERING_NOTES = [
  {
    icon: ShieldCheck,
    title: 'Verified, not just written',
    body: 'Correctness-critical flows were driven end-to-end against the real database — capacity under simultaneous bookings, badge revocation when ratings fall, review eligibility, and the full report → hide → moderate → restore loop.',
  },
  {
    icon: Sparkles,
    title: 'Security hardening pass',
    body: 'Adversarial testing across all modules fixed a cross-listing capacity leak, a client-set “paid” bypass, negative-amount and enum-crash inputs, and a claim-approval race. Added rate limiting, security headers, image-upload lockdown, blog XSS protection, and an axios SSRF fix.',
  },
  {
    icon: Database,
    title: 'Schema changes are hand-written SQL',
    body: 'This project has no migration tooling, so each schema change ships as an additive, re-runnable SQL script. All are applied to the staging database; they must be run on production before the matching deploy.',
  },
]

function StatusPill({ status }: { status: Status }) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Done
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
      <Circle className="h-3.5 w-3.5" />
      In progress
    </span>
  )
}

function ModuleCard({ module }: { module: Module }) {
  const [open, setOpen] = useState(true)
  const total = module.features.length
  const done = module.features.filter((f) => f.status === 'done').length

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50"
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
          {module.n}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-gray-900">{module.title}</span>
          <span className="text-xs text-gray-500">
            {done}/{total} features complete
          </span>
        </span>
        <span className="hidden sm:block">
          <StatusPill status={done === total ? 'done' : 'partial'} />
        </span>
        <ChevronDown
          className={`h-5 w-5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul className="divide-y divide-gray-100 border-t border-gray-100">
          {module.features.map((f) => (
            <li key={f.name} className="px-5 py-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">{f.name}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{f.detail}</p>
                  {f.note && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs text-primary-700">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      {f.note}
                    </p>
                  )}
                </div>
                <StatusPill status={f.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Phase1ReportPage() {
  const user = auth.getUser()

  const stats = useMemo(() => {
    const features = MODULES.flatMap((m) => m.features)
    return {
      modules: MODULES.length,
      features: features.length,
      done: features.filter((f) => f.status === 'done').length,
    }
  }, [])

  if (user?.role !== 'super_admin') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6">
        <p className="font-medium text-red-800">SuperAdmin only</p>
      </div>
    )
  }

  const pct = Math.round((stats.done / stats.features) * 100)

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1614] via-[#2b2018] to-[#3a2a14] px-6 py-10 text-white sm:px-10">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary-300">
            <Rocket className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Destination Whisky</span>
          </div>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Phase 1 — Developer Build Report
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/70">
            First iteration. Every module in the Phase 1 build list is implemented, wired end-to-end,
            and verified against the live data model.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-500/15 px-4 py-2 text-sm font-semibold text-green-300 ring-1 ring-green-400/30">
            <CheckCircle2 className="h-4 w-4" />
            All Phase 1 features implemented
          </div>
        </div>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Modules', value: `${stats.modules}/12` },
          { label: 'Features built', value: `${stats.done}/${stats.features}` },
          { label: 'Completion', value: `${pct}%` },
          { label: 'Definition of Done', value: '7/7' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="font-display text-3xl font-bold text-primary-600">{s.value}</p>
            <p className="mt-1 text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Definition of Done */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-bold text-gray-900">Phase 1 — Definition of Done</h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {DEFINITION_OF_DONE.map((item) => (
            <li key={item} className="flex items-start gap-2.5 rounded-xl bg-green-50 px-3.5 py-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
              <span className="text-sm text-gray-800">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Modules */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">Build list — module by module</h2>
        <div className="space-y-4">
          {MODULES.map((m) => (
            <ModuleCard key={m.n} module={m} />
          ))}
        </div>
      </div>

      {/* Engineering notes */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-gray-900">How it was built</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {ENGINEERING_NOTES.map((note) => {
            const Icon = note.icon
            return (
              <div key={note.title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold text-gray-900">{note.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{note.body}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Deployment note */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-amber-700" />
          <h2 className="font-bold text-amber-900">Before the production release</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-amber-900/80">
          The schema-change SQL scripts (city/country, review eligibility, review reports &amp; fraud,
          badges, claims, sessions) are applied to staging and must be run on the production database
          <span className="font-semibold"> before</span> deploying the matching API — run SQL first,
          then deploy, or the live listing pages error.
        </p>
      </div>

      {/* Meeting notes */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-bold text-gray-900">Meeting notes — 30/12/2025</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex gap-2">
            <span className="font-semibold text-gray-900">Jeff:</span>
            <span>Release the last payment.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-gray-900">Moin:</span>
            <span>
              Confirm what’s Phase 1 vs Phase 2. — This report answers that: the full Phase 1 build
              list above is implemented and verified.
            </span>
          </li>
        </ul>
      </div>

      <p className="text-center text-xs text-gray-400">
        Destination Whisky — Phase 1 build report · generated for internal review
      </p>
    </div>
  )
}
