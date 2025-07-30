'use client'

import { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  PlayIcon, 
  ArrowDownTrayIcon,
  ClockIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline'
import Link from 'next/link'

const demoQueries = [
  "Cars turning left in rainy conditions",
  "Pedestrians crossing at night", 
  "Emergency vehicle approaching",
  "Construction zone navigation",
  "Highway merge scenarios"
]

const mockResults = [
  {
    id: 1,
    title: "Rain_Left_Turn_Scenario_001",
    timestamp: "00:02:15",
    confidence: 95,
    weather: "Heavy Rain",
    time: "Evening",
    thumbnail: "bg-gradient-to-br from-blue-400 to-blue-600"
  },
  {
    id: 2,
    title: "Urban_Turn_Wet_Road_045",
    timestamp: "00:01:32",
    confidence: 92,
    weather: "Light Rain",
    time: "Afternoon", 
    thumbnail: "bg-gradient-to-br from-slate-400 to-slate-600"
  },
  {
    id: 3,
    title: "Intersection_Rain_Left_089",
    timestamp: "00:04:21",
    confidence: 88,
    weather: "Drizzle",
    time: "Morning",
    thumbnail: "bg-gradient-to-br from-emerald-400 to-emerald-600"
  }
]

export default function InteractiveDemo() {
  const [currentQuery, setCurrentQuery] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSearching && !showResults) {
        setCurrentQuery((prev) => (prev + 1) % demoQueries.length)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isSearching, showResults])

  useEffect(() => {
    setSearchText(demoQueries[currentQuery])
  }, [currentQuery])

  const handleSearch = () => {
    setIsSearching(true)
    setShowResults(false)
    
    setTimeout(() => {
      setIsSearching(false)
      setShowResults(true)
    }, 1500)
  }

  const resetDemo = () => {
    setShowResults(false)
    setIsSearching(false)
    setCurrentQuery((prev) => (prev + 1) % demoQueries.length)
  }

  return (
    <div className="py-24 sm:py-32 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Interactive Demo
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            See RareSift in action
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Try searching for specific driving scenarios using natural language. 
            Click search to see how quickly our AI finds relevant footage.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          {/* Demo Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            {/* Search Bar */}
            <div className="mb-8">
              <div className="relative">
                <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none text-lg"
                    placeholder="Describe the scenario you're looking for..."
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {isSearching ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <MagnifyingGlassIcon className="h-4 w-4" />
                        Search
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Search Suggestions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Try:</span>
                {demoQueries.slice(0, 3).map((query, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchText(query)}
                    className="text-sm bg-gray-100 dark:bg-gray-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-1 rounded-full transition-colors"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Section */}
            {(isSearching || showResults) && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
                {isSearching ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                      <div className="h-8 w-8 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
                      <span className="text-lg font-medium">AI searching through terabytes of data...</span>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Results Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                        <span className="text-lg font-medium text-gray-900 dark:text-white">
                          Found {mockResults.length} matching scenarios in 0.3 seconds
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
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {mockResults.map((result, index) => (
                        <div
                          key={result.id}
                          className="group bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {/* Thumbnail */}
                          <div className={`h-32 rounded-lg mb-3 ${result.thumbnail} flex items-center justify-center relative overflow-hidden`}>
                            <PlayIcon className="h-8 w-8 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                              {result.timestamp}
                            </div>
                            <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                              {result.confidence}% match
                            </div>
                          </div>

                          {/* Details */}
                          <h3 className="font-medium text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {result.title}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <div>Weather: {result.weather}</div>
                            <div>Time: {result.time}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                      <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium transition-colors">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Export Selected (3)
                      </button>
                      <Link
                        href="/app"
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors justify-center"
                      >
                        <PlayIcon className="h-5 w-5" />
                        Try Full Platform
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Demo Stats */}
          {!isSearching && !showResults && (
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl px-8 py-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4" />
                  Average search time: 0.3s
                </div>
                <div className="text-gray-300 dark:text-gray-600">•</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  95%+ accuracy rate
                </div>
                <div className="text-gray-300 dark:text-gray-600">•</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  1TB+ data indexed
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}