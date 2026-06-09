'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  BarChart3,
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

const isActiveRoute = (pathname: string, href: string) => {
  if (href === '/dashboard') {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

const superAdminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Homepage', href: '/dashboard/homepage', icon: Home },
  { name: 'Banners', href: '/dashboard/admin/banners', icon: ImageIcon },
  { name: 'Vendors', href: '/dashboard/admin/vendors', icon: Store },
  { name: 'Bars', href: '/dashboard/bars', icon: BarChart3 },
  { name: 'Distilleries', href: '/dashboard/distilleries', icon: MapPin },
  { name: 'Events', href: '/dashboard/events', icon: Calendar },
  { name: 'Blogs', href: '/dashboard/blogs', icon: FileText },
  { name: 'Media', href: '/dashboard/media', icon: Upload },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Payout Review', href: '/dashboard/admin/payouts', icon: ShieldCheck },
  { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
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

const getRoleNavigation = (role: string) => {
  switch (role) {
    case 'super_admin':
      return superAdminNavigation
    case 'admin':
      return adminNavigation
    case 'bar':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Listing', href: '/dashboard/details', icon: Edit },
        { name: 'Media', href: '/dashboard/media', icon: Upload },
        { name: 'Menu', href: '/dashboard/menu', icon: List },
        { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
        { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
        { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    case 'distillery':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Listing', href: '/dashboard/details', icon: Edit },
        { name: 'Media', href: '/dashboard/media', icon: Upload },
        { name: 'Menu', href: '/dashboard/menu', icon: List },
        { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
        { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
        { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    case 'event_host':
    case 'tour_operator':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Listing', href: '/dashboard/details', icon: Edit },
        { name: 'Media', href: '/dashboard/media', icon: Upload },
        { name: 'Reviews', href: '/dashboard/reviews', icon: Star },
        { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
        { name: 'Finance', href: '/dashboard/finance', icon: DollarSign },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    default:
      return [
        ...adminNavigation,
        { name: 'Orders', href: '/dashboard/orders', icon: ShoppingCart },
      ]
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

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-white shadow-md"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BF</span>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">ByFoods CMS</h1>
                <p className="text-xs text-gray-500">{userRole} Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isActiveRoute(pathname, item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              ByFoods CMS v1.0.0
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <motion.div
        initial={{ x: -256 }}
        animate={{ x: mobileMenuOpen ? 0 : -256 }}
        transition={{ duration: 0.3 }}
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BF</span>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-semibold text-gray-900">ByFoods CMS</h1>
                <p className="text-xs text-gray-500">{userRole} Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = isActiveRoute(pathname, item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              ByFoods CMS v1.0.0
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
