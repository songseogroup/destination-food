'use client'

import React, { useState, useEffect } from 'react'
import { apiService } from '@/lib/api'
import LoadingSpinner from './LoadingSpinner'

interface Step {
  id: number
  key: string
  label: string
  description?: string
  icon?: string
  sortOrder?: number
}

// Fallback static data if API fails
const fallbackSteps: Step[] = [
  {
    id: 1,
    key: 'step_1',
    label: 'Choose Experience',
    description: 'Browse and select from our curated collection of premium bars, distilleries, and exclusive events.',
    icon: 'search',
  },
  {
    id: 2,
    key: 'step_2',
    label: 'Book Instantly',
    description: 'Reserve your spot with our seamless booking system. Get instant confirmation.',
    icon: 'calendar-check',
  },
  {
    id: 3,
    key: 'step_3',
    label: 'Enjoy & Share',
    description: 'Experience the finest nightlife and share memorable moments with friends.',
    icon: 'star',
  },
]

const colorMap: Record<string, string> = {
  search: 'from-blue-400 to-blue-600',
  'calendar-check': 'from-green-400 to-green-600',
  star: 'from-orange-400 to-orange-600',
  calendar: 'from-purple-400 to-purple-600',
  default: 'from-gray-400 to-gray-600',
}

const iconMap: Record<string, string> = {
  search: '🔍',
  'calendar-check': '📅',
  star: '⭐',
  calendar: '📆',
  default: '✨',
}

export default function HowItWorks() {
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSteps = async () => {
      try {
        const response = await apiService.getHowItWorks()
        const data = response.data || []
        if (data.length > 0) {
          setSteps(data)
        } else {
          setSteps(fallbackSteps)
        }
      } catch (err) {
        console.error('Error fetching how it works steps:', err)
        setSteps(fallbackSteps)
      } finally {
        setLoading(false)
      }
    }

    fetchSteps()
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover premium nightlife experiences in just a few simple steps
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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover premium nightlife experiences in just a few simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              {/* Step Number */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-bold z-10">
                {index + 1}
              </div>

              {/* Step Card */}
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 relative">
                {/* Icon */}
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br ${getColor(step.icon)} flex items-center justify-center text-3xl`}>
                  {getIcon(step.icon)}
                </div>

                {/* Content */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {step.label}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary-400 to-primary-600 transform -translate-y-1/2 z-0"></div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl p-8 md:p-12 text-white">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Explore?
            </h3>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Join thousands of enthusiasts discovering the finest bars, distilleries, and exclusive events
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-primary-600 font-semibold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
                Start Exploring
              </button>
              <button className="border-2 border-white text-white font-semibold py-3 px-8 rounded-lg hover:bg-white hover:text-primary-600 transition-colors">
                View Events
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 