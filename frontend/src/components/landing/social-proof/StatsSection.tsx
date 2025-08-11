'use client'

import { useEffect, useState } from 'react'

interface StatProps {
  value: number
  suffix: string
  label: string
  prefix?: string
  duration?: number
}

function AnimatedStat({ value, suffix, label, prefix = '', duration = 2000 }: StatProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    const element = document.getElementById(`stat-${label}`)
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [label])

  useEffect(() => {
    if (!isVisible) return

    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const currentValue = Math.floor(startValue + (value - startValue) * easeOutExpo)
      
      setDisplayValue(currentValue)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    animate()
  }, [isVisible, value, duration])

  return (
    <div id={`stat-${label}`} className="text-center">
      <div className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">
        {prefix}{displayValue.toLocaleString()}{suffix}
      </div>
      <div className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
    </div>
  )
}

const stats = [
  { value: 1536, suffix: '', label: 'Vector Dimensions', prefix: '' },
  { value: 4959, suffix: '', label: 'Embeddings Generated', prefix: '' },
  { value: 90, suffix: '%', label: 'Time Reduction', prefix: 'Up to ' },
  { value: 100, suffix: 'TB+', label: 'Dataset Capacity', prefix: '' }
]

export default function StatsSection() {
  return (
    <div className="py-24 sm:py-32 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Technical Specifications
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Built for scale and precision
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Enterprise-grade AI infrastructure designed for autonomous vehicle data processing
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-16">
          {stats.map((stat, index) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              prefix={stat.prefix}
              duration={2000 + index * 200}
            />
          ))}
        </div>

        {/* Technology Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/20 px-6 py-3 text-sm font-medium text-blue-800 dark:text-blue-400">
            <div className="h-2 w-2 rounded-full bg-blue-500 mr-3"></div>
            Powered by OpenCLIP and PostgreSQL pgvector
          </div>
        </div>
      </div>
    </div>
  )
}