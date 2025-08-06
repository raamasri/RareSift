'use client'

import Link from 'next/link'
import { BuildingOfficeIcon, UsersIcon, LightBulbIcon, GlobeAltIcon, HeartIcon } from '@heroicons/react/24/outline'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">About RareSift</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Transforming autonomous vehicle development through AI-powered scenario discovery
          </p>
        </div>

        {/* Company Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <BuildingOfficeIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                At RareSift, we believe the future of transportation depends on finding the right edge cases. 
                Our AI-powered platform helps autonomous vehicle teams discover critical driving scenarios 
                faster than ever before.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Founded in 2024, we're building the infrastructure that enables safe, reliable autonomous 
                vehicles by making scenario discovery as simple as a Google search.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600 shadow-sm">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">22</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Videos Indexed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">4,959</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Frames Processed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">1536</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Vector Dimensions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">100%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Embedding Coverage</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <UsersIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meet the Team</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">RS</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Raama Srivatsan</h3>
              <p className="text-blue-600 dark:text-blue-400 font-semibold mb-4">CEO & Co-founder</p>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">KS</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Keshavan Srivatsan</h3>
              <p className="text-green-600 dark:text-green-400 font-semibold mb-4">CTO & Co-founder</p>
            </div>
          </div>
        </div>

        {/* Values & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <LightBulbIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Our Vision</h2>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                We envision a world where autonomous vehicles are deployed safely and confidently, 
                powered by comprehensive understanding of every possible driving scenario.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Safety First</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Every rare scenario discovered brings us closer to truly safe autonomous driving
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">AI-Native Approach</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Leveraging cutting-edge AI to understand and categorize complex driving scenarios
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Developer-Centric</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Building tools that AV engineers actually want to use every day
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <HeartIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Our Values</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔒 Security & Privacy</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  We treat your driving data with the highest level of security and respect for privacy
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">⚡ Performance & Scale</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Our platform is built to handle massive datasets with sub-second search performance
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🤝 Collaboration</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Working closely with AV teams to build exactly what they need
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🚀 Innovation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Constantly pushing the boundaries of what's possible with AI and computer vision
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Technology & Approach */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <GlobeAltIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Technology Stack</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">OpenCLIP</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                State-of-the-art vision-language model for semantic understanding
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">PostgreSQL + pgvector</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                High-performance vector similarity search at scale
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">FastAPI + Redis</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                High-performance API with intelligent caching
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Next.js + Tailwind</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Modern, responsive frontend with excellent UX
              </p>
            </div>
          </div>
        </div>


        {/* Contact & Location */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📍 Get in Touch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">San Francisco HQ</h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div>123 AI Street, Suite 400</div>
                <div>San Francisco, CA 94105</div>
                <div>United States</div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Email:</span>
                  <a href="mailto:hello@raresift.com" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    hello@raresift.com
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Phone:</span>
                  <a href="tel:+1-555-RARESIFT" className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    +1 (555) RARESIFT
                  </a>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Join Our Team</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                We're always looking for talented engineers and researchers passionate about autonomous vehicles and AI.
              </p>
              <div className="space-y-2">
                <Link href="/careers" className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline text-sm">
                  View Open Positions →
                </Link>
                <div>
                  <a href="mailto:careers@raresift.com" className="text-blue-600 dark:text-blue-400 hover:underline text-sm">
                    careers@raresift.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}