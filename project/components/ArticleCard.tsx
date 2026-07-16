import React from 'react'
import Link from 'next/link'
import { Clock, User } from 'lucide-react'

export interface ArticleCardProps {
  href: string
  image?: string | null
  title: string
  excerpt?: string | null
  author?: string | null
  readTime?: string | null
  category?: string | null
  featured?: boolean
  className?: string
}

/**
 * Editorial card for blog/journal posts.
 *
 * Deliberately not ListingCard: articles have no rating, price or availability,
 * and forcing them through the listing shape produced the "New"/empty-star and
 * blank price rows that made the old blog grid look broken.
 */
export default function ArticleCard({
  href,
  image,
  title,
  excerpt,
  author,
  readTime,
  category,
  featured,
  className = '',
}: ArticleCardProps) {
  return (
    // h-full: see the note in ListingCard — required for equal card heights
    // inside the carousel, where this Link is not itself the flex/grid item.
    <Link href={href} className={`group block h-full ${className}`}>
      <article className="card-interactive flex h-full flex-col overflow-hidden">
        <div className="relative aspect-[16/10] overflow-hidden bg-charcoal-100">
          {image ? (
            <img
              src={image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-charcoal-100 to-charcoal-200">
              <span className="font-display text-2xl text-charcoal-400">DW</span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex gap-1.5">
            {category && (
              <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-charcoal-700 shadow-soft backdrop-blur">
                {category}
              </span>
            )}
            {featured && (
              <span className="rounded-full bg-whisky-500 px-3 py-1 text-xs font-semibold text-white shadow-soft">
                Featured
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-5">
          <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug text-ink transition-colors group-hover:text-whisky-700">
            {title}
          </h3>
          {excerpt && <p className="line-clamp-2 text-sm text-charcoal-600">{excerpt}</p>}

          <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-charcoal-500">
            {author && (
              <span className="inline-flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                {author}
              </span>
            )}
            {readTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                {readTime}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}

export function ArticleCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton aspect-[16/10] rounded-none" />
      <div className="flex flex-col gap-2.5 p-5">
        <div className="skeleton h-5 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton mt-2 h-3.5 w-32" />
      </div>
    </div>
  )
}
