'use client'

import React, { useState, useEffect } from 'react'
import { BookOpen } from 'lucide-react'
import { apiService } from '../lib/api'
import { Blog } from '../lib/types'
import ArticleCard, { ArticleCardSkeleton } from './ArticleCard'
import Section, { EmptyState } from './ui/Section'
import CardCarousel from './ui/CardCarousel'

/**
 * `content` comes from the CMS (homepage_content.content) via the section
 * registry. Every field is optional and falls back to the shipped copy, so the
 * section still renders correctly if the API is down or a field is blank.
 */
interface FeaturedBlogsProps {
  content?: {
    title?: string
    description?: string
    viewAllLabel?: string
    tone?: 'cream' | 'white'
  }
}

export default function FeaturedBlogs({ content }: FeaturedBlogsProps = {}) {
  const [blogPosts, setBlogPosts] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        // NOTE: do NOT pass `featured: true` here. The /blogs list endpoint uses
        // PaginationDto with forbidNonWhitelisted, so any param other than
        // page/limit returns 400 — which silently emptied this rail. (There is a
        // separate /blogs/featured endpoint, but /blogs?limit gives us the
        // recent posts this "From the Journal" rail wants anyway.)
        const response = await apiService.getBlogs({ limit: 12 })
        setBlogPosts(response.data.data || [])
      } catch (error) {
        console.error('Error fetching featured blogs:', error)
        setBlogPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchBlogs()
  }, [])

  return (
    <Section
      title={content?.title || 'From the Journal'}
      subtitle={content?.description || 'Tasting notes, distillery stories and the odd strong opinion'}
      viewAllHref={blogPosts.length > 0 ? '/blog' : undefined}
      viewAllLabel={content?.viewAllLabel || 'Read the journal'}
      align="left"
      tone={content?.tone || 'white'}
    >
      {loading ? (
        <CardCarousel label="journal posts">
          {[1, 2, 3, 4].map((i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </CardCarousel>
      ) : blogPosts.length > 0 ? (
        <CardCarousel label="journal posts">
          {blogPosts.map((post) => (
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
        </CardCarousel>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-12 w-12" strokeWidth={1.25} />}
          title="No posts yet"
          description="Tasting notes and distillery stories will land here soon."
        />
      )}
    </Section>
  )
}
