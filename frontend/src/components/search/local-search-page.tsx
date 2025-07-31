'use client'

import { useState } from 'react'
import { LocalSearchInterface } from './local-search-interface'
import Image from 'next/image'
import { 
  ClockIcon, 
  CheckIcon,
  EyeIcon,
  SparklesIcon,
  PlayIcon,
  FilmIcon,
  VideoCameraIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import VideoPlayer from '@/components/video/video-player'

interface SearchResult {
  id: string
  frame_image: any
  confidence: number
  video_source: string
  timestamp: number
  metadata: {
    weather: string
    time_of_day: string
    location: string
    category: string
  }
}

interface SearchResponse {
  results: SearchResult[]
  total_found: number
  search_time_ms: number
}

export function LocalSearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [selectedFrames, setSelectedFrames] = useState<Set<string>>(new Set())
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null)
  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(0)

  const handleSearchResults = (results: SearchResponse) => {
    setSearchResults(results)
    setSelectedFrames(new Set())
  }

  const toggleFrameSelection = (frameId: string) => {
    const newSelection = new Set(selectedFrames)
    if (newSelection.has(frameId)) {
      newSelection.delete(frameId)
    } else {
      newSelection.add(frameId)
    }
    setSelectedFrames(newSelection)
  }

  const selectAll = () => {
    if (searchResults) {
      setSelectedFrames(new Set(searchResults.results.map(r => r.id)))
    }
  }

  const clearSelection = () => {
    setSelectedFrames(new Set())
  }

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSimilarityColor = (confidence: number) => {
    if (confidence >= 90) return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20'
    if (confidence >= 80) return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20'
    if (confidence >= 70) return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/20'
    return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800'
  }

  const getSimilarityLabel = (confidence: number) => {
    if (confidence >= 90) return 'Excellent'
    if (confidence >= 80) return 'Good'
    if (confidence >= 70) return 'Fair'
    return 'Low'
  }

  const getCategoryIcon = (category: string) => {
    return category === 'driving_camera' ? VideoCameraIcon : MapPinIcon
  }

  const getCategoryLabel = (category: string) => {
    return category === 'driving_camera' ? 'Driving Camera' : 'Static Camera'
  }

  const handlePlayVideo = (result: SearchResult) => {
    // Extract video ID from video_source filename (e.g., "GH010001.MP4" -> 1)
    const videoSource = result.video_source
    let videoId = 1 // default fallback
    
    if (videoSource.includes('GH010001')) videoId = 1
    else if (videoSource.includes('GH010002')) videoId = 2
    else if (videoSource.includes('GH010003')) videoId = 3
    else if (videoSource.includes('GH010004')) videoId = 4
    else if (videoSource.includes('GH010005')) videoId = 5
    else if (videoSource.includes('GH010006')) videoId = 6
    else if (videoSource.includes('GH010007')) videoId = 7
    else if (videoSource.includes('GH010010')) videoId = 8
    else if (videoSource.includes('GH020010')) videoId = 9
    else if (videoSource.includes('GH010031')) videoId = 10
    else if (videoSource.includes('GH010032')) videoId = 11
    else if (videoSource.includes('GH010033')) videoId = 12
    else if (videoSource.includes('GH010034')) videoId = 13
    else if (videoSource.includes('GH010035')) videoId = 14
    else if (videoSource.includes('GH010036')) videoId = 15
    else if (videoSource.includes('GH010037')) videoId = 16
    else if (videoSource.includes('GH010038')) videoId = 17
    else if (videoSource.includes('GH010039')) videoId = 18
    else if (videoSource.includes('GH010041')) videoId = 19
    else if (videoSource.includes('GH010042')) videoId = 20
    else if (videoSource.includes('GH010043')) videoId = 21
    else if (videoSource.includes('GH010045')) videoId = 22
    
    setSelectedVideoId(videoId)
    setSelectedTimestamp(result.timestamp)
  }

  return (
    <div className="space-y-8">
      {/* Search Interface */}
      <LocalSearchInterface onSearchResults={handleSearchResults} />
      
      {/* Search Results */}
      {searchResults && (
        <div className="space-y-6">
          {/* Results Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Search Results</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                  Found {searchResults.total_found} matching frames in {searchResults.search_time_ms}ms
                </p>
              </div>
              
              {searchResults.results.length > 0 && (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {selectedFrames.size} selected
                  </span>
                  <button
                    onClick={selectAll}
                    className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
                  >
                    Select All
                  </button>
                  {selectedFrames.size > 0 && (
                    <button
                      onClick={clearSelection}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {selectedFrames.size > 0 && (
              <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                    {selectedFrames.size} frames selected for export
                  </span>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
                    Export Selected
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Results Grid */}
          {searchResults.results.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-indigo-100 dark:from-slate-700 dark:to-indigo-900 rounded-3xl flex items-center justify-center mb-6">
                <SparklesIcon className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No Results Found</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6 max-w-md mx-auto">
                Try adjusting your search query or filters to find matching scenarios in your video collection.
              </p>
              <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                <div>💡 Try broader terms like "highway", "intersection", or "cars"</div>
                <div>🔍 Adjust similarity threshold in advanced filters</div>
                <div>📁 Check that your search covers the right camera type</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {searchResults.results.map((result) => {
                const isSelected = selectedFrames.has(result.id)
                const CategoryIcon = getCategoryIcon(result.metadata.category)
                
                return (
                  <div
                    key={result.id}
                    className={clsx(
                      'bg-white dark:bg-slate-800 rounded-xl shadow-sm border transition-all duration-200 overflow-hidden hover:shadow-md hover:scale-105',
                      isSelected 
                        ? 'border-indigo-500 ring-2 ring-indigo-500 ring-opacity-50'
                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                    )}
                  >
                    {/* Frame Image */}
                    <div className="relative">
                      <div className="aspect-video bg-slate-100 dark:bg-slate-700 relative">
                        <Image
                          src={result.frame_image}
                          alt={`Frame from ${result.video_source}`}
                          fill
                          className="object-cover"
                        />
                        
                        {/* Confidence Badge */}
                        <div className={clsx(
                          'absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium',
                          getSimilarityColor(result.confidence)
                        )}>
                          {result.confidence.toFixed(0)}% {getSimilarityLabel(result.confidence)}
                        </div>
                        
                        {/* Selection Checkbox */}
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={() => toggleFrameSelection(result.id)}
                            className={clsx(
                              'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors',
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-300 hover:border-indigo-400'
                            )}
                          >
                            {isSelected && <CheckIcon className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        {/* Play Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-20">
                          <button 
                            onClick={() => handlePlayVideo(result)}
                            className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-colors hover:scale-110"
                          >
                            <PlayIcon className="h-6 w-6 text-slate-900 ml-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Frame Details */}
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CategoryIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {getCategoryLabel(result.metadata.category)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ID: {result.id}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                          <FilmIcon className="h-4 w-4" />
                          <span className="truncate">{result.video_source}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
                          <ClockIcon className="h-4 w-4" />
                          <span>At {formatTimestamp(result.timestamp)}</span>
                        </div>
                      </div>
                      
                      {/* Metadata Tags */}
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded text-xs">
                          {result.metadata.time_of_day}
                        </span>
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded text-xs">
                          {result.metadata.weather}
                        </span>
                      </div>
                      
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        📍 {result.metadata.location}
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                        <button className="flex items-center space-x-1 text-xs text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          <EyeIcon className="h-3 w-3" />
                          <span>View Context</span>
                        </button>
                        <button 
                          onClick={() => handlePlayVideo(result)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center space-x-1"
                        >
                          <PlayIcon className="h-3 w-3" />
                          <span>Play Video</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Video Preview - {formatTimestamp(selectedTimestamp)}
              </h3>
              <button
                onClick={() => setSelectedVideoId(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <VideoPlayer
                videoId={selectedVideoId}
                startTime={selectedTimestamp}
                className="w-full max-h-[60vh]"
                autoPlay={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}