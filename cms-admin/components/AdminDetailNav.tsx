'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Image, Users, List, Settings, Star, ExternalLink } from 'lucide-react'
import { auth } from '@/lib/auth'
import { isOwnerRole } from '@/lib/roles'
import { listingUrl } from '@/lib/site'

interface AdminDetailNavProps {
  id: string
  type: 'bars' | 'distilleries' | 'events'
  name: string
  /**
   * Unpublished listings 404 on the storefront, so Preview is disabled with an
   * explanation rather than sending the owner to a broken page.
   */
  isActive?: boolean
}

export function AdminDetailNav({ id, type, name, isActive = true }: AdminDetailNavProps) {
  const pathname = usePathname()
  const user = auth.getUser()
  const ownerRole = isOwnerRole(user?.role)

  const baseUrl = `/dashboard/${type}/${id}`
  const publicUrl = listingUrl(type, id)

  const navItems = ownerRole
    ? [{ label: 'Details', href: `${baseUrl}`, icon: Settings }]
    : [
        { label: 'Details', href: `${baseUrl}`, icon: Settings },
        { label: 'Media', href: `${baseUrl}/media`, icon: Image },
        { label: 'Reviews', href: `${baseUrl}/reviews`, icon: Star },
        { label: 'Customers', href: `${baseUrl}/customers`, icon: Users },
        ...(type !== 'events' ? [{ label: 'Menu', href: `${baseUrl}/menu`, icon: List }] : []),
      ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-charcoal-500">
            {type.charAt(0).toUpperCase() + type.slice(1)} Workspace
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">{name}</h1>
        </div>

        {/*
          Preview the live public page. Owners (bar / distillery / event_host /
          tour_operator) only ever see this workspace, so this is their way to
          check how their own listing looks to customers. The CMS and storefront
          are separate origins, so this must be an absolute URL — see lib/site.ts.
        */}
        {isActive ? (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary shrink-0"
            title={`Open ${publicUrl}`}
          >
            <ExternalLink className="h-4 w-4" />
            Preview page
          </a>
        ) : (
          <span
            className="pill shrink-0 cursor-not-allowed"
            title="Publish this listing to preview it on the public site"
          >
            <ExternalLink className="h-4 w-4" />
            Preview unavailable — not published
          </span>
        )}
      </div>

      {!ownerRole && (
        <nav className="flex gap-1 overflow-x-auto border-b border-charcoal-200">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'border-whisky-500 text-whisky-700'
                    : 'border-transparent text-charcoal-500 hover:text-ink'
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
