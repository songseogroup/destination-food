'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, Martini, Newspaper, Search, User, Wine, X } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import SitePromoBand from '../../components/SitePromoBand'
import ArticleCard, { ArticleCardSkeleton } from '../../components/ArticleCard'
import { EmptyState } from '../../components/ui/Section'
import { apiService } from '../../lib/api'
import { Blog } from '../../lib/types'

/**
 * Browse shortcuts under the grid.
 *
 * These were food-delivery leftovers ("Pizza Guides", "Restaurant Reviews") with
 * invented article counts — this is a whisky journal, and the counts were never
 * real. Each topic now seeds the existing search filter instead of claiming a
 * number we cannot substantiate from the loaded page of posts.
 */
const POPULAR_TOPICS = [
  {
    icon: Wine,
    title: 'Tasting Notes',
    description: 'Drams pulled apart, nose to finish',
    query: 'tasting',
  },
  {
    icon: Newspaper,
    title: 'Distillery Stories',
    description: 'The people and places behind the pour',
    query: 'distillery',
  },
  {
    icon: BookOpen,
    title: 'Beginner Guides',
    description: 'Start here if whisky is new to you',
    query: 'guide',
  },
  {
    icon: Martini,
    title: 'Cocktails',
    description: 'Whisky serves worth mixing at home',
    query: 'cocktail',
  },
]

export default function BlogPage() {
  const [blogPosts, setBlogPosts] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [categories, setCategories] = useState<string[]>(['All'])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true)
        const response = await apiService.getBlogs({ page: currentPage, limit: 12 })
        setBlogPosts(response.data.data || [])
        setTotalPages(Math.ceil((response.data.total || 0) / 12))
      } catch (error) {
        console.error('Error fetching blogs:', error)
      } finally {
        setLoading(false)
      }
    }

    const fetchCategories = async () => {
      try {
        const response = await apiService.getBlogs({ limit: 100 })
        const allBlogs = (response.data.data || []) as Blog[]
        const uniqueCategories: string[] = ['All', ...Array.from(new Set(allBlogs.map((blog: Blog) => blog.category)))]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }

    fetchBlogs()
    fetchCategories()
  }, [currentPage])

  const filteredBlogs = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const featuredPost = filteredBlogs.find(post => post.featured) || filteredBlogs[0]
  const regularPosts = filteredBlogs.filter(post => post.id !== featuredPost?.id)

  return (
    <div className="min-h-screen bg-cream">
      <Header />
      <main className="bg-cream">
        {/* Hero Section */}
        <section className="border-b border-charcoal-200 bg-white py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <span className="pill-gold uppercase tracking-[0.2em]">The Journal</span>
              <h1 className="section-title mt-5 text-4xl md:text-5xl">
                Stories from the whisky world
              </h1>
              <p className="section-subtitle mt-4">
                Tasting notes, distillery visits, and guides to drinking better — written by the
                people who pour.
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        {/* Site-wide promo — same campaign on every page. */}
        <SitePromoBand className="py-12" />

        <section className="border-b border-charcoal-200 bg-white/70 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-4 lg:flex-row">
              {/* Search */}
              <div className="relative w-full lg:w-96">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400" />
                <input
                  type="search"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search articles"
                  className="input-field rounded-full pl-11 pr-10"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-charcoal-400 transition-colors hover:bg-charcoal-100 hover:text-ink"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="flex flex-wrap justify-center gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      category === selectedCategory
                        ? 'bg-whisky-500 text-white shadow-gold'
                        : 'border border-charcoal-200 bg-white text-charcoal-600 hover:border-charcoal-300 hover:text-ink'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="py-12">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ArticleCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <>
            {/* Featured Post — a wide editorial panel rather than an ArticleCard,
                which is deliberately a fixed 16/10 grid tile. */}
            {featuredPost && (
              <section className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <Link href={`/blog/${featuredPost.id}`} className="group block">
                    <article className="card-interactive overflow-hidden">
                      <div className="grid lg:grid-cols-2">
                        <div className="relative h-64 overflow-hidden bg-charcoal-100 lg:h-full">
                          <img
                            src={featuredPost.image}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                          <div className="absolute left-4 top-4">
                            <span className="rounded-full bg-whisky-500 px-3 py-1 text-xs font-semibold text-white shadow-soft">
                              {featuredPost.featured ? 'Featured' : featuredPost.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col justify-center p-8">
                          <span className="text-sm font-semibold text-whisky-700">
                            {featuredPost.category}
                          </span>
                          <h2 className="mt-3 font-display text-2xl font-bold text-ink transition-colors group-hover:text-whisky-700 md:text-3xl">
                            {featuredPost.title}
                          </h2>
                          <p className="mt-4 text-charcoal-600">{featuredPost.excerpt}</p>
                          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-charcoal-500">
                            <span className="inline-flex items-center gap-1.5">
                              <User className="h-4 w-4" strokeWidth={1.75} />
                              {featuredPost.author}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="h-4 w-4" strokeWidth={1.75} />
                              {featuredPost.readTime}
                            </span>
                            <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                          </div>
                          <span className="btn-primary mt-7 self-start">Read more</span>
                        </div>
                      </div>
                    </article>
                  </Link>
                </div>
              </section>
            )}

            {/* Blog Posts Grid */}
            <section className="py-12">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {regularPosts.length > 0 ? (
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {regularPosts.map((post) => (
                      <ArticleCard
                        key={post.id}
                        href={`/blog/${post.id}`}
                        image={post.image}
                        title={post.title}
                        excerpt={post.excerpt}
                        author={post.author}
                        readTime={post.readTime}
                        category={post.category}
                        featured={post.featured}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Newspaper className="mx-auto h-10 w-10" strokeWidth={1.5} />}
                    title="No articles found"
                    description={
                      searchTerm || selectedCategory !== 'All'
                        ? 'Try a different search or category.'
                        : 'New stories are on the way — check back soon.'
                    }
                  />
                )}
              </div>
            </section>
          </>
        )}

        {/* Newsletter Signup */}
        <section className="border-y border-charcoal-200 bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="section-title">Stay Updated</h2>
            <p className="mt-4 text-lg text-charcoal-600">
              Subscribe for new tasting notes, distillery stories, and first word on tickets.
            </p>
            <div className="mx-auto mt-8 flex max-w-md flex-col gap-4 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
                className="input-field flex-1 rounded-full"
              />
              <button className="btn-primary whitespace-nowrap">Subscribe</button>
            </div>
          </div>
        </section>

        {/* Popular Topics */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <h2 className="section-title">Popular Topics</h2>
              <p className="section-subtitle mt-3">Explore the journal by what you feel like reading</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {POPULAR_TOPICS.map((topic) => {
                const Icon = topic.icon
                return (
                  <button
                    key={topic.title}
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All')
                      setSearchTerm(topic.query)
                    }}
                    className="card-interactive group p-6 text-center"
                  >
                    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-whisky-100 text-whisky-600 transition-colors group-hover:bg-whisky-500 group-hover:text-white">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <h3 className="font-display text-lg font-bold text-ink">{topic.title}</h3>
                    <p className="mt-1.5 text-sm text-charcoal-600">{topic.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <section className="border-t border-charcoal-200 bg-white py-8">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center">
                <nav className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full px-3 py-2 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-100 hover:text-ink disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        aria-current={currentPage === page ? 'page' : undefined}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                          currentPage === page
                            ? 'bg-whisky-500 text-white'
                            : 'text-charcoal-600 hover:bg-charcoal-100 hover:text-ink'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  {totalPages > 5 && <span className="px-2 py-2 text-charcoal-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full px-3 py-2 text-sm font-medium text-charcoal-600 transition-colors hover:bg-charcoal-100 hover:text-ink disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
