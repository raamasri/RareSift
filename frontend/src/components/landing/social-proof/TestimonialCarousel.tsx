'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid'

const capabilities = [
  {
    id: 1,
    title: 'Reduce Discovery Time by 90%',
    icon: '⚡',
    description: 'Transform days of manual video review into minutes of AI-powered search. Our natural language processing understands exactly what scenarios you need.',
    benefit: 'Save weeks of engineering time',
    use_case: 'Instead of manually scrubbing through hours of footage, simply ask: "Show me cars turning left in rainy conditions"'
  },
  {
    id: 2,
    title: 'Frame-Level Precision Discovery',
    icon: '🎯',
    description: 'Pinpoint exact moments where critical scenarios occur. Find edge cases and safety events with unprecedented accuracy for training data.',
    benefit: 'Build better AI models faster',
    use_case: 'Locate the exact 3-second window where a pedestrian unexpectedly enters the roadway'
  },
  {
    id: 3,
    title: 'Scale to 100TB+ Datasets',
    icon: '📊',
    description: 'Handle massive autonomous vehicle datasets efficiently. Our platform is built to process and search through enterprise-scale data volumes.',
    benefit: 'No limits on your data growth',
    use_case: 'Search across months of continuous driving data from your entire fleet simultaneously'
  }
]

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % capabilities.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + capabilities.length) % capabilities.length)
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % capabilities.length)
    setIsAutoPlaying(false)
  }

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Core Capabilities
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Built for AV teams like yours
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Discover how RareSift can transform your autonomous vehicle development process
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {capabilities.map((capability) => (
                <div key={capability.id} className="min-w-full p-8 sm:p-12">
                  <div className="flex flex-col items-center text-center">
                    {/* Icon */}
                    <div className="text-6xl mb-6">
                      {capability.icon}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      {capability.title}
                    </h3>

                    {/* Description */}
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl">
                      {capability.description}
                    </p>

                    {/* Use Case Example */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 mb-6 max-w-2xl">
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100 mb-2">
                        Real-world example:
                      </p>
                      <p className="text-sm text-indigo-700 dark:text-indigo-300 italic">
                        "{capability.use_case}"
                      </p>
                    </div>

                    {/* Benefit */}
                    <div className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-6 py-3 text-sm font-medium text-green-800 dark:text-green-400">
                      ✓ {capability.benefit}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-gray-700/80 p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 dark:bg-gray-700/80 p-2 shadow-lg hover:bg-white dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronRightIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 gap-2">
            {capabilities.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentIndex 
                    ? 'bg-indigo-600 dark:bg-indigo-400' 
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}