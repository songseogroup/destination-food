/**
 * Where a notification points, for the admin portal.
 *
 * Same idea as the storefront's resolver, different destinations: the metadata
 * shapes are set by whoever creates the notification (orders.service,
 * stripe.service, reviews.service, feedback.service, auth.service). A type we
 * don't map, or one whose metadata lacks the id, gets no destination — the
 * detail page renders without a button rather than offering one that 404s.
 */

export interface NotificationLike {
  type: string
  metadata?: Record<string, any> | null
}

export interface NotificationTarget {
  href: string
  label: string
}

export function notificationTarget(n: NotificationLike): NotificationTarget | null {
  const meta = n.metadata || {}

  switch (n.type) {
    case 'booking_received':
    case 'booking_confirmed':
      return meta.orderId
        ? { href: `/dashboard/orders/${meta.orderId}`, label: 'View booking' }
        : null

    case 'refund_processed':
      return meta.orderId
        ? { href: `/dashboard/orders/${meta.orderId}`, label: 'View booking' }
        : null

    case 'payout_approved':
    case 'payout_rejected':
    case 'payout_paid':
    case 'payout_failed':
      return { href: '/dashboard/finance/payouts', label: 'View payouts' }

    case 'kyc_incomplete':
    case 'kyc_verified':
      return { href: '/dashboard/settings', label: 'Finish payout setup' }

    case 'vendor_registered':
      return { href: '/dashboard/admin/vendors', label: 'View vendors' }

    case 'id_uploaded':
      return { href: '/dashboard/admin/vendors', label: 'View vendors' }

    case 'welcome':
      return null

    default:
      // `generic` is shared by reviews, feedback and order edge cases — the
      // metadata is the only way to tell them apart.
      if (meta.feedbackId) {
        return { href: '/dashboard/admin/feedback', label: 'Open feedback' }
      }
      if (meta.reviewId) {
        // reviews.service records which listing was reviewed; go straight to
        // that listing's reviews rather than the site-wide queue.
        const entity = meta.entityType ? `${meta.entityType}s` : null
        if (entity && meta.entityId) {
          return { href: `/dashboard/${entity}/${meta.entityId}/reviews`, label: 'View review' }
        }
        return { href: '/dashboard/reviews', label: 'View reviews' }
      }
      if (meta.orderId) {
        return { href: `/dashboard/orders/${meta.orderId}`, label: 'View booking' }
      }
      return null
  }
}

/** Human label for the type badge on the detail page. */
export function notificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    booking_received: 'Booking',
    booking_confirmed: 'Booking',
    refund_processed: 'Refund',
    payout_approved: 'Payout',
    payout_rejected: 'Payout',
    payout_paid: 'Payout',
    payout_failed: 'Payout',
    kyc_incomplete: 'Payout setup',
    kyc_verified: 'Payout setup',
    vendor_registered: 'Vendor',
    id_uploaded: 'Vendor',
    welcome: 'Welcome',
    generic: 'Update',
  }
  return labels[type] || 'Update'
}
