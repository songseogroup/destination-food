'use client'

import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  ArrowRight,
  Store,
  Image as ImageIcon,
  List,
  DollarSign,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'

type EntityType = 'bars' | 'distilleries' | 'events'

interface OwnerEntity {
  id: number
  name?: string
  description?: string
  location?: string
  mediaGallery?: string[]
  userId?: number
}

interface SetupStep {
  id: string
  name: string
  description: string
  icon: React.ElementType
  href: (entityId?: number) => string
  complete: boolean
}

const ROLE_ENTITY: Record<string, EntityType | null> = {
  bar: 'bars',
  distillery: 'distilleries',
  event_host: 'events',
  tour_operator: 'events',
}

export function OwnerSetupChecklist() {
  const router = useRouter()
  const user = auth.getUser()
  const entityType = user ? ROLE_ENTITY[user.role] : null

  const { data: stripeStatus, isLoading: stripeLoading } = useQuery(
    'stripe-account-status',
    async () => {
      try {
        const response = await api.get('/stripe/connect/account-status')
        return response.data
      } catch {
        return null
      }
    },
    { enabled: !!entityType },
  )

  const { data: entityList, isLoading: entityLoading } = useQuery(
    ['owner-entity-list', entityType],
    async () => {
      if (!entityType) return null
      const response = await api.get(`/${entityType}?limit=100`)
      return response.data
    },
    { enabled: !!entityType },
  )

  const ownedEntity = useMemo<OwnerEntity | null>(() => {
    if (!user || !entityList?.data) return null
    return entityList.data.find((e: OwnerEntity) => !e.userId || e.userId === user.id) || null
  }, [entityList, user])

  const { data: menuItems = [], isLoading: menuLoading } = useQuery(
    ['owner-menu', entityType, ownedEntity?.id],
    async () => {
      if (!ownedEntity?.id) return []
      try {
        const response = await api.get(`/${entityType}/${ownedEntity.id}/menu`)
        return response.data || []
      } catch {
        return []
      }
    },
    { enabled: !!ownedEntity?.id && (entityType === 'bars' || entityType === 'distilleries') },
  )

  if (!entityType) return null

  const isLoading = stripeLoading || entityLoading || menuLoading
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
          <span className="text-gray-600">Checking your setup progress...</span>
        </div>
      </div>
    )
  }

  const detailsHref = ownedEntity?.id ? `/dashboard/${entityType}/${ownedEntity.id}` : '/dashboard/details'
  const mediaHref = ownedEntity?.id ? `/dashboard/${entityType}/${ownedEntity.id}/media` : '/dashboard/media'
  const menuHref = ownedEntity?.id ? `/dashboard/${entityType}/${ownedEntity.id}/menu` : '/dashboard/menu'

  const profileComplete = !!(ownedEntity?.name && ownedEntity?.description && ownedEntity?.location)
  const mediaComplete = (ownedEntity?.mediaGallery?.length || 0) >= 3
  const menuComplete = menuItems.length > 0
  const stripeComplete = !!stripeStatus && stripeStatus.kycStatus === 'verified' && stripeStatus.payoutsEnabled

  const steps: SetupStep[] = [
    {
      id: 'profile',
      name: 'Complete Your Profile',
      description: 'Add your business name, description, location, and contact details',
      icon: Store,
      href: () => detailsHref,
      complete: profileComplete,
    },
    {
      id: 'media',
      name: 'Upload Photos',
      description: 'Add at least 3 photos of your venue/products to attract customers',
      icon: ImageIcon,
      href: () => mediaHref,
      complete: mediaComplete,
    },
  ]

  // Menu only applies to bars and distilleries — tours/events don't have menus.
  if (entityType === 'bars' || entityType === 'distilleries') {
    steps.push({
      id: 'menu',
      name: entityType === 'bars' ? 'Add Your Menu' : 'Add Your Products',
      description: 'Add items customers can book or purchase',
      icon: List,
      href: () => menuHref,
      complete: menuComplete,
    })
  }

  steps.push({
    id: 'stripe',
    name: 'Setup Payments (Stripe)',
    description: 'Complete Stripe onboarding to receive payouts',
    icon: DollarSign,
    href: () => '/dashboard/finance',
    complete: stripeComplete,
  })

  const completedSteps = steps.filter((step) => step.complete).length
  const totalSteps = steps.length
  const progress = (completedSteps / totalSteps) * 100
  const allCompleted = completedSteps === totalSteps

  if (allCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-lg p-6"
      >
        <div className="flex items-start gap-4">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">You&apos;re All Set!</h3>
            <p className="text-green-700 mt-1">
              Your business profile is complete and ready to accept bookings. Customers can now find and book your experiences.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => router.push('/dashboard/orders')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                View Orders
              </button>
              <button
                onClick={() => router.push('/dashboard/finance')}
                className="px-4 py-2 bg-white text-green-700 border border-green-300 rounded-lg hover:bg-green-50 text-sm font-medium"
              >
                Check Earnings
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Complete Your Setup</h3>
          <span className="text-sm text-gray-500">
            {completedSteps} of {totalSteps} done
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="bg-primary-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <p className="text-sm text-gray-600 mt-2">Complete these steps to start receiving bookings and payments</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => !step.complete && router.push(step.href())}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                step.complete
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200 hover:bg-primary-50 hover:border-primary-200'
              }`}
            >
              <div className={`p-2 rounded-full ${step.complete ? 'bg-green-100' : 'bg-gray-200'}`}>
                {step.complete ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <Icon className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1">
                <h4 className={`font-medium ${step.complete ? 'text-green-900' : 'text-gray-900'}`}>{step.name}</h4>
                <p className={`text-sm ${step.complete ? 'text-green-700' : 'text-gray-600'}`}>{step.description}</p>
              </div>
              {!step.complete && <ArrowRight className="h-5 w-5 text-gray-400" />}
            </motion.div>
          )
        })}
      </div>

      {completedSteps < totalSteps && (
        <div className="mt-4 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            <strong>Tip:</strong> Complete all steps to start receiving bookings. Stripe setup is required before you can receive payouts.
          </p>
        </div>
      )}
    </div>
  )
}
