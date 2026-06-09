'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Image, Users, List, Settings, Star } from 'lucide-react'
import { auth } from '@/lib/auth'
import { isOwnerRole } from '@/lib/roles'

interface AdminDetailNavProps {
  id: string
  type: 'bars' | 'distilleries' | 'events'
  name: string
}

export function AdminDetailNav({ id, type, name }: AdminDetailNavProps) {
  const pathname = usePathname()
  const user = auth.getUser()
  const ownerRole = isOwnerRole(user?.role)
  
  const baseUrl = `/dashboard/${type}/${id}`
  
  const navItems = ownerRole ? [
    { label: 'Details', href: `${baseUrl}`, icon: Settings },
  ] : [
    { label: 'Details', href: `${baseUrl}`, icon: Settings },
    { label: 'Media', href: `${baseUrl}/media`, icon: Image },
    { label: 'Reviews', href: `${baseUrl}/reviews`, icon: Star },
    { label: 'Customers', href: `${baseUrl}/customers`, icon: Users },
    ...(type !== 'events' ? [{ label: 'Menu', href: `${baseUrl}/menu`, icon: List }] : []),
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
            {type.charAt(0).toUpperCase() + type.slice(1)} Workspace
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-950">{name}</h1>
        </div>
      </div>

      {!ownerRole && (
        <nav className="flex gap-1 overflow-x-auto border-b border-gray-200">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm border-b-2 transition-colors ${
                  isActive
                    ? 'border-gray-950 text-gray-950'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      )}
    </div>
  )
}
