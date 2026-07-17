/**
 * Where a notification points, for the customer-facing site.
 *
 * Notifications carry no link column — the destination has to be derived from
 * (type, metadata), and the shapes are set by whoever creates the notification
 * (orders.service, stripe.service, customers.service). A type we don't map, or
 * one whose metadata is missing the id, simply has no destination: the detail
 * page still renders, it just doesn't offer a button. That's deliberate — a
 * button that 404s is worse than no button.
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
  const orderId = meta.orderId

  switch (n.type) {
    case 'booking_received':
    case 'booking_confirmed':
      return orderId ? { href: `/orders/${orderId}`, label: 'View booking' } : null

    case 'refund_processed':
      return orderId ? { href: `/orders/${orderId}`, label: 'View booking' } : null

    // Welcome has no metadata and nothing specific to open.
    case 'welcome':
      return null

    default:
      // `generic` covers several unrelated events; only link when the metadata
      // actually tells us where to go.
      return orderId ? { href: `/orders/${orderId}`, label: 'View booking' } : null
  }
}

/** Human label for the type badge on the detail page. */
export function notificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    booking_received: 'Booking',
    booking_confirmed: 'Booking',
    refund_processed: 'Refund',
    welcome: 'Welcome',
    generic: 'Update',
  }
  return labels[type] || 'Update'
}
