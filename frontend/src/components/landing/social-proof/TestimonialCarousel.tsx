'use client'

import { useState, useEffect } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/solid'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Chen',
    role: 'Senior AV Engineer',
    company: 'TechDrive',
    image: '/api/placeholder/100/100',
    quote: 'RareSift cut our scenario discovery time by 90%. What used to take days now takes minutes. The natural language search is incredibly intuitive.',
    rating: 5,
    metric: '90% time saved'
  },
  {
    id: 2,
    name: 'Marcus Rodriguez', 
    role: 'Head of Data Science',
    company: 'AutonoLogic',
    image: '/api/placeholder/100/100',
    quote: 'The frame-level precision is game-changing. We can find exact moments where edge cases occur, making our training data exponentially more valuable.',
    rating: 5,
    metric: '10x faster edge case discovery'
  },
  {
    id: 3,
    name: 'Dr. Emily Watson',
    role: 'Research Director',
    company: 'Future Mobility Lab',
    image: '/api/placeholder/100/100',
    quote: 'Handling 100TB+ of AV data was a nightmare until RareSift. Now our entire team can search through everything instantly. Absolute game changer.',
    rating: 5,
    metric: '100TB+ data processed'
  }
]

export default function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
  }

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Customer Stories
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Trusted by leading AV teams
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            See how autonomous vehicle companies are accelerating their development with RareSift
          </p>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="min-w-full p-8 sm:p-12">
                  <div className="flex flex-col items-center text-center">
                    {/* Rating */}
                    <div className="flex items-center mb-6">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote className="text-xl font-medium text-gray-900 dark:text-white mb-8 max-w-3xl">
                      "{testimonial.quote}"
                    </blockquote>

                    {/* Profile */}
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {testimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {testimonial.role}, {testimonial.company}
                        </div>
                      </div>
                    </div>

                    {/* Metric */}
                    <div className="mt-6 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-4 py-2 text-sm font-medium text-green-800 dark:text-green-400">
                      ✓ {testimonial.metric}
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
            {testimonials.map((_, index) => (
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