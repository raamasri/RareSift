'use client'

import { useState } from 'react'
import { APISearchInterface } from '@/components/search/api-search-interface'
import { CheckCircleIcon, PlayIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

interface SearchResult {
  frame_id: number
  video_id: number
  timestamp: number
  similarity: number
  frame_path: string
  frame_url?: string
  metadata: { [key: string]: any }
  video_filename?: string
  video_duration?: number
}

interface SearchResponse {
  search_id: number
  results: SearchResult[]
  total_found: number | string
  search_time_ms: number
  query_text?: string
  filters: { [key: string]: any }
}

export default function InteractiveDemo() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleSearchResults = (results: SearchResponse) => {
    setSearchResults(results)
    setShowResults(true)
  }

  const resetDemo = () => {
    setSearchResults(null)
    setShowResults(false)
  }

  return (
    <div className="py-24 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Live Demo
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Try RareSift Now
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Experience AI-powered scenario search with our live database of processed video frames. 
            Search using natural language or upload an image to find similar scenes.
          </p>
        </div>

        {/* Demo Interface */}
        <div className="mx-auto max-w-6xl">
          <APISearchInterface onSearchResults={handleSearchResults} />
          
          {/* Results Section */}
          {showResults && searchResults && (
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
              {/* Results Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="h-6 w-6 text-green-500" />
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    Found {searchResults.total_found} matching scenarios in {searchResults.search_time_ms}ms
                  </span>
                </div>
                <button
                  onClick={resetDemo}
                  className="text-sm text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Try another search
                </button>
              </div>

              {/* Results Grid */}
              {searchResults.results.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {searchResults.results.map((result, index) => (
                    <div
                      key={result.frame_id}
                      className="group bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 cursor-pointer transform hover:scale-105"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Frame Thumbnail */}
                      <div className="h-48 rounded-lg mb-4 relative overflow-hidden bg-gray-200 dark:bg-gray-600">
                        {result.frame_url ? (
                          <img
                            src={result.frame_url}
                            alt={`Frame from ${result.video_filename}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                            <PlayIcon className="h-12 w-12" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <PlayIcon className="absolute inset-0 h-8 w-8 text-white opacity-80 group-hover:opacity-100 transition-opacity m-auto" />
                        
                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                          {Math.floor(result.timestamp / 60)}:{String(Math.floor(result.timestamp % 60)).padStart(2, '0')}
                        </div>
                        
                        <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          {Math.round((result.similarity || 0) * 100)}% match
                        </div>
                      </div>

                      {/* Frame Info */}
                      <div className="space-y-2">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {result.video_filename || `Frame ${result.frame_id}`}
                        </h3>
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                          <span>Video ID: {result.video_id}</span>
                          <span>Frame: {result.frame_id}</span>
                        </div>
                        {result.metadata && Object.keys(result.metadata).length > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {Object.entries(result.metadata).slice(0, 2).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="capitalize">{key}:</span>
                                <span>{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <p className="text-lg">No matching frames found.</p>
                  <p className="text-sm mt-2">Try adjusting your search query or filters.</p>
                </div>
              )}

              {/* Search Summary */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-8 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Query: "{searchResults.query_text}"</span>
                  </div>
                  <div className="text-gray-300 dark:text-gray-600">•</div>
                  <div>Search ID: {searchResults.search_id}</div>
                  <div className="text-gray-300 dark:text-gray-600">•</div>
                  <div>4,985 frames indexed</div>
                </div>
              </div>
            </div>
          )}

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Ready to Transform Your AV Development?
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
                This demo searches 4,985 frames from 22 videos (9 driving + 13 static cameras). Get access to search through terabytes of your own video data 
                with unlimited uploads, advanced filtering, and enterprise-grade performance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 border border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  Schedule Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}