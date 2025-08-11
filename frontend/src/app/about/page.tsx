'use client'

import Link from 'next/link'
import { BuildingOfficeIcon, UsersIcon, LightBulbIcon, GlobeAltIcon, TrophyIcon, HeartIcon } from '@heroicons/react/24/outline'

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
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">YC S24</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">San Francisco, CA</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Series Seed</span>
                </div>
              </div>
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">AS</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Alex Smith</h3>
              <p className="text-blue-600 dark:text-blue-400 font-semibold mb-2">Co-Founder & CEO</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Former Waymo ML Engineer. Stanford CS. Led computer vision research for autonomous driving perception systems.
              </p>
              <div className="flex justify-center space-x-3">
                <a href="https://linkedin.com/in/alexsmith" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://twitter.com/alexsmith" className="text-gray-400 hover:text-blue-400 transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-green-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">MJ</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Maya Johnson</h3>
              <p className="text-green-600 dark:text-green-400 font-semibold mb-2">Co-Founder & CTO</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Ex-Tesla Autopilot. MIT PhD in Robotics. Built production ML systems processing petabytes of driving data.
              </p>
              <div className="flex justify-center space-x-3">
                <a href="https://linkedin.com/in/mayajohnson" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://github.com/mayajohnson" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">RK</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Raj Kumar</h3>
              <p className="text-purple-600 dark:text-purple-400 font-semibold mb-2">Head of Engineering</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Former Google Research. Carnegie Mellon MS. Built large-scale distributed systems for ML inference at scale.
              </p>
              <div className="flex justify-center space-x-3">
                <a href="https://linkedin.com/in/rajkumar" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="https://github.com/rajkumar" className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
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

        {/* Investors & Partners */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-600 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <TrophyIcon className="h-6 w-6 text-gold-600 dark:text-yellow-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Backed by the Best</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-center">
              <div className="text-xl font-bold text-orange-600 dark:text-orange-400 mb-1">Y Combinator</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">S24 Batch</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-center">
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-1">Sequoia Capital</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Seed Investor</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-center">
              <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-1">Andreessen Horowitz</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Series A Lead</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 text-center">
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-1">Toyota Ventures</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Strategic Partner</p>
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