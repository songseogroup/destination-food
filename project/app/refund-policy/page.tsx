import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { LegalSection } from '../../components/LegalPage'

export const metadata: Metadata = {
  title: 'Refunds & Cancellations',
  description:
    'How cancellations, refunds and no-shows work on Destination Whisky, including the standard 48-hour free cancellation window.',
}

/**
 * This page describes what the platform actually does — the refund window is
 * `refundWindowHours` on each listing (48 by default), enforced by the refund
 * logic and shown at checkout. If that behaviour changes, change this page too.
 */
export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Refunds & Cancellations"
      updated="17 July 2026"
      intro="Plans change. Here's exactly what happens when they do — no small print."
    >
      <LegalSection heading="The standard policy">
        <p>
          Unless the host has set something different, you can cancel free of charge up until{' '}
          <strong className="text-ink">48 hours</strong> before your booking and receive a full
          refund. Within 48 hours of the booking, a cancellation does not receive a refund.
        </p>
        <p>
          Hosts may choose a different window — commonly 72, 48 or 24 hours, or no refunds at all.
          Whatever applies to your booking is shown to you at checkout, before you pay, and again in
          your confirmation email. It is never changed after you have booked.
        </p>
      </LegalSection>

      <LegalSection heading="How to cancel">
        <p>
          Go to{' '}
          <Link href="/orders" className="text-whisky-700 underline">
            your bookings
          </Link>
          , open the booking and cancel it there. If you are inside the host&apos;s window and think
          you have a good reason, contact us — we will talk to the host on your behalf.
        </p>
      </LegalSection>

      <LegalSection heading="When we refund you">
        <p>
          Refunds are initiated immediately once a cancellation is eligible. The money leaves us
          straight away, but your bank decides when it lands:{' '}
          <strong className="text-ink">typically 5–10 business days</strong>, back to the card you
          paid with. We cannot refund to a different card or account.
        </p>
      </LegalSection>

      <LegalSection heading="If the host cancels">
        <p>
          You are refunded in full, every time, regardless of the window. The host&apos;s cancellation
          window applies to <em>your</em> cancellations, not theirs. You&apos;ll be told by email as
          soon as it happens.
        </p>
        <p>
          If an automatic refund ever fails, we will tell you that plainly rather than quietly leave
          you short, and we will fix it.
        </p>
      </LegalSection>

      <LegalSection heading="No-shows">
        <p>
          If you don&apos;t turn up and haven&apos;t cancelled, the booking is not refunded — the host
          held that place for you and turned others away.
        </p>
        <p>
          You can still leave a review. Not arriving doesn&apos;t erase your experience of booking, and
          we would rather hear it.
        </p>
      </LegalSection>

      <LegalSection heading="Fees">
        <p>
          Where a booking fee applies, it is shown separately at checkout. Refunds returned under this
          policy are for the booking amount; card processing costs are not returned to us and are not
          included.
        </p>
      </LegalSection>

      <LegalSection heading="If something went wrong">
        <p>
          If the experience wasn&apos;t what was described, tell us. This policy sets out the standard
          rules; it doesn&apos;t limit your rights under Australian Consumer Law, and we would rather
          sort a genuine problem out than hide behind a clause.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
