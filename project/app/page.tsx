import React from 'react'
import Header from '../components/Header'
import Banner from '../components/Banner'
import BannerSlot from '../components/BannerSlot'
import FeaturedBars from '../components/FeaturedBars'
import FeaturedDistilleries from '../components/FeaturedDistilleries'
import FeaturedEvents from '../components/FeaturedEvents'
import FeaturedBlogs from '../components/FeaturedBlogs'
import Footer from '../components/Footer'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main>
        <Banner />
        <BannerSlot slot="top_hero" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            <div className="space-y-8">
              <FeaturedBars />
              <FeaturedDistilleries />
              <BannerSlot slot="mid_inline" />
              <FeaturedEvents />
            </div>
            <BannerSlot slot="right_rail" variant="vertical" className="hidden lg:flex" />
          </div>
        </div>
        <BannerSlot slot="featured_above" />
        <FeaturedBlogs />
      </main>
      <Footer />
    </div>
  )
}
