'use client'

import Link from 'next/link'
import { BriefcaseIcon, UsersIcon, HeartIcon } from '@heroicons/react/24/outline'

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Careers at RareSift</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Help us build the future of autonomous vehicle development
          </p>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-12 text-center">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-6">
            <BriefcaseIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Coming Soon</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
            We're currently building our team and will be posting exciting opportunities soon. 
            Join us in revolutionizing how autonomous vehicle teams discover and validate critical driving scenarios.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
              <UsersIcon className="h-8 w-8 text-green-600 dark:text-green-400 mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Collaborative Culture</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Work with world-class engineers and researchers</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
              <HeartIcon className="h-8 w-8 text-red-600 dark:text-red-400 mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mission-Driven</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Help make autonomous vehicles safer for everyone</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-600">
              <BriefcaseIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-3 mx-auto" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Growth Opportunity</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Build cutting-edge AI products at scale</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Interested in joining our team? Get in touch!
            </p>
            <a 
              href="mailto:careers@raresift.com" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Email us at careers@raresift.com
            </a>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/about" className="text-blue-600 dark:text-blue-400 hover:underline mr-4">
            ← Learn About Our Team
          </Link>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Home →
          </Link>
        </div>
      </div>
    </div>
  )
}