import React from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import Section from '../../components/ui/Section'

/*
 * PLACEHOLDER MARKETING CONTENT.
 * The stats and team members below carried over from the ByFoods template and
 * are not verified figures or real staff. Replace them with real numbers and
 * real people before this page is treated as fact.
 */
const stats = [
  { number: '120+', label: 'Bars & Distilleries' },
  { number: '400+', label: 'Bookable Experiences' },
  { number: '15k+', label: 'Whisky Lovers' },
  { number: '24/7', label: 'Customer Support' }
]

const values = [
  {
    icon: '🥃',
    title: 'Curated Venues',
    description: 'Every bar and distillery is reviewed by our team before it goes live. No filler listings, no venues we wouldn\'t drink at ourselves.'
  },
  {
    icon: '🗓️',
    title: 'Real Availability',
    description: 'Dates, seats and prices come straight from the venue, so the tasting you book is the tasting you get.'
  },
  {
    icon: '🧭',
    title: 'Local Expertise',
    description: 'Our guides are written by people who spend their weekends touring Australian distilleries — not scraped from a directory.'
  },
  {
    icon: '🤝',
    title: 'Drinking Done Right',
    description: 'We list licensed, 18+ experiences only, and we back the responsible service of alcohol at every venue on the platform.'
  }
]

const team = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Founder',
    image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop',
    bio: 'Former bar owner with 15+ years in Australian hospitality.'
  },
  {
    name: 'Michael Chen',
    role: 'CTO',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop',
    bio: 'Tech enthusiast passionate about building seamless booking experiences.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Partnerships',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop',
    bio: 'Works with venues and distilleries to get their experiences listed.'
  },
  {
    name: 'David Kim',
    role: 'Head of Marketing',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
    bio: 'Creative marketer with a passion for connecting people with the makers.'
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="bg-cream">
        {/* Hero Section */}
        <section className="border-b border-charcoal-200 bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="pill-gold mb-5">Australian whisky, properly explored</span>
              <h1 className="font-display text-4xl font-bold tracking-tight text-ink md:text-5xl">
                About Destination Whisky
              </h1>
              <p className="mx-auto mt-4 max-w-3xl text-xl text-charcoal-600">
                We connect whisky lovers with Australia&apos;s best bars, distilleries and festivals —
                every tasting, tour and masterclass bookable in a few clicks.
              </p>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="mb-2 font-display text-4xl font-bold text-whisky-600 md:text-5xl">
                    {stat.number}
                  </div>
                  <div className="font-medium text-charcoal-600">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="section-title mb-6">
                  Our Story
                </h2>
                <div className="space-y-4 text-lg text-charcoal-600">
                  <p>
                    Destination Whisky was founded in 2020 on a simple observation: the hard part of
                    whisky isn&apos;t the drinking, it&apos;s finding the good stuff. What began as a
                    shared list of favourite Australian bars and distilleries grew into a booking
                    platform used by thousands of drinkers.
                  </p>
                  <p>
                    Our founders came from hospitality and knew both sides of the bar. Venues were
                    turning away curious drinkers because tastings were hard to advertise; drinkers
                    were missing masterclasses happening one suburb away. One place to find and book
                    them fixed both problems at once.
                  </p>
                  <p>
                    Today we list tastings, distillery tours, bar events and festivals across
                    Australia. Prices are in AUD, every booking is confirmed with the venue itself,
                    and nothing goes on the platform that we wouldn&apos;t happily attend.
                  </p>
                </div>
              </div>
              <div className="relative">
                {/* TODO: swap for real photography — this is still the food-delivery stock shot. */}
                <div className="overflow-hidden rounded-3xl border border-charcoal-200 shadow-card">
                  <img
                    src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&h=400&fit=crop"
                    alt="Destination Whisky team"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <Section
          title="Our Values"
          subtitle="These core values guide everything we do and shape the experience we provide to drinkers and venues alike."
          tone="cream"
        >
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="mb-4 text-4xl">{value.icon}</div>
                <h3 className="mb-3 font-display text-xl font-bold text-ink">
                  {value.title}
                </h3>
                <p className="text-charcoal-600">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </Section>

        {/* Our Team */}
        <Section
          title="Meet Our Team"
          subtitle="The people behind Destination Whisky, working to get you closer to the cask."
          tone="white"
        >
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {team.map((member, index) => (
              <div key={index} className="card-interactive overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-64 w-full object-cover"
                />
                <div className="p-6 text-center">
                  <h3 className="mb-1 font-display text-xl font-bold text-ink">
                    {member.name}
                  </h3>
                  <p className="mb-3 font-semibold text-whisky-700">
                    {member.role}
                  </p>
                  <p className="text-sm text-charcoal-600">
                    {member.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Mission & Vision */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-2">
              <div className="gradient-bg rounded-3xl p-8 text-white shadow-gold">
                <h3 className="mb-4 font-display text-2xl font-bold">Our Mission</h3>
                <p className="text-lg text-whisky-50">
                  To make Australia&apos;s whisky scene easy to explore — connecting curious drinkers
                  with the bars, distilleries and festivals near them, and giving venues a
                  straightforward way to fill their tastings.
                </p>
              </div>
              <div className="surface-dark rounded-3xl p-8 shadow-card">
                <h3 className="mb-4 font-display text-2xl font-bold text-white">Our Vision</h3>
                <p className="text-lg text-charcoal-300">
                  To be the first place anyone looks when they want to taste something new — trusted
                  for honest listings, fair AUD pricing, and a deep respect for the people who make
                  and pour the whisky.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-charcoal-200 bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="section-title mb-4">
              Join the Destination Whisky Family
            </h2>
            <p className="mb-8 text-xl text-charcoal-600">
              Experience the difference that passion, curiosity and deep local knowledge make.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/events" className="btn-primary">
                Browse experiences
              </Link>
              <Link href="/feedback" className="btn-secondary">
                Partner with us
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
