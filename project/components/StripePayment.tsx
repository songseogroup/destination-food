'use client'

import { useState, useEffect } from 'react'
import { loadStripe, Stripe, StripeElementsOptions } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { api } from '@/lib/api'

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

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#ffffff',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <CardElement options={cardElementOptions} />
      </div>
      <button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
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
      <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg text-sm">
        Online payments are temporarily unavailable. Please contact us to complete your booking, or try again later.
      </div>
    )
  }

  const options: StripeElementsOptions = {
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#eab308',
        colorBackground: '#1f2937',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  }

  return (
    <Elements stripe={getStripe()} options={options}>
      <PaymentForm orderId={orderId} amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  )
}
