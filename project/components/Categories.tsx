'use client'

import React, { useState, useEffect } from 'react'
import { apiService } from '@/lib/api'
import LoadingSpinner from './LoadingSpinner'

interface Category {
  id: number
  key: string
  label: string
  description?: string
  icon?: string
  sortOrder?: number
}

// Fallback static data if API fails
const fallbackCategories: Category[] = [
  { id: 1, key: 'whisky', label: 'Whisky', icon: '🥃' },
  { id: 2, key: 'cocktails', label: 'Cocktails', icon: '�' },
  { id: 3, key: 'wine', label: 'Wine', icon: '🍷' },
  { id: 4, key: 'beer', label: 'Craft Beer', icon: '🍺' },
  { id: 5, key: 'events', label: 'Events', icon: '�' },
]

const colorMap: Record<string, string> = {
  wine: 'from-purple-400 to-pink-500',
  martini: 'from-blue-400 to-cyan-500',
  grape: 'from-green-400 to-emerald-500',
  beer: 'from-amber-400 to-yellow-500',
  calendar: 'from-pink-400 to-rose-500',
  default: 'from-gray-400 to-gray-600',
}

const iconMap: Record<string, string> = {
  wine: '🥃',
  martini: '🍸',
  grape: '🍷',
  beer: '🍺',
  calendar: '🎉',
  default: '🍽️',
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await apiService.getCategories()
        const data = response.data || []
        if (data.length > 0) {
          setCategories(data)
        } else {
          setCategories(fallbackCategories)
        }
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories')
        setCategories(fallbackCategories)
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  const getColor = (icon: string | undefined) => {
    return colorMap[icon || 'default'] || colorMap.default
  }

  const getIcon = (icon: string | undefined) => {
    return iconMap[icon || 'default'] || iconMap.default
  }

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore by Category
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover premium bars, distilleries, and exclusive experiences
            </p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Explore by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover premium bars, distilleries, and exclusive experiences
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group cursor-pointer"
            >
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${getColor(category.icon)} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                  {getIcon(category.icon)}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 text-center mb-1">
                  {category.label}
                </h3>
                <p className="text-xs text-gray-500 text-center">
                  {category.description || 'Explore venues'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="btn-secondary">
            View All Categories
          </button>
        </div>
      </div>
    </section>
  )
} 