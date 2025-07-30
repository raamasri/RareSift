'use client'

import Link from 'next/link'
import { ArrowRightIcon, RocketLaunchIcon, ClockIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function FinalCTA() {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>
      
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Main Headline */}
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Ready to transform your{' '}
            <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              AV development?
            </span>
          </h2>
          
          <p className="mt-6 text-xl leading-8 text-gray-200 max-w-2xl mx-auto">
            Join hundreds of autonomous vehicle teams already using RareSift to accelerate their development cycles.
          </p>

          {/* Value Props */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm mb-4">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Start in Minutes</h3>
              <p className="text-sm text-gray-300">Upload your first video and start searching immediately</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Risk-Free Trial</h3>
              <p className="text-sm text-gray-300">14 days free, no credit card required</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm mb-4">
                <RocketLaunchIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">Instant Results</h3>
              <p className="text-sm text-gray-300">See 90% time savings from day one</p>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/app"
              className="group inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-semibold text-gray-900 shadow-xl hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transform hover:scale-105 transition-all duration-200"
            >
              Start Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/app"
              className="group inline-flex items-center justify-center rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm px-8 py-4 text-lg font-semibold text-white hover:bg-white/20 transition-all duration-200"
            >
              Schedule Demo
            </Link>
          </div>

          {/* Trust Signals */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <p className="text-sm text-gray-300 mb-6">
              Trusted by engineering teams at leading AV companies
            </p>
            <div className="flex items-center justify-center gap-8 opacity-60">
              <div className="h-8 w-24 bg-white/20 rounded"></div>
              <div className="h-8 w-20 bg-white/20 rounded"></div>
              <div className="h-8 w-28 bg-white/20 rounded"></div>
              <div className="h-8 w-16 bg-white/20 rounded"></div>
            </div>
          </div>

          {/* Urgency Elements */}
          <div className="mt-8 inline-flex items-center rounded-full bg-yellow-500/20 border border-yellow-500/30 px-6 py-2 text-sm font-medium text-yellow-200">
            <div className="h-2 w-2 rounded-full bg-yellow-400 mr-3 animate-pulse"></div>
            Limited time: Get 2 months free with annual plans
          </div>
        </div>
      </div>
    </section>
  )
}