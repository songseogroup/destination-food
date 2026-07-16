'use client'

import { useState, useEffect } from 'react'
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '@/lib/api'
import { formatPrice } from '@/lib/format'

// Lazy + cached. Calling loadStripe('') at module import time throws an
// uncaught IntegrationError on every page that imports this component,
// even ones where the customer never opens the payment modal. Defer the
// call until <StripePayment /> actually renders so missing-env pages stay
// usable.
let stripePromise: Promise<Stripe | null> | null = null
function getStripe(): Promise<Stripe | null> {
  if (stripePromise) return stripePromise
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  if (!key) {
    // Don't ask Stripe.js to throw. Resolve to null and let the component
    // render a clear "payments are temporarily unavailable" message.
    stripePromise = Promise.resolve(null)
  } else {
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

interface StripePaymentProps {
  orderId: number
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

function PaymentForm({ orderId, amount, onSuccess, onError }: StripePaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  useEffect(() => {
    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const response = await api.post('/stripe/payment-intent', {
          orderId,
          amount,
          currency: 'aud',
        })
        setClientSecret(response.data.clientSecret)
      } catch (error: any) {
        onError(error.response?.data?.message || 'Failed to initialize payment')
      }
    }

    createPaymentIntent()
  }, [orderId, amount])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsProcessing(true)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      onError('Card element not found')
      setIsProcessing(false)
      return
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      })

      if (error) {
        onError(error.message || 'Payment failed')
        setIsProcessing(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess()
      }
    } catch (err: any) {
      onError(err.message || 'Payment processing failed')
      setIsProcessing(false)
    }
  }

  // Colour-only update: the card input now sits on a white field, so the text
  // is ink rather than white and the placeholder is charcoal-400.
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1A1614',
        '::placeholder': {
          color: '#A99E8F',
        },
      },
      invalid: {
        color: '#B4453A',
        iconColor: '#B4453A',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-charcoal-200 bg-white p-4">
        <CardElement options={cardElementOptions} />
      </div>
      <button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
        className="btn-primary w-full"
      >
        {isProcessing ? 'Processing...' : `Pay ${formatPrice(amount) ?? 'now'}`}
      </button>
    </form>
  )
}

export default function StripePayment({ orderId, amount, onSuccess, onError }: StripePaymentProps) {
  const hasKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

  if (!hasKey) {
    // Friendlier UI than the raw Stripe IntegrationError. Means the
    // operator forgot to set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY on Vercel.
    return (
      <div className="rounded-xl border border-status-warning/25 bg-status-warningSoft px-4 py-3 text-sm text-status-warning">
        Online payments are temporarily unavailable. Please contact us to complete your booking, or try again later.
      </div>
    )
  }

  // Colours only — the surrounding page is now the light Destination Whisky
  // theme, so the 'night' theme rendered a black box on cream.
  const options: StripeElementsOptions = {
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#B8862F',
        colorBackground: '#FFFFFF',
        colorText: '#1A1614',
        colorDanger: '#B4453A',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '14px',
      },
    },
  }

  return (
    <Elements stripe={getStripe()} options={options}>
      <PaymentForm orderId={orderId} amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
