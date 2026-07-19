import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { LegalSection } from '../../components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms you agree to when using Destination Whisky to book whisky bars, distillery tours and events.',
}

/**
 * ⚠️ NEEDS LEGAL REVIEW BEFORE LAUNCH.
 *
 * Written from how the platform actually works — we are an intermediary, the
 * host delivers the experience, refunds follow each listing's refundWindowHours,
 * reviews require a booking — so it doesn't promise behaviour the code doesn't
 * have. But terms of service are a contract, and this has not been near a lawyer.
 *
 * Have the client's solicitor review before launch, especially: the liability
 * and indemnity sections (which interact with the Australian Consumer Law
 * guarantees that cannot be excluded), the alcohol/licensing obligations, and
 * the host commission terms.
 */
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="17 July 2026"
      intro="The agreement between you and Destination Whisky when you use this site."
    >
      <LegalSection heading="What Destination Whisky is">
        <p>
          We are a marketplace. We list whisky bars, distilleries, tours and events, and we take
          bookings and payment for them. The experience itself is provided by the host —
          the venue, distillery or organiser — not by us.
        </p>
        <p>
          This matters: your booking is with the host. We are responsible for the booking and the
          payment; they are responsible for the whisky, the guide and the evening.
        </p>
      </LegalSection>

      <LegalSection heading="You must be of legal drinking age">
        <p>
          These experiences involve alcohol. You must be <strong className="text-ink">18 or over</strong>{' '}
          to book, and you may be asked for ID at the door. Hosts may refuse entry or service, and are
          required by law to refuse anyone intoxicated. In that case the booking is treated as a
          no-show and is not refunded.
        </p>
      </LegalSection>

      <LegalSection heading="Your account">
        <p>
          Keep your password to yourself and your email address current — that&apos;s where your
          tickets go. Tell us if you think someone else has got into your account. You&apos;re
          responsible for what happens under it.
        </p>
      </LegalSection>

      <LegalSection heading="Bookings and payment">
        <p>
          Prices are in Australian dollars. Payment is taken by Stripe at checkout. A booking is a
          request until the host confirms it; you&apos;ll be emailed when they do.
        </p>
        <p>
          Where a booking fee applies, it is shown separately before you pay. What you see at checkout
          is what you pay.
        </p>
      </LegalSection>

      <LegalSection heading="Cancellations and refunds">
        <p>
          Set out in full in our{' '}
          <Link href="/refund-policy" className="text-whisky-700 underline">
            refund and cancellation policy
          </Link>
          , which forms part of these terms. In short: free cancellation up to 48 hours before unless
          the host says otherwise, that window is shown before you pay, and if the host cancels you
          are refunded in full.
        </p>
      </LegalSection>

      <LegalSection heading="Reviews">
        <p>
          Only guests who booked through us can review, and our{' '}
          <Link href="/review-guidelines" className="text-whisky-700 underline">
            review guidelines
          </Link>{' '}
          explain what we remove. When you post a review you give us permission to publish it on the
          site. We won&apos;t take a review down for being unflattering.
        </p>
      </LegalSection>

      <LegalSection heading="If you're a host">
        <p>
          You&apos;re responsible for your listing being accurate, for holding the licences your
          jurisdiction requires, and for actually delivering what you sold. We take a commission on
          each booking, disclosed to you before you list, and pay out the balance through Stripe.
        </p>
        <p>
          You may not create fake bookings or reviews, list an experience you can&apos;t deliver, or
          take a booking you know you can&apos;t honour. We can remove a listing that breaks these
          terms.
        </p>
      </LegalSection>

      <LegalSection heading="What you agree not to do">
        <ul className="list-disc space-y-1 pl-5">
          <li>Book on someone else&apos;s behalf without their knowledge.</li>
          <li>Scrape, copy or resell our listings.</li>
          <li>Try to get around our security, or access accounts that aren&apos;t yours.</li>
          <li>Post anything unlawful, or anything that isn&apos;t yours to post.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Our responsibility, and its limits">
        <p>
          We are responsible for running the booking platform properly. We are not the host, and we
          don&apos;t control what happens at the venue — but we won&apos;t use that as a shield when
          something goes wrong with a booking we took. Tell us and we&apos;ll deal with it.
        </p>
        <p>
          Nothing in these terms excludes rights you have under the Australian Consumer Law. Where a
          guarantee applies that cannot be excluded, it applies regardless of anything written here.
        </p>
      </LegalSection>

      <LegalSection heading="Ending things">
        <p>
          You can close your account whenever you like. We may suspend an account that abuses the
          platform or these terms. Bookings already confirmed still stand.
        </p>
      </LegalSection>

      <LegalSection heading="Changes and governing law">
        <p>
          If we change these terms in a way that affects you, we&apos;ll update the date at the top and
          say so. These terms are governed by the laws of New South Wales, Australia.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
