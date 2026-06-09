'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'

export default function StripeOnboardingCompletePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Stripe onboarding updated</h1>
        <p className="text-gray-600 text-sm mb-6">
          Return to Finance to confirm your verification status and payout settings.
        </p>
        <Link
          href="/dashboard/finance"
          className="inline-block px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 font-medium"
        >
          Go to Finance
        </Link>
      </div>
    </div>
  )
}
