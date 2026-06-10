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
        <FeaturedBars />
        <BannerSlot slot="mid_inline" />
        <FeaturedDistilleries />
        <BannerSlot slot="featured_above" />
        <FeaturedEvents />
        <BannerSlot slot="right_rail" />
        <FeaturedBlogs />
      </main>
      <Footer />
    </div>
  )
}
