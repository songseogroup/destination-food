'use client'

import { ExternalLink } from 'lucide-react'

import { RoleGate } from '@/components/RoleGate'
import { HomepageBuilder } from '@/components/HomepageBuilder'
import { SITE_URL, openSite } from '@/lib/site'

/**
 * Homepage builder.
 *
 * Super admins only: this restructures the public homepage for everyone, which
 * is a different weight of change from editing one listing. The backend enforces
 * the same rule (SUPER_ADMIN on update/reorder/delete) — this gate is so the
 * page doesn't render a builder whose every action would 403.
 *
 * The section schema lives in components/SectionEditor.tsx (SECTION_LIBRARY) and
 * must stay in sync with the REGISTRY in project/lib/homepage-sections.tsx.
 */
export default function HomepagePage() {
  return (
    <RoleGate allowedRoles={['super_admin']}>
      <HomepageContent />
    </RoleGate>
  )
}

function HomepageContent() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Homepage builder</h1>
          <p className="mt-1 text-sm text-charcoal-500">
            Reorder, hide and edit the blocks on the public homepage. Changes go live on save.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openSite('/')}
          className="btn-secondary"
          title={`Open ${SITE_URL} in a new tab`}
        >
          <ExternalLink className="h-4 w-4" />
          View site
        </button>
      </div>

      <HomepageBuilder />
    </div>
  )
}
