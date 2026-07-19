import { CheckCircle2 } from 'lucide-react'

/**
 * Standalone Phase 1 report — top-level route (portal.destinationwhisky.life/phase-1).
 *
 * Sits outside /dashboard on purpose, so it renders on its own with no sidebar,
 * no nav and no login wall — the URL shows the report and nothing else. Kept out
 * of search with robots noindex; nothing links to it.
 */
export const metadata = {
  title: 'Destination Whisky — Phase 1 Build Report',
  robots: { index: false, follow: false },
}

interface Feature {
  name: string
  detail: string
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
      { name: 'Create Listing', detail: 'Operator self-listing form — Bar / Distillery / Tour / Event, with core, experience and media fields and draft / published / unpublished status.' },
      { name: 'Claim Listing Flow', detail: '“Claim this listing” on unowned listings, manual admin verification, approval hands over edit + booking access.' },
    ],
  },
  {
    n: 2,
    title: 'Search, Filters & City Pages',
    features: [
      { name: 'Global Search', detail: 'Across listing name, location and category.' },
      { name: 'Filters', detail: 'Country, city, listing type, and rating (4.5+ / 4+ / 3+).' },
      { name: 'City / Country Landing Pages', detail: 'Dedicated destination pages with top-rated, most-reviewed and trending shelves, and per-page SEO metadata.' },
    ],
  },
  {
    n: 3,
    title: 'Reviews & Ratings',
    features: [
      { name: 'Star Rating System', detail: 'Whole-star 1–5, with average and count on cards and pages.' },
      { name: 'Write a Review Flow', detail: 'Required star rating plus optional text, visit context and booking source.' },
      { name: 'Review Display', detail: 'Most-recent sort, report action, and optional operator public reply.' },
      { name: 'Eligibility Logic', detail: 'Reviews limited to guests who completed a booking, or an admin-verified visit.' },
    ],
  },
  {
    n: 4,
    title: 'Review Moderation & Fraud Flags',
    features: [
      { name: 'Report Review Workflow', detail: 'Reasons (spam / harassment / fake / other) and visible / pending / removed states.' },
      { name: 'Fraud / Risk Flagging', detail: 'Automatic flags for a burst of reviews from one source or a spike of 5★ on a listing, with privacy-preserving fingerprints.' },
      { name: 'Admin Moderation Panel', detail: 'Flagged-review queue with hide / approve / remove.' },
    ],
  },
  {
    n: 5,
    title: 'Badges (Auto-Award, Data-Based)',
    features: [
      { name: 'Badge Engine', detail: 'Trending this month, Most reviewed, Top-rated in [City], Community favourite — all from real activity.' },
      { name: 'Badge Display', detail: 'On listing cards and pages, with a “community ratings and activity” tooltip.' },
      { name: 'Integrity Rules', detail: 'Cannot be bought or assigned; recomputed automatically and revoked when metrics fall.' },
    ],
  },
  {
    n: 6,
    title: 'Booking System (Core Flows)',
    features: [
      { name: 'Availability & Capacity', detail: 'Operator sessions with per-session capacity and pricing; partial-capacity booking supported.' },
      { name: 'Booking Checkout', detail: 'Session + quantity, Stripe payment, confirmation screen and email.' },
      { name: 'Booking Management', detail: 'Customers view / cancel eligible bookings; operators see bookings and attendees.' },
    ],
  },
  {
    n: 7,
    title: 'Cancellation & Refund Rules',
    features: [
      { name: 'Default Policy', detail: 'Free cancellation up to 48h before; no refund within 48h.' },
      { name: 'Operator Policy Setting', detail: '72h / 48h / 24h / no refunds — shown at checkout and in the confirmation email.' },
      { name: 'Refund Timing & No-Show', detail: 'Immediate refund on eligible cancellation; no-show keeps review rights.' },
    ],
  },
  {
    n: 8,
    title: 'Payments & Commission Logic',
    features: [
      { name: 'Commission', detail: 'DW takes 5% per booking; Stripe fees passed through to the operator.' },
      { name: 'Payout Logic', detail: 'Stripe Connect automatic fund splitting.' },
      { name: 'Receipts / Invoices', detail: 'Operator statement: gross, DW commission, Stripe fee, net payout.' },
    ],
  },
  {
    n: 9,
    title: 'Operator Dashboard',
    features: [
      { name: 'Listing & Session Management', detail: 'Edit listings and manage sessions (date/time, price, capacity).' },
      { name: 'Bookings & Attendees', detail: 'View bookings and the customer attendee list.' },
      { name: 'Performance & Review Response', detail: 'Bookings, revenue, rating and review count, plus replies to reviews.' },
    ],
  },
  {
    n: 10,
    title: 'Admin Tools (DW Ops)',
    features: [
      { name: 'Listing & Claim Approval', detail: 'Approve / deny new listings and claim requests.' },
      { name: 'Review Moderation', detail: 'Hide / remove / approve reviews.' },
      { name: 'Verification & Badges', detail: 'Set verified-visit flags; badges stay algorithmic.' },
    ],
  },
  {
    n: 11,
    title: 'Email Notifications',
    features: [
      { name: 'Booking & Cancellation confirmations', detail: 'To customer and operator.' },
      { name: 'Post-experience review request', detail: 'To the customer after the session.' },
      { name: 'Review published notification', detail: 'To the operator.' },
    ],
  },
  {
    n: 12,
    title: 'Legal / Policy Pages',
    features: [
      { name: 'Terms of Service & Privacy Policy', detail: 'Published.' },
      { name: 'Refund & Cancellation overview', detail: 'Published.' },
      { name: 'Review Guidelines', detail: 'Published.' },
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

export default function Phase1StandalonePage() {
  const featureCount = MODULES.reduce((n, m) => n + m.features.length, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1614] via-[#2b2018] to-[#3a2a14] px-6 py-12 text-white sm:px-10">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-500/20 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-300">Destination Whisky</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">Phase 1 — Build Report</h1>
            <p className="mt-4 max-w-2xl text-lg text-white/70">
              First iteration. Every module in the Phase 1 build list is implemented, wired end-to-end,
              and verified against the live data model.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-500/15 px-4 py-2 text-sm font-semibold text-green-300 ring-1 ring-green-400/30">
              <CheckCircle2 className="h-4 w-4" />
              All Phase 1 features implemented
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Modules', value: '12 / 12' },
            { label: 'Features built', value: `${featureCount}` },
            { label: 'Completion', value: '100%' },
            { label: 'Definition of Done', value: '7 / 7' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <p className="font-display text-3xl font-bold text-primary-600">{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Definition of Done */}
        <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-display text-xl font-bold text-gray-900">Phase 1 — Definition of Done</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {DEFINITION_OF_DONE.map((item) => (
              <li key={item} className="flex items-start gap-2.5 rounded-xl bg-green-50 px-3.5 py-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <span className="text-sm text-gray-800">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Modules */}
        <section className="mt-8">
          <h2 className="mb-4 font-display text-xl font-bold text-gray-900">The build list, module by module</h2>
          <div className="space-y-4">
            {MODULES.map((m) => (
              <div key={m.n} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-sm font-bold text-white">
                    {m.n}
                  </span>
                  <h3 className="font-display text-lg font-semibold text-gray-900">{m.title}</h3>
                </div>
                <ul className="divide-y divide-gray-100">
                  {m.features.map((f) => (
                    <li key={f.name} className="flex items-start gap-3 px-5 py-3.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">{f.name}</p>
                        <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{f.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* A note from the team — scope/budget context + a light bonus ask. */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#1A1614] via-[#2b2018] to-[#3a2a14] px-6 py-8 text-white sm:px-10">
          <div className="flex items-center gap-2 text-primary-300">
            <span className="text-2xl">🥃</span>
            <h2 className="font-display text-xl font-bold">A note from the team</h2>
          </div>
          <div className="mt-4 max-w-2xl space-y-4 text-white/80">
            <p>
              In our previous meetings we agreed to keep Phase 1 lean — trim the scope, mind the
              budget. Then we drifted a little past the deadline. So instead of handing over the
              stripped-back version, we went ahead and built{' '}
              <span className="font-semibold text-white">the whole thing</span>: all twelve modules
              above, fully working, tested end-to-end and security-hardened.
            </p>
            <p className="font-display text-lg italic text-primary-200">
              You ordered a dram; we poured the whole bottle.
            </p>
            <p className="text-sm text-white/60">
              P.S. — if a little bonus happens to find its way into the budget, we&apos;d gladly raise a
              glass to it. Purely for morale, of course. 😄
            </p>
          </div>
        </section>

        <p className="mt-10 text-center text-xs text-gray-400">Destination Whisky — Phase 1 build report</p>
      </main>
    </div>
  )
}
