'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BarChart3,
  TrendingUp,
  MapPin,
  Calendar,
  FileText,
  Home,
  Upload,
  Settings,
  Menu,
  X,
  ShoppingCart,
  DollarSign,
  Star,
  List,
  ShieldCheck,
  Edit,
  Users,
  Image as ImageIcon,
  Store,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { roleLabels } from '@/lib/roles'
import Logo from './Logo'

const isActiveRoute = (pathname: string, href: string) => {
  if (href === '/dashboard') {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

const superAdminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { name: 'Homepage', href: '/dashboard/homepage', icon: Home },
  { name: 'Banners', href: '/dashboard/admin/banners', icon: ImageIcon },
  { name: 'Team & Admins', href: '/dashboard/admin/users', icon: ShieldCheck },
  { name: 'Vendors', href: '/dashboard/admin/vendors', icon: Store },
  { name: 'Bars', href: '/dashboard/bars', icon: BarChart3 },
  { name: 'Distilleries', href: '/dashboard/distilleries', icon: MapPin },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Blogs', href: '/dashboard/blogs', icon: FileText },
  { name: 'Media', href: '/dashboard/media', icon: Upload },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Review Moderation', href: '/dashboard/admin/reviews', icon: Star },
  { name: 'Customer Feedback', href: '/dashboard/admin/feedback', icon: ShieldCheck },
  { name: 'Platform Pricing', href: '/dashboard/admin/pricing', icon: DollarSign },
  { name: 'Payout Review', href: '/dashboard/admin/payouts', icon: ShieldCheck },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { name: 'Homepage', href: '/dashboard/homepage', icon: Home },
  { name: 'Bars', href: '/dashboard/bars', icon: BarChart3 },
  { name: 'Distilleries', href: '/dashboard/distilleries', icon: MapPin },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Blogs', href: '/dashboard/blogs', icon: FileText },
  { name: 'Media Library', href: '/dashboard/media', icon: Upload },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

/**
 * Owner navigation. Per the pay plan, a vendor needs: upcoming bookings,
 * customer contacts, event management, ticket analytics, revenue and payouts.
 */
const ownerNavigation = (opts: { menu: boolean }) => [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { name: 'My Listing', href: '/dashboard/details', icon: Edit },
  { name: 'Media', href: '/dashboard/media', icon: Upload },
  ...(opts.menu ? [{ name: 'Menu', href: '/dashboard/menu', icon: List }] : []),
  { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
  { name: 'Bookings', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const getRoleNavigation = (role: string) => {
  switch (role) {
    case 'super_admin':
      return superAdminNavigation
    case 'admin':
      return adminNavigation
    case 'bar':
    case 'distillery':
      return ownerNavigation({ menu: true })
    case 'event_host':
    case 'tour_operator':
      return ownerNavigation({ menu: false })
    default:
      // Previously this spread adminNavigation and then appended a second
      // Orders entry, rendering Orders twice with a duplicate React key.
      return adminNavigation
  }
}

export function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navigation, setNavigation] = useState(adminNavigation)
  const [userRole, setUserRole] = useState<string>('Admin')
  const pathname = usePathname()

  useEffect(() => {
    const user = auth.getUser()
    if (user) {
      setNavigation(getRoleNavigation(user.role))
      setUserRole(roleLabels[user.role] || 'Admin')
    }
  }, [])

  // Desktop and mobile rendered identical markup twice; any branding change had
  // to be made in both. One definition now, mounted in two shells.
  const panel = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col bg-charcoal-900">
      <div className="border-b border-charcoal-800 px-5 py-5">
        <Logo className="text-whisky-400 transition-colors hover:text-whisky-300" />
        <p className="mt-2 pl-[3.1rem] text-xs text-charcoal-500">{userRole}</p>
      </div>

      <nav className="scrollbar-hide flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navigation.map((item) => {
          const isActive = isActiveRoute(pathname, item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={onNavigate}
            >
              <item.icon className="mr-3 h-4 w-4 shrink-0" strokeWidth={1.75} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-charcoal-800 px-4 py-4">
        <p className="text-center text-xs text-charcoal-600">Destination Whisky v1.0.0</p>
      </div>
    </div>
  )

  return (
    <>
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          className="rounded-xl bg-charcoal-900 p-2 text-charcoal-200 shadow-card"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-950/60 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <div className="hidden lg:flex lg:w-64 lg:flex-col">{panel()}</div>

      <motion.div
        initial={{ x: -256 }}
        animate={{ x: mobileMenuOpen ? 0 : -256 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-y-0 left-0 z-50 w-64 shadow-lifted lg:hidden"
      >
        {panel(() => setMobileMenuOpen(false))}
      </motion.div>
    </>
  )
}
