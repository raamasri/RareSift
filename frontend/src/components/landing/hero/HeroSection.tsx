'use client'

import Link from 'next/link'
import { ArrowRightIcon, PlayIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useState, useEffect, useRef } from 'react'
import AnimatedBackground from './AnimatedBackground'
import VideoModal from '@/components/ui/video-modal'
import DemoRequestForm from '@/components/forms/demo-request-form'

export default function HeroSection() {
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('HeroSection mounted')
  }, [])

  useEffect(() => {
    console.log('HeroSection isVideoOpen state changed:', isVideoOpen)
  }, [isVideoOpen])

  useEffect(() => {
    // Simple timer to show spline loading state
    const timer = setTimeout(() => {
      setSplineLoaded(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div ref={heroRef} className="relative isolate px-6 pt-14 lg:px-8 min-h-screen flex items-center">
      <AnimatedBackground />
      
      {/* Background gradient */}
      <div
        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-600 to-purple-600 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="mb-8">
              <div className="inline-flex items-center rounded-full bg-indigo-500/20 backdrop-blur-sm px-6 py-2 text-sm font-medium text-indigo-300 ring-1 ring-inset ring-indigo-400/30">
                <SparklesIcon className="mr-2 h-4 w-4" />
                AI-Powered AV Search Platform
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-6">
              Find{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                rare driving scenarios
              </span>{' '}
              in seconds
            </h1>

            {/* Subheading */}
            <p className="text-xl leading-8 text-gray-100 mb-8 max-w-xl">
              Type a description or drop a clip. RareSift searches millions of frames across your private logs and returns synchronized matches you can export to training, simulation, or tests.
            </p>

            {/* Quick Metrics Strip */}
            <div className="flex gap-8 mb-8">
              <div>
                <div className="text-2xl font-bold text-white">&lt; 1s</div>
                <div className="text-sm text-gray-200">median query latency</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">100+</div>
                <div className="text-sm text-gray-200">verified edge-case clips in 24h</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">1-click</div>
                <div className="text-sm text-gray-200">export with full lineage</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/app"
                className="group inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transform hover:scale-105 transition-all duration-200"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button 
                onClick={() => {
                  console.log('See Demo button clicked')
                  setIsVideoOpen(true)
                  console.log('isVideoOpen set to true')
                }}
                className="group inline-flex items-center justify-center rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-gray-900 dark:text-white hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-200"
              >
                <PlayIcon className="mr-2 h-5 w-5" />
                See Demo
              </button>
            </div>

            {/* Privacy Micro Note */}
            <div className="mt-6 flex items-center gap-2 text-sm text-gray-300">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
              <span>Runs in your VPC or on-prem.</span>
            </div>

            {/* Technology Stack */}
            <div className="mt-8 pt-8 border-t border-gray-300">
              <p className="text-sm text-gray-200 mb-4">Built with enterprise-grade technology</p>
              <div className="flex items-center gap-6 text-sm text-gray-200">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  OpenCLIP
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  PostgreSQL
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                  pgvector
                </div>
              </div>
            </div>

            {/* Loading indicator */}
            {!splineLoaded && (
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-200">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
                <span className="animate-pulse">Loading interactive experience...</span>
              </div>
            )}
            
            {splineLoaded && (
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-200">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                </div>
                <span>Scroll to explore more features</span>
              </div>
            )}
          </div>

          {/* Right Column - Visual */}
          <div className="relative">
            <div className="relative rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 p-8 shadow-2xl">
              {/* Mock search interface */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-3 w-3 rounded-full bg-red-400"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  <div className="h-3 w-3 rounded-full bg-green-400"></div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
                      <SparklesIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        "Show me cars turning left in rainy conditions"
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-20 bg-gradient-to-br from-blue-200 to-blue-300 dark:from-blue-800 dark:to-blue-900 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-blue-800 dark:text-blue-200 font-medium">Match 1</div>
                    </div>
                    <div className="h-20 bg-gradient-to-br from-green-200 to-green-300 dark:from-green-800 dark:to-green-900 rounded-lg flex items-center justify-center">
                      <div className="text-xs text-green-800 dark:text-green-200 font-medium">Match 2</div>
                    </div>
                  </div>
                  <div className="text-center py-2">
                    <div className="inline-flex items-center text-sm text-green-600 dark:text-green-400 font-medium">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                      AI-powered semantic search in progress...
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg animate-bounce">
                AI
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div
        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true"
      >
        <div
          className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-purple-600 to-pink-600 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
        />
      </div>

      {/* Modals */}
      <VideoModal 
        isOpen={isVideoOpen}
        onClose={() => setIsVideoOpen(false)}
        title="RareSift Platform Demo"
      />
      
      <DemoRequestForm
        isOpen={isDemoFormOpen}
        onClose={() => setIsDemoFormOpen(false)}
      />
    </div>
  )
}