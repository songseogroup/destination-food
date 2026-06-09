'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiService } from '../lib/api'
import { Blog } from '../lib/types'

export default function FeaturedBlogs() {
  const [blogPosts, setBlogPosts] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await apiService.getBlogs({ limit: 3, featured: true })
        setBlogPosts(response.data.data || [])
      } catch (error) {
        console.error('Error fetching featured blogs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [])
  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Latest Blog Posts
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Stay updated with the latest trends in nightlife, spirits, and entertainment
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : blogPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
            <Link 
              key={post.id} 
              href={`/blog/${post.id}`}
              className="group cursor-pointer block"
            >
              <div className="bg-black rounded-xl shadow-lg overflow-hidden hover:shadow-yellow-500/20 transition-shadow">
                <div className="relative h-48">
                  <div 
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                    style={{ backgroundImage: `url(${post.image})` }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-primary-500 text-black text-xs rounded-full font-semibold">
                      {post.category}
                    </span>
                  </div>
                  {post.featured && (
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-yellow-500 text-black text-xs rounded-full font-semibold">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-500 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <span className="mr-2">👤</span>
                      {post.author}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">📖</span>
                      {post.readTime}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      {new Date(post.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-primary-500 font-semibold">
                      Read More →
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No blog posts available</p>
          </div>
        )}

        <div className="text-center mt-12">
          <Link 
            href="/blog" 
            className="btn-secondary text-lg px-8 py-3"
          >
            View All Posts
          </Link>
        </div>
      </div>
    </section>
  )
}
