import type { Metadata } from 'next'
import LegalPage, { LegalSection } from '../../components/LegalPage'

export const metadata: Metadata = {
  title: 'Review Guidelines',
  description:
    'Who can review on Destination Whisky, what we remove, and why our ratings can be trusted.',
}

/**
 * Describes rules the code actually enforces: reviews require a confirmed or
 * completed booking (or an admin-verified visit), one per person per listing,
 * and hosts can reply but not delete. Keep this page and reviews.service in step.
 */
export default function ReviewGuidelinesPage() {
  return (
    <LegalPage
      title="Review Guidelines"
      updated="17 July 2026"
      intro="A rating is only worth something if it's real. Here's how we keep ours honest."
    >
      <LegalSection heading="Only guests who booked can review">
        <p>
          You can review an experience if you booked it through Destination Whisky. That&apos;s the
          whole rule, and it&apos;s enforced automatically — not a promise we make and hope nobody
          checks.
        </p>
        <p>
          It means a rival can&apos;t bury a venue, and a host can&apos;t pad their own score. If you
          visited another way — before we listed them, or by phone — contact us and we can verify your
          visit so you can review that venue.
        </p>
      </LegalSection>

      <LegalSection heading="One review per person, per listing">
        <p>
          You get one voice per listing. You can&apos;t stack ratings to move an average on your own.
        </p>
      </LegalSection>

      <LegalSection heading="Didn't make it? You can still review">
        <p>
          If you booked and couldn&apos;t attend, you may still review after the session. The booking
          was real, so your experience of it counts.
        </p>
      </LegalSection>

      <LegalSection heading="What we remove">
        <p>We take reviews down when they:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>attack a person rather than describe an experience</li>
          <li>contain hate speech, threats or harassment</li>
          <li>are advertising, spam, or written for someone else in exchange for anything</li>
          <li>reveal someone&apos;s private information</li>
          <li>describe a visit that didn&apos;t happen</li>
        </ul>
        <p>
          We do <strong className="text-ink">not</strong> remove a review for being negative, and a
          host cannot pay to have one taken down. A poor review that follows these rules stays up.
        </p>
      </LegalSection>

      <LegalSection heading="Hosts can reply, not erase">
        <p>
          Hosts can respond publicly to any review of their listing. They cannot edit or delete your
          words. A thoughtful reply to a hard review tends to say more about a venue than the review
          did.
        </p>
      </LegalSection>

      <LegalSection heading="Badges and rankings are earned, never sold">
        <p>
          Where we highlight a venue — top rated, most reviewed, trending — it is calculated from real
          bookings and real reviews. Nobody can buy their way onto that list, and no host can hand
          themselves a badge.
        </p>
      </LegalSection>

      <LegalSection heading="Writing something useful">
        <p>
          What you drank, what the guide was like, whether it was worth the fare across town. Specific
          beats effusive. The next person choosing between two tastings is who you&apos;re writing
          for.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
