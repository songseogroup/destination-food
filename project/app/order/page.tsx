import { redirect } from 'next/navigation'

// Legacy route — the real bookings list lives at /orders. Redirect
// permanently so old Header links + emails keep working.
export default function OrderRedirect() {
  redirect('/orders')
}
