'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { BarChart3, Calendar, Image, List, MapPin, Plus, Star, Edit } from 'lucide-react'
import { api } from '@/lib/api'
import { auth } from '@/lib/auth'
import { isOwnerRole } from '@/lib/roles'
import { Bar, Distillery, Event } from '@/lib/types'
import { LoadingSpinner } from '@/components/LoadingSpinner'

type WorkspaceMode = 'media' | 'menu' | 'reviews' | 'details'
type EntityType = 'bars' | 'distilleries' | 'events'

interface EntityWorkspaceIndexProps {
  mode: WorkspaceMode
}

const modeCopy = {
  media: {
    title: 'Media',
    description: 'Choose a listing to manage its gallery and visual content.',
    action: 'Manage Media',
    icon: Image,
  },
  menu: {
    title: 'Menu',
    description: 'Choose a listing to manage products, tastings, or menu items.',
    action: 'Manage Menu',
    icon: List,
  },
  reviews: {
    title: 'Reviews',
    description: 'Choose a listing to manage review summaries and reputation signals.',
    action: 'Manage Reviews',
    icon: Star,
  },
  details: {
    title: 'Listing Details',
    description: 'Choose a listing to manage core information, location, and publishing status.',
    action: 'Manage Details',
    icon: Edit,
  },
}

/** Singular, for talking to an operator about their own listing. */
const ownerNoun: Record<EntityType, string> = {
  bars: 'bar',
  distilleries: 'distillery',
  events: 'event',
}

const entityConfig: Record<EntityType, { label: string; icon: any; path: string }> = {
  bars: { label: 'Bars', icon: BarChart3, path: '/bars?limit=100' },
  distilleries: { label: 'Distilleries', icon: MapPin, path: '/distilleries?limit=100' },
  events: { label: 'Events', icon: Calendar, path: '/events?limit=100' },
}

/**
 * Operators read their own listings through /mine, not the public list.
 *
 * The public endpoints hide anything inactive and anything owned by a vendor
 * still awaiting approval — and a self-registered operator starts out pending.
 * Reading the public list here meant an operator's freshly created listing was
 * invisible to them, so the page kept insisting they had none and they'd create
 * it over and over.
 */
const minePath: Record<EntityType, string> = {
  bars: '/bars/mine',
  distilleries: '/distilleries/mine',
  events: '/events/mine',
}

export function EntityWorkspaceIndex({ mode }: EntityWorkspaceIndexProps) {
  const user = auth.getUser()
  const router = useRouter()
  const copy = modeCopy[mode]
  const ModeIcon = copy.icon
  const isOperator = isOwnerRole(user?.role)
  const pathFor = (type: EntityType) => (isOperator ? minePath[type] : entityConfig[type].path)

  const visibleTypes = useMemo<EntityType[]>(() => {
    switch (user?.role) {
      case 'bar':
        return ['bars']
      case 'distillery':
        return ['distilleries']
      case 'event_host':
      case 'tour_operator':
        return ['events']
      default:
        return mode === 'menu' ? ['bars', 'distilleries'] : ['bars', 'distilleries', 'events']
    }
  }, [mode, user?.role])

  const barsQuery = useQuery(['workspace-bars', isOperator], () => api.get(pathFor('bars')).then((res) => res.data), {
    enabled: visibleTypes.includes('bars'),
  })
  const distilleriesQuery = useQuery(
    ['workspace-distilleries', isOperator],
    () => api.get(pathFor('distilleries')).then((res) => res.data),
    { enabled: visibleTypes.includes('distilleries') },
  )
  const eventsQuery = useQuery(
    ['workspace-events', isOperator],
    () => api.get(pathFor('events')).then((res) => res.data),
    { enabled: visibleTypes.includes('events') },
  )

  const isLoading = barsQuery.isLoading || distilleriesQuery.isLoading || eventsQuery.isLoading

  const dataByType: Record<EntityType, Array<(Bar | Distillery | Event) & { userId?: number }>> = {
    bars: barsQuery.data?.data || [],
    distilleries: distilleriesQuery.data?.data || [],
    events: eventsQuery.data?.data || [],
  }

  const getActionHref = (type: EntityType, id: number) => {
    if (mode === 'details') return `/dashboard/${type}/${id}`
    if (mode === 'menu') return `/dashboard/${type}/${id}/menu`
    return `/dashboard/${type}/${id}/${mode}`
  }

  const shouldShowEntity = (entity: { userId?: number }) => {
    if (!user || user.role === 'admin' || user.role === 'super_admin') return true
    return !entity.userId || entity.userId === user.id
  }

  const ownerType = user?.role === 'bar'
    ? 'bars'
    : user?.role === 'distillery'
    ? 'distilleries'
    : user?.role === 'event_host' || user?.role === 'tour_operator'
    ? 'events'
    : null
  const ownerEntities = ownerType ? dataByType[ownerType].filter(shouldShowEntity) : []

  useEffect(() => {
    if (!ownerType || isLoading) return

    const ownerEntity = ownerEntities[0]
    if (ownerEntity) {
      router.replace(getActionHref(ownerType, ownerEntity.id))
    }
  }, [ownerType, isLoading, ownerEntities, router])

  if (isLoading) return <LoadingSpinner />

  if (ownerType) {
    if (ownerEntities.length === 0) {
      /**
       * An operator with no listing yet.
       *
       * This used to say "Create your listing before managing …" and stop there,
       * with nothing to click — so a newly registered operator had no way to
       * list themselves at all. The API was always willing (POST /bars accepts
       * the BAR role and stamps the new row with their userId); only this screen
       * was missing the door.
       */
      const noun = ownerNoun[ownerType]
      return (
        <div className="card px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <ModeIcon className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-gray-950">
            Let&apos;s get your {noun} listed
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-600">
            {mode === 'details'
              ? `Add your details, photos and pricing. Nothing goes live until you publish it.`
              : `Create your ${noun} first — then you can manage its ${mode} here.`}
          </p>
          <Link href={`/dashboard/${ownerType}/new`} className="btn-primary mt-6 inline-flex">
            <Plus className="h-4 w-4" />
            Create your {noun}
          </Link>
        </div>
      )
    }

    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <ModeIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{copy.title}</h1>
            <p className="mt-1 text-sm text-gray-600">{copy.description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {visibleTypes.map((type) => {
          const config = entityConfig[type]
          const EntityIcon = config.icon
          const entities = dataByType[type].filter(shouldShowEntity)

          if (mode === 'menu' && type === 'events') return null

          return (
            <section key={type} className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4">
                <EntityIcon className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">{config.label}</h2>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  {entities.length}
                </span>
              </div>

              {entities.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {entities.map((entity) => (
                    <div key={`${type}-${entity.id}`} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <img
                          src={entity.image}
                          alt={entity.name}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-900">{entity.name}</h3>
                          <p className="truncate text-sm text-gray-600">{entity.location}</p>
                        </div>
                      </div>
                      <Link href={getActionHref(type, entity.id)} className="btn-primary justify-center">
                        {copy.action}
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 py-10 text-center text-sm text-gray-500">No listings available for this workspace.</div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
