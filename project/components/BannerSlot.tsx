'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../lib/api'

type Slot = 'top_hero' | 'right_rail' | 'mid_inline' | 'featured_above'

interface Banner {
  id: number
  slot: Slot
  title: string
  subtitle?: string
  imageUrl: string
  linkUrl?: string
}

interface BannerSlotProps {
  slot: Slot
  className?: string
  variant?: 'horizontal' | 'vertical'
}

export default function BannerSlot({ slot, className = '', variant = 'horizontal' }: BannerSlotProps) {
  const [banners, setBanners] = useState<Banner[]>([])

  useEffect(() => {
    let cancelled = false
    api
      .get('/banners', { params: { slot } })
      .then((res) => {
        if (cancelled) return
        const data: Banner[] = res.data || []
        setBanners(data)
        // Record impressions for all banners in this slot
        data.forEach((b) => {
          api.post(`/banners/${b.id}/impression`).catch(() => undefined)
        })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [slot])

  if (banners.length === 0) return null

  const handleClick = (id: number) => {
    api.post(`/banners/${id}/click`).catch(() => undefined)
  }

  if (variant === 'vertical') {
    return (
      <aside className={`flex flex-col gap-4 ${className}`}>
        {banners.map((b) => {
          const inner = (
            <div className="relative overflow-hidden rounded-lg group">
              <img
                src={b.imageUrl}
                alt={b.title}
                className="w-full h-64 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-lg">{b.title}</h3>
                {b.subtitle && <p className="text-gray-200 text-sm mt-1">{b.subtitle}</p>}
              </div>
            </div>
          )
          return b.linkUrl ? (
            <Link key={b.id} href={b.linkUrl} target="_blank" onClick={() => handleClick(b.id)}>
              {inner}
            </Link>
          ) : (
            <div key={b.id}>{inner}</div>
          )
        })}
      </aside>
    )
  }

  return (
    <section className={`w-full ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.map((b) => {
            const inner = (
              <div className="relative overflow-hidden rounded-lg group">
                <img
                  src={b.imageUrl}
                  alt={b.title}
                  className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-semibold text-lg">{b.title}</h3>
                  {b.subtitle && <p className="text-gray-200 text-sm mt-1">{b.subtitle}</p>}
                </div>
              </div>
            )
            return b.linkUrl ? (
              <Link key={b.id} href={b.linkUrl} target="_blank" onClick={() => handleClick(b.id)}>
                {inner}
              </Link>
            ) : (
              <div key={b.id}>{inner}</div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
