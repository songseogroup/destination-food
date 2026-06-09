'use client'

import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { auth } from '@/lib/auth'

interface RoleGateProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function RoleGate({ allowedRoles, children }: RoleGateProps) {
  const user = auth.getUser()
  const isAllowed = user?.role ? allowedRoles.includes(user.role) : false

  if (isAllowed) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <div className="max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-gray-900">Access restricted</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          This area is reserved for a different CMS role. Your dashboard only shows the tools available to your account.
        </p>
        <Link href="/dashboard" className="btn-primary mt-6 inline-flex">
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
