'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from 'react-query'
import { motion } from 'framer-motion'
import {
  BarChart3,
  Calendar,
  DollarSign,
  FileText,
  Home,
  Image,
  List,
  MapPin,
  Plus,
  Settings,
  ShoppingCart,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { auth, User } from '@/lib/auth'
import { Bar, Blog, Distillery, Event } from '@/lib/types'
import { isOwnerRole, isPlatformRole, isSuperAdmin, roleLabels } from '@/lib/roles'
import { OwnerSetupChecklist } from '@/components/OwnerSetupChecklist'
import { MiniChart } from '@/components/analytics/MiniChart'

interface AnalyticsSummaryLite {
  totals: { views: number; clicks: number }
  timeseries: { date: string; views: number; clicks: number }[]
}

type Listing = (Bar | Distillery | Event) & { userId?: number }

const roleWelcome: Record<string, string> = {
  super_admin: 'Monitor platform operations, approvals, payouts, and global content.',
  admin: 'Manage editorial content, listings, media, and day-to-day CMS operations.',
  bar: 'Maintain your bar profile, menu, media, reviews, bookings, and payouts.',
  distillery: 'Maintain your distillery profile, products, media, reviews, bookings, and payouts.',
  event_host: 'Maintain your events, media, reviews, bookings, and payouts.',
  tour_operator: 'Maintain your tour experiences, media, reviews, bookings, and payouts.',
}

export default function DashboardPage() {
  const [user] = useState<User | null>(() => auth.getUser())
  const role = user?.role || 'admin'
  const platformRole = isPlatformRole(role)

  const barsQuery = useQuery('dashboard-bars', () => api.get('/bars?limit=100').then((res) => res.data), {
    enabled: platformRole || role === 'bar',
  })
  const distilleriesQuery = useQuery(
    'dashboard-distilleries',
    () => api.get('/distilleries?limit=100').then((res) => res.data),
    { enabled: platformRole || role === 'distillery' },
  )
  const eventsQuery = useQuery('dashboard-events', () => api.get('/events?limit=100').then((res) => res.data), {
    enabled: platformRole || role === 'event_host' || role === 'tour_operator',
  })
  const blogsQuery = useQuery('dashboard-blogs', () => api.get('/blogs?limit=5').then((res) => res.data), {
    enabled: platformRole,
  })

  const analyticsQuery = useQuery<AnalyticsSummaryLite>(
    ['dashboard-analytics', role],
    () => api.get('/analytics/summary?days=30').then((res) => res.data),
    { enabled: platformRole || isOwnerRole(role) },
  )

  const ownerListings = useMemo<Listing[]>(() => {
    const ownedOnly = (entity: Listing) => !user || !entity.userId || entity.userId === user.id
    if (role === 'bar') return (barsQuery.data?.data || []).filter(ownedOnly)
    if (role === 'distillery') return (distilleriesQuery.data?.data || []).filter(ownedOnly)
    if (role === 'event_host' || role === 'tour_operator') return (eventsQuery.data?.data || []).filter(ownedOnly)
    return []
  }, [barsQuery.data, distilleriesQuery.data, eventsQuery.data, role, user])

  const platformStats = [
    { name: 'Bars', value: barsQuery.data?.total || 0, icon: BarChart3, tone: 'bg-blue-50 text-blue-600' },
    { name: 'Distilleries', value: distilleriesQuery.data?.total || 0, icon: MapPin, tone: 'bg-emerald-50 text-emerald-600' },
    { name: 'Events', value: eventsQuery.data?.total || 0, icon: Calendar, tone: 'bg-violet-50 text-violet-600' },
    { name: 'Blog Posts', value: blogsQuery.data?.total || 0, icon: FileText, tone: 'bg-amber-50 text-amber-600' },
  ]

  const platformActions = [
    { label: 'Homepage', href: '/dashboard/homepage', icon: Home, roles: ['super_admin', 'admin'] },
    { label: 'Listings', href: '/dashboard/bars', icon: BarChart3, roles: ['super_admin', 'admin'] },
    { label: 'Blogs', href: '/dashboard/blogs', icon: FileText, roles: ['super_admin', 'admin'] },
    { label: 'Media Library', href: '/dashboard/media', icon: Image, roles: ['super_admin', 'admin'] },
    { label: 'Payout Review', href: '/dashboard/admin/payouts', icon: DollarSign, roles: ['super_admin'] },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['super_admin', 'admin'] },
  ].filter((action) => action.roles.includes(role))

  const ownerActions = [
    { label: 'Media', href: '/dashboard/media', icon: Image },
    ...(role === 'event_host' || role === 'tour_operator' ? [] : [{ label: 'Menu', href: '/dashboard/menu', icon: List }]),
    { label: 'Reviews', href: '/dashboard/reviews', icon: Star },
    { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
    { label: 'Finance', href: '/dashboard/finance', icon: DollarSign },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary-600">{roleLabels[role] || 'CMS'} Dashboard</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">Welcome back{user?.firstName ? `, ${user.firstName}` : ''}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
              {roleWelcome[role] || 'Manage your CMS workspace.'}
            </p>
          </div>
          {isSuperAdmin(role) && (
            <Link href="/dashboard/admin/payouts" className="btn-primary">
              <DollarSign className="h-4 w-4 mr-2" />
              Review Payouts
            </Link>
          )}
        </div>
      </div>

      {platformRole ? (
        <>
          <AnalyticsPreview
            title="Platform analytics"
            subtitle="Total views and clicks across every listing on the platform."
            data={analyticsQuery.data}
            isLoading={analyticsQuery.isLoading}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {platformStats.map((stat, index) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Platform Content</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {(barsQuery.data?.data || []).slice(0, 3).map((bar: Bar) => (
                  <ContentRow key={`bar-${bar.id}`} href={`/dashboard/bars/${bar.id}`} image={bar.image} title={bar.name} meta={`Bar • ${bar.location}`} />
                ))}
                {(eventsQuery.data?.data || []).slice(0, 3).map((event: Event) => (
                  <ContentRow key={`event-${event.id}`} href={`/dashboard/events/${event.id}`} image={event.image} title={event.name} meta={`Event • ${event.date}`} />
                ))}
                {blogsQuery.data?.data?.slice(0, 2).map((blog: Blog) => (
                  <ContentRow key={`blog-${blog.id}`} href="/dashboard/blogs" image={blog.image} title={blog.title} meta={`Blog • ${blog.category}`} />
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900">CMS Tools</h2>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {platformActions.map((action) => (
                  <ActionLink key={action.href} {...action} />
                ))}
              </div>
            </section>
          </div>
        </>
      ) : isOwnerRole(role) ? (
        <>
          <OwnerSetupChecklist />

          <AnalyticsPreview
            title="Your listing performance"
            subtitle="How visitors are engaging with your listing — share these stats with your team."
            data={analyticsQuery.data}
            isLoading={analyticsQuery.isLoading}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <OwnerStat label="Active Listings" value={ownerListings.length} icon={Users} />
            <OwnerStat label="Published Media" value="Manage" icon={Image} />
            <OwnerStat label="Customer Reviews" value="Review" icon={Star} />
          </div>

          {ownerListings.length > 0 ? (
            <OwnerCommandCenter role={role} listing={ownerListings[0]} />
          ) : (
            <section className="rounded-lg border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="font-medium text-gray-900">No listing yet</p>
              <p className="mt-2 text-sm text-gray-600">Create your first listing to unlock media, reviews, bookings, and finance workflows.</p>
              <Link href={role === 'bar' ? '/dashboard/bars/new' : role === 'distillery' ? '/dashboard/distilleries/new' : '/dashboard/events/new'} className="btn-primary mt-5">
                <Plus className="h-4 w-4" />
                Create Listing
              </Link>
            </section>
          )}
        </>
      ) : null}
    </div>
  )
}

function OwnerCommandCenter({ role, listing }: { role: string; listing: Listing }) {
  const basePath = role === 'bar' ? 'bars' : role === 'distillery' ? 'distilleries' : 'events'
  const tools = [
    { label: 'Edit Profile', href: `/dashboard/${basePath}/${listing.id}`, icon: Settings, description: 'Business details, cover image, and publishing state.' },
    { label: 'Media', href: '/dashboard/media', icon: Image, description: 'Gallery and listing visuals.' },
    ...(role === 'event_host' || role === 'tour_operator' ? [] : [{ label: 'Menu', href: '/dashboard/menu', icon: List, description: 'Products, tastings, and menu items.' }]),
    { label: 'Reviews', href: '/dashboard/reviews', icon: Star, description: 'Customer reputation and review summary.' },
    { label: 'Orders', href: '/dashboard/orders', icon: ShoppingCart, description: 'Reservations, bookings, and customer requests.' },
    { label: 'Finance', href: '/dashboard/finance', icon: DollarSign, description: 'Stripe onboarding, balances, and payouts.' },
  ]

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <img src={listing.image} alt={listing.name} className="h-52 w-full rounded-t-lg object-cover" />
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Your listing</p>
          <h2 className="mt-1 text-xl font-semibold text-gray-950">{listing.name}</h2>
          <p className="mt-2 text-sm text-gray-600">{listing.location}</p>
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-950">Manage Your Business</h2>
        <p className="mt-1 text-sm text-gray-600">Use these sections to keep your marketplace presence and operations up to date.</p>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
              <tool.icon className="h-5 w-5 text-gray-700" />
              <h3 className="mt-3 font-semibold text-gray-950">{tool.label}</h3>
              <p className="mt-1 text-sm leading-6 text-gray-600">{tool.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

function AnalyticsPreview({
  title,
  subtitle,
  data,
  isLoading,
}: {
  title: string
  subtitle: string
  data?: AnalyticsSummaryLite
  isLoading: boolean
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-whisky-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <p className="mt-1 max-w-xl text-sm text-gray-600">{subtitle}</p>
        </div>
        <Link href="/dashboard/analytics" className="btn-secondary shrink-0">
          View full analytics
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
          <div className="skeleton h-16" />
          <div className="skeleton h-16" />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal-500">Views</p>
              <p className="mt-1 font-display text-2xl font-semibold text-ink">
                {(data?.totals.views ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-charcoal-500">Clicks</p>
              <p className="mt-1 font-display text-2xl font-semibold text-ink">
                {(data?.totals.clicks ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
          <MiniChart data={data?.timeseries ?? []} height={64} metric="views" />
        </div>
      )}

      <p className="mt-3 text-xs text-charcoal-400">Last 30 days</p>
    </section>
  )
}

function ContentRow({ href, image, title, meta }: { href: string; image: string; title: string; meta: string }) {
  return (
    <Link href={href} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50">
      <img src={image} alt={title} className="h-14 w-14 rounded-lg object-cover" />
      <div className="min-w-0">
        <p className="truncate font-medium text-gray-900">{title}</p>
        <p className="truncate text-sm text-gray-600">{meta}</p>
      </div>
    </Link>
  )
}

function ActionLink({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  )
}

function OwnerStat({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <p className="mt-3 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  )
}
