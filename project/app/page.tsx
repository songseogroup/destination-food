import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AnalyticsView from '../components/AnalyticsView'
import { getHomepageLayout } from '../lib/homepage'
import { renderHomepageSection } from '../lib/homepage-sections'

/**
 * The homepage is CMS-driven.
 *
 * Every block, its order and its copy come from homepage_content via
 * GET /homepage/layout, so a super admin can rearrange the page in the builder
 * without a deploy. Previously this file hardcoded the section order and never
 * read the CMS at all — which meant the Homepage editor in the admin saved
 * happily and changed nothing on the live site.
 *
 * Rendered on the server so the CMS ordering is in the initial HTML and stays
 * indexable. getHomepageLayout falls back to a default layout if the API is
 * unreachable, so the front door never goes blank.
 */
export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const layout = await getHomepageLayout()

  return (
    <div className="min-h-screen bg-cream">
      <AnalyticsView entityType="homepage" />
      <Header />
      <main>{layout.map((section) => renderHomepageSection(section))}</main>
      <Footer />
    </div>
  )
}
