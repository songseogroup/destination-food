/**
 * Mirrors backend StripeService booking fee tiers (per ticket, AUD).
 */
export function bookingFeePerTicket(ticketPrice: number): number {
  if (ticketPrice < 50) return 2
  if (ticketPrice <= 150) return 3
  return 4
}

export function orderBookingFeeBreakdown(totalAmount: number, numberOfGuests: number) {
  const guests = Math.max(1, numberOfGuests || 1)
  const ticketTotal = Number(totalAmount) || 0
  const perTicket = guests > 0 ? ticketTotal / guests : ticketTotal
  const feeEach = bookingFeePerTicket(perTicket)
  const bookingFeeTotal = feeEach * guests
  return {
    ticketSubtotal: ticketTotal,
    bookingFeePerTicket: feeEach,
    bookingFeeTotal,
    customerChargedTotal: ticketTotal + bookingFeeTotal,
  }
}
