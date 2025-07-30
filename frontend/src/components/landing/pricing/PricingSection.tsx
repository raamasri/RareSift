'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'

const plans = [
  {
    name: 'Starter',
    id: 'starter',
    price: { monthly: 99, annual: 79 },
    description: 'Perfect for small AV teams getting started',
    features: [
      'Up to 1TB of video data',
      '1,000 searches per month', 
      'Basic natural language search',
      'Export up to 100 scenarios/month',
      'Email support',
      'Standard processing speed'
    ],
    limitations: [
      'No advanced analytics',
      'No API access',
      'No custom integrations'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    name: 'Professional',
    id: 'professional', 
    price: { monthly: 299, annual: 239 },
    description: 'For growing teams with serious AV development',
    features: [
      'Up to 10TB of video data',
      '10,000 searches per month',
      'Advanced AI search with context',
      'Unlimited scenario exports',
      'Priority support',
      'Fast processing (2x speed)',
      'Basic analytics dashboard',
      'API access (1,000 calls/month)',
      'Custom metadata fields'
    ],
    limitations: [
      'No white-label options',
      'Limited API rate'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    price: { monthly: 999, annual: 799 },
    description: 'For large organizations with complex needs',
    features: [
      'Unlimited video data storage',
      'Unlimited searches',
      'Enterprise AI with custom models',
      'Unlimited exports & integrations',
      '24/7 dedicated support',
      'Ultra-fast processing (5x speed)',
      'Advanced analytics & reporting',
      'Unlimited API access',
      'Custom integrations',
      'White-label options',
      'On-premise deployment',
      'Custom SLA agreements'
    ],
    limitations: [],
    cta: 'Contact Sales',
    popular: false
  }
]

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="py-24 sm:py-32 bg-white dark:bg-gray-900" id="pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Pricing
          </h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Choose the right plan for your team
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Start with a 14-day free trial. No credit card required. 
            Scale as your autonomous vehicle data grows.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-16 flex justify-center">
          <div className="relative flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                !isAnnual 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative px-6 py-2 text-sm font-medium rounded-lg transition-all ${
                isAnnual 
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Annual
              <span className="ml-2 inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-white dark:bg-gray-800 p-8 shadow-lg ${
                plan.popular 
                  ? 'border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-600 dark:ring-indigo-400' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
                    <StarIcon className="mr-1 h-4 w-4" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {plan.description}
                </p>
                
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-gray-900 dark:text-white">
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className="ml-2 text-lg text-gray-500 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                  {isAnnual && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      ${(plan.price.monthly - plan.price.annual) * 12} saved annually
                    </p>
                  )}
                </div>

                <div className="mt-8">
                  <Link
                    href="/app"
                    className={`block w-full rounded-xl px-6 py-3 text-center text-sm font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>

              {/* Features List */}
              <div className="mt-8">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <CheckIcon className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <li key={limitation} className="flex items-start opacity-60">
                      <XMarkIcon className="mr-3 h-5 w-5 flex-shrink-0 text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {limitation}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* ROI Calculator Teaser */}
        <div className="mt-16 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-8 text-center border border-indigo-200 dark:border-indigo-800">
          <div className="flex justify-center mb-4">
            <SparklesIcon className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Calculate Your ROI
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
            See how much time and money RareSift can save your team. 
            Most customers see 10x ROI within the first quarter.
          </p>
          <Link
            href="/app#roi"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <SparklesIcon className="h-5 w-5" />
            Try ROI Calculator
          </Link>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-16 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Have questions?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Get answers to common questions about pricing, features, and implementation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              View FAQ
            </Link>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:block">•</span>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Schedule Demo
            </Link>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:block">•</span>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}