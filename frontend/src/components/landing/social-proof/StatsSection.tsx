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
  { value: 847, suffix: 'K+', label: 'Scenarios Found', prefix: '' },
  { value: 120, suffix: 'TB+', label: 'Data Processed', prefix: '' },
  { value: 90, suffix: '%', label: 'Time Saved', prefix: '' },
  { value: 500, suffix: '+', label: 'AV Engineers', prefix: '' }
]

export default function StatsSection() {
  return (
    <div className="py-24 sm:py-32 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Impact by Numbers
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Accelerating AV development worldwide
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Real metrics from teams using RareSift to power their autonomous vehicle research and development
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

        {/* Live Activity Indicator */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-6 py-3 text-sm font-medium text-green-800 dark:text-green-400">
            <div className="h-2 w-2 rounded-full bg-green-500 mr-3 animate-pulse"></div>
            Live: 23 teams searching scenarios right now
          </div>
        </div>
      </div>
    </div>
  )
}