'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import { apiService } from '../../lib/api'
import { Blog } from '../../lib/types'
import LoadingSpinner from '../../components/LoadingSpinner'

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
    <div className="min-h-screen bg-black">
      <Header />
      <main className="bg-black">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-500 to-primary-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                ByFoods Blog
              </h1>
              <p className="text-xl text-black/80 max-w-2xl mx-auto">
                Discover the latest in nightlife, spirits, events, and entertainment culture
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="py-8 bg-gray-900 border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative w-full lg:w-96">
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      category === selectedCategory
                        ? 'bg-primary-500 text-black' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
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
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <section className="py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <Link href={`/blog/${featuredPost.id}`}>
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                      <div className="grid lg:grid-cols-2">
                        <div className="relative h-64 lg:h-full">
                          <img 
                            src={featuredPost.image} 
                            alt={featuredPost.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                              {featuredPost.featured ? 'Featured' : featuredPost.category}
                            </span>
                          </div>
                        </div>
                        <div className="p-8 flex flex-col justify-center">
                          <div className="mb-4">
                            <span className="text-primary-600 font-semibold text-sm">
                              {featuredPost.category}
                            </span>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                            {featuredPost.title}
                          </h2>
                          <p className="text-gray-600 mb-6">
                            {featuredPost.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>By {featuredPost.author}</span>
                              <span>•</span>
                              <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{featuredPost.readTime}</span>
                            </div>
                            <span className="btn-primary">
                              Read More
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </section>
            )}

            {/* Blog Posts Grid */}
            <section className="py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {regularPosts.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {regularPosts.map((post) => (
                      <Link key={post.id} href={`/blog/${post.id}`}>
                        <article className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer">
                          <div className="relative h-48">
                            <img 
                              src={post.image} 
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-4 left-4">
                              <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                {post.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {post.excerpt}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                              <span>By {post.author}</span>
                              <span>{new Date(post.date).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">
                                {post.readTime}
                              </span>
                              <span className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                                Read More →
                              </span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No blog posts found</p>
                  </div>
                )}
              </div>
            </section>
          </>
        )}


        {/* Newsletter Signup */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Subscribe to our newsletter for the latest food trends, restaurant guides, and exclusive content
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="btn-primary whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </section>

        {/* Popular Topics */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Popular Topics
              </h2>
              <p className="text-lg text-gray-600">
                Explore our most-read content categories
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '🍕', title: 'Pizza Guides', count: '12 articles' },
                { icon: '🥗', title: 'Healthy Eating', count: '8 articles' },
                { icon: '🌍', title: 'International Cuisine', count: '15 articles' },
                { icon: '🏆', title: 'Restaurant Reviews', count: '20 articles' }
              ].map((topic, index) => (
                <div key={index} className="bg-white rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                  <div className="text-4xl mb-4">{topic.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {topic.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {topic.count}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <section className="py-8 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === page
                            ? 'bg-primary-500 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  {totalPages > 5 && <span className="px-3 py-2 text-gray-500">...</span>}
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50"
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