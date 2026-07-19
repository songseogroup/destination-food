import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, { LegalSection } from '../../components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'What personal information Destination Whisky collects, why, who we share it with, and how to get it deleted.',
}

/**
 * ⚠️ NEEDS LEGAL REVIEW BEFORE LAUNCH.
 *
 * The *facts* here are accurate — they were written from the actual schema and
 * integrations (Customer entity fields, AnalyticsEvent, Stripe, Cloudinary,
 * Google sign-in, SMTP) rather than from a template, so nothing here claims a
 * practice the code doesn't follow.
 *
 * But a privacy policy is a legal instrument under the Australian Privacy Act
 * (and the GDPR for EU visitors), and this has not been reviewed by a lawyer.
 * Have the client's solicitor check it before launch — particularly the
 * retention periods, the overseas-disclosure section and the complaints process,
 * which have statutory requirements this draft only approximates.
 *
 * If the data we collect changes, this page has to change with it.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="17 July 2026"
      intro="What we collect, why we collect it, and how to make us delete it."
    >
      <LegalSection heading="Who we are">
        <p>
          Destination Whisky is a marketplace for whisky experiences, operating from Sydney,
          Australia. When you book through us, we handle your personal information as described here.
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <p>
          <strong className="text-ink">When you create an account:</strong> your name, email address
          and password (stored only as a one-way hash — we cannot read it). Optionally your phone
          number, address, date of birth and a profile photo.
        </p>
        <p>
          <strong className="text-ink">When you book:</strong> what you booked, when, for how many
          people, the amount, and any special requests you send the host.
        </p>
        <p>
          <strong className="text-ink">When you sign in with Google:</strong> your name, email address
          and whether Google has verified that email. We never receive your Google password.
        </p>
        <p>
          <strong className="text-ink">As you browse:</strong> which pages and listings you view, the
          page that sent you to us, and a random session identifier. This is only collected if you
          agree to analytics cookies. We do not store your IP address alongside it.
        </p>
        <p>
          <strong className="text-ink">When you post a review:</strong> your rating, your words, and
          a one-way fingerprint of your connection. That fingerprint is not your IP address — it
          can&apos;t be turned back into one — and it exists only so we can spot one person posting
          fake reviews from several accounts.
        </p>
        <p>
          <strong className="text-ink">Payment card details are never collected by us.</strong> They
          go directly to Stripe. We only ever see the outcome — paid or not — and never the card
          number.
        </p>
      </LegalSection>

      <LegalSection heading="Why we collect it">
        <ul className="list-disc space-y-1 pl-5">
          <li>To take and manage your booking, and to pass the host what they need to host you.</li>
          <li>To email you about a booking — confirmations, tickets, cancellations, refunds.</li>
          <li>To let you review a place you actually visited.</li>
          <li>To detect fake reviews, so the ratings you rely on are worth relying on.</li>
          <li>To understand which experiences people are interested in (only with your consent).</li>
          <li>To meet our tax and record-keeping obligations.</li>
        </ul>
        <p>
          We do not sell your personal information. We do not share it with advertisers.
        </p>
      </LegalSection>

      <LegalSection heading="Who else sees it">
        <p>
          <strong className="text-ink">The host you book with</strong> receives your name, contact
          details and booking details. They need them to expect you at the door.
        </p>
        <p>
          <strong className="text-ink">Stripe</strong> processes payments and payouts, and holds the
          card details we never see.
        </p>
        <p>
          <strong className="text-ink">Cloudinary</strong> stores images you upload.
        </p>
        <p>
          <strong className="text-ink">Google</strong> is involved only if you choose to sign in with
          it.
        </p>
        <p>
          <strong className="text-ink">Our email provider</strong> delivers the emails we send you.
        </p>
        <p>
          Some of these operate outside Australia, which means your information may be stored or
          processed overseas.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies">
        <p>
          Essential cookies keep you signed in and keep your cart — they can&apos;t be turned off
          without breaking the site. Analytics and marketing cookies are optional, and off until you
          say otherwise. You can change your mind at any time on our{' '}
          <Link href="/cookies" className="text-whisky-700 underline">
            cookie settings page
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="How long we keep it">
        <p>
          Your account details stay for as long as you have an account. Booking and payment records
          are kept longer, because tax and financial rules require it. Analytics data is kept in a
          form that isn&apos;t tied to your account.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          You can ask us for a copy of what we hold about you, ask us to correct it, or ask us to
          delete your account. Email{' '}
          <a href="mailto:hello@destinationwhisky.life" className="text-whisky-700 underline">
            hello@destinationwhisky.life
          </a>{' '}
          and we&apos;ll action it. We may need to keep booking records even after your account is
          closed, where the law requires it.
        </p>
        <p>
          If you&apos;re unhappy with how we&apos;ve handled your information, tell us first — we
          would rather fix it. You can also complain to the Office of the Australian Information
          Commissioner.
        </p>
      </LegalSection>

      <LegalSection heading="Security">
        <p>
          Passwords are hashed, connections are encrypted, and payment details never touch our
          servers. No system is perfect; if a breach ever affects you, we will tell you.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If we change this policy in a way that matters, we&apos;ll say so here and update the date
          at the top.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
