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
import Image from 'next/image'

// Import demo frame images
import drive01Frame000 from '@/assets/demo-frames/drive_01_frame_000.jpg'
import drive01Frame001 from '@/assets/demo-frames/drive_01_frame_001.jpg'
import drive01Frame002 from '@/assets/demo-frames/drive_01_frame_002.jpg'
import drive02Frame000 from '@/assets/demo-frames/drive_02_frame_000.jpg'
import drive02Frame001 from '@/assets/demo-frames/drive_02_frame_001.jpg'
import drive02Frame002 from '@/assets/demo-frames/drive_02_frame_002.jpg'
import static03Frame000 from '@/assets/demo-frames/static_03_frame_000.jpg'
import static04Frame000 from '@/assets/demo-frames/static_04_frame_000.jpg'
import static04Frame001 from '@/assets/demo-frames/static_04_frame_001.jpg'

// Real demo data from processed videos
const demoQueries = [
  "cars turning left in intersection",
  "pedestrians crossing street", 
  "vehicles in rainy conditions",
  "urban street scenes",
  "highway driving footage"
]

// Demo metadata - will be loaded from processed videos
const demoScenarios = [
  {
    query: "cars turning left in intersection",
    results: [
      {
        id: "drive_01_10s",
        title: "Urban_Intersection_Left_Turn",
        timestamp: "00:00:10",
        confidence: 94,
        video_source: "GH010001.MP4",
        frame_image: drive01Frame000,
        category: "traffic_maneuvers"
      },
      {
        id: "drive_02_30s", 
        title: "City_Street_Turn_Scenario",
        timestamp: "00:00:30",
        confidence: 89,
        video_source: "GH010002.MP4", 
        frame_image: drive02Frame001,
        category: "traffic_maneuvers"
      },
      {
        id: "static_04_30s",
        title: "Intersection_Camera_View",
        timestamp: "00:00:30", 
        confidence: 86,
        video_source: "GH010032.MP4",
        frame_image: static04Frame001,
        category: "traffic_maneuvers"
      }
    ]
  },
  {
    query: "pedestrians crossing street",
    results: [
      {
        id: "drive_01_30s",
        title: "Pedestrian_Crosswalk_Scene", 
        timestamp: "00:00:30",
        confidence: 91,
        video_source: "GH010001.MP4",
        frame_image: drive01Frame001,
        category: "pedestrian_activity"
      },
      {
        id: "drive_02_60s",
        title: "Urban_Pedestrian_Activity",
        timestamp: "00:01:00", 
        confidence: 87,
        video_source: "GH010002.MP4",
        frame_image: drive02Frame002,
        category: "pedestrian_activity"
      }
    ]
  },
  {
    query: "vehicles in rainy conditions", 
    results: [
      {
        id: "drive_01_60s",
        title: "Wet_Road_Driving_Conditions",
        timestamp: "00:01:00",
        confidence: 93,
        video_source: "GH010001.MP4", 
        frame_image: drive01Frame002,
        category: "weather_conditions"
      },
      {
        id: "static_03_10s",
        title: "Rainy_Day_Traffic_Cam",
        timestamp: "00:00:10",
        confidence: 88,
        video_source: "GH010031.MP4",
        frame_image: static03Frame000, 
        category: "weather_conditions"
      }
    ]
  },
  {
    query: "urban street scenes",
    results: [
      {
        id: "drive_02_10s", 
        title: "City_Street_Navigation",
        timestamp: "00:00:10",
        confidence: 92,
        video_source: "GH010002.MP4",
        frame_image: drive02Frame000,
        category: "urban_driving"
      },
      {
        id: "static_04_10s",
        title: "Urban_Traffic_Overview",
        timestamp: "00:00:10", 
        confidence: 85,
        video_source: "GH010032.MP4",
        frame_image: static04Frame000,
        category: "urban_driving"
      }
    ]
  }
]

export default function InteractiveDemo() {
  const [currentQuery, setCurrentQuery] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [currentResults, setCurrentResults] = useState<any[]>([])

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
    
    // Find matching scenario for current query
    const scenario = demoScenarios.find(s => s.query === searchText.toLowerCase()) 
                    || demoScenarios[currentQuery] 
                    || demoScenarios[0]
    
    setTimeout(() => {
      setCurrentResults(scenario.results)
      setIsSearching(false)
      setShowResults(true)
    }, 1500)
  }

  const resetDemo = () => {
    setShowResults(false)
    setIsSearching(false)
    setCurrentResults([])
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
                          Found {currentResults.length} matching scenarios in 0.3 seconds
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
                      {currentResults.map((result, index) => (
                        <div
                          key={result.id}
                          className="group bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          {/* Real Video Thumbnail */}
                          <div className="h-32 rounded-lg mb-3 relative overflow-hidden bg-gray-200 dark:bg-gray-600">
                            <Image
                              src={result.frame_image}
                              alt={result.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                            <PlayIcon className="absolute inset-0 h-8 w-8 text-white opacity-80 group-hover:opacity-100 transition-opacity m-auto" />
                            
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
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
                            <div>Source: {result.video_source}</div>
                            <div>Category: {result.category.replace('_', ' ')}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                      <button className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium transition-colors">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                        Export Selected ({currentResults.length})
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