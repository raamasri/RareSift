'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  ClockIcon, 
  CheckIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  PlayIcon,
  FilmIcon
} from '@heroicons/react/24/outline'
import { SearchResponse, SearchResult, videoPreviewApi } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import VideoPlayer from '@/components/video/video-player'
import VideoComparison from '@/components/video/video-comparison'

interface SearchResultsProps {
  results: SearchResponse
}

export function SearchResults({ results }: SearchResultsProps) {
  const [selectedFrames, setSelectedFrames] = useState<Set<number>>(new Set())
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null)
  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(0)
  const [comparisonMode, setComparisonMode] = useState(false)
  const [comparisonResults, setComparisonResults] = useState<SearchResult[]>([])
  const [showComparison, setShowComparison] = useState(false)

  const toggleFrameSelection = (frameId: number) => {
    const newSelection = new Set(selectedFrames)
    if (newSelection.has(frameId)) {
      newSelection.delete(frameId)
    } else {
      newSelection.add(frameId)
    }
    setSelectedFrames(newSelection)
  }

  const selectAll = () => {
    setSelectedFrames(new Set(results.results.map(r => r.frame_id)))
  }

  const clearSelection = () => {
    setSelectedFrames(new Set())
  }

  const handlePlayVideo = (videoId: number, timestamp: number) => {
    setSelectedVideoId(videoId)
    setSelectedTimestamp(timestamp)
  }

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode)
    setComparisonResults([])
    setSelectedFrames(new Set())
  }

  const toggleComparisonSelection = (result: SearchResult) => {
    if (comparisonResults.find(r => r.frame_id === result.frame_id)) {
      setComparisonResults(prev => prev.filter(r => r.frame_id !== result.frame_id))
    } else if (comparisonResults.length < 4) { // Limit to 4 for better viewing
      setComparisonResults(prev => [...prev, result])
    }
  }

  const startComparison = () => {
    if (comparisonResults.length >= 2) {
      setShowComparison(true)
    }
  }

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 bg-green-50'
    if (similarity >= 0.6) return 'text-blue-600 bg-blue-50'
    if (similarity >= 0.4) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getSimilarityLabel = (similarity: number) => {
    if (similarity >= 0.8) return 'Excellent'
    if (similarity >= 0.6) return 'Good'
    if (similarity >= 0.4) return 'Fair'
    return 'Low'
  }

  if (!results.results.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <SparklesIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
        <p className="text-gray-600 mb-4">
          Try adjusting your search query or filters to find matching scenarios.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Search Results
              </h3>
              <p className="text-sm text-gray-600">
                Found {results.total_found} scenarios in {results.search_time_ms}ms
                {results.query_text && (
                  <span> for "{results.query_text}"</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleComparisonMode}
                className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                  comparisonMode 
                    ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {comparisonMode ? 'Exit Compare' : 'Compare Mode'}
              </button>
            </div>

            {comparisonMode ? (
              // Comparison mode controls
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  {comparisonResults.length} selected for comparison
                </div>
                {comparisonResults.length >= 2 && (
                  <button
                    onClick={startComparison}
                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <FilmIcon className="h-4 w-4" />
                    <span>Compare ({comparisonResults.length})</span>
                  </button>
                )}
                {comparisonResults.length > 0 && (
                  <button
                    onClick={() => setComparisonResults([])}
                    className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            ) : (
              // Export mode controls
              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-600">
                  {selectedFrames.size} selected
                </div>
                <button
                  onClick={selectedFrames.size === results.results.length ? clearSelection : selectAll}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  {selectedFrames.size === results.results.length ? 'Clear All' : 'Select All'}
                </button>
                {selectedFrames.size > 0 && (
                  <button
                    onClick={() => setShowExportOptions(true)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Export ({selectedFrames.size})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.results.map((result: SearchResult) => {
          const isSelected = selectedFrames.has(result.frame_id)
          const isInComparison = comparisonResults.find(r => r.frame_id === result.frame_id)
          const isComparisonFull = comparisonResults.length >= 4
          
          return (
            <div
              key={result.frame_id}
              className={clsx(
                'bg-white rounded-lg shadow-sm border transition-all duration-200 overflow-hidden',
                comparisonMode && isInComparison
                  ? 'border-green-500 ring-2 ring-green-200' 
                  : isSelected 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
              )}
            >
              {/* Frame Image */}
              <div className="relative aspect-video bg-gray-100">
                <Image
                  src={`http://localhost:8000${result.frame_url || `/static/frames/video_${result.video_id}_frame_000000.jpg`}`}
                  alt={`Frame at ${formatTimestamp(result.timestamp)}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                
                {/* Selection Overlay */}
                <div 
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => comparisonMode ? toggleComparisonSelection(result) : toggleFrameSelection(result.frame_id)}
                >
                  <div className={clsx(
                    'absolute inset-0 transition-colors',
                    comparisonMode && isInComparison
                      ? 'bg-green-600 bg-opacity-20'
                      : isSelected 
                        ? 'bg-blue-600 bg-opacity-20' 
                        : 'hover:bg-black hover:bg-opacity-10'
                  )} />
                  
                  <div className="absolute top-2 right-2">
                    <div className={clsx(
                      'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                      comparisonMode && isInComparison
                        ? 'bg-green-600 border-green-600'
                        : isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : comparisonMode && isComparisonFull
                            ? 'bg-gray-200 border-gray-300 opacity-50'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                    )}>
                      {(isSelected || (comparisonMode && isInComparison)) && (
                        <CheckIcon className="h-3 w-3 text-white" />
                      )}
                    </div>
                    
                    {/* Comparison Mode Badge */}
                    {comparisonMode && isInComparison && (
                      <div className="absolute bottom-[-36px] right-0">
                        <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                          #{comparisonResults.findIndex(r => r.frame_id === result.frame_id) + 1}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Similarity Badge */}
                <div className="absolute top-2 left-2">
                  <span className={clsx(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getSimilarityColor(result.similarity)
                  )}>
                    {getSimilarityLabel(result.similarity)} ({Math.round(result.similarity * 100)}%)
                  </span>
                </div>
              </div>

              {/* Frame Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>{formatTimestamp(result.timestamp)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Video #{result.video_id}
                  </div>
                </div>

                {/* Metadata */}
                <div className="space-y-2">
                  {result.metadata?.time_of_day && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium capitalize">{result.metadata.time_of_day}</span>
                    </div>
                  )}
                  
                  {result.metadata?.weather_hint && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Condition:</span>
                      <span className="font-medium capitalize">{result.metadata.weather_hint.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  {comparisonMode ? (
                    <button
                      onClick={() => toggleComparisonSelection(result)}
                      disabled={!isInComparison && isComparisonFull}
                      className={clsx(
                        'flex items-center space-x-2 text-sm font-medium transition-colors',
                        isInComparison
                          ? 'text-green-600 hover:text-green-800'
                          : isComparisonFull
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-green-600 hover:text-green-800'
                      )}
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>
                        {isInComparison ? 'Remove from Compare' : 'Add to Compare'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlayVideo(result.video_id, result.timestamp)}
                      className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <PlayIcon className="h-4 w-4" />
                      <span>Play Video</span>
                    </button>
                  )}
                  <button className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 font-medium">
                    <EyeIcon className="h-4 w-4" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Load More */}
      {results.total_found > results.results.length && (
        <div className="text-center">
          <button className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors">
            Load More Results
          </button>
        </div>
      )}

      {/* Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Export Selected Frames
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Export {selectedFrames.size} selected frames as a training dataset or ZIP archive.
              </p>
              
              <div className="space-y-3">
                <button className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Export as Dataset (JSON + Images)</span>
                </button>
                
                <button className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2">
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  <span>Export as ZIP Archive</span>
                </button>
              </div>
              
              <div className="mt-6 flex space-x-3">
                <button 
                  onClick={() => setShowExportOptions(false)}
                  className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Video Preview - {formatTimestamp(selectedTimestamp)}
              </h3>
              <button
                onClick={() => setSelectedVideoId(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
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

      {/* Video Comparison Modal */}
      {showComparison && (
        <VideoComparison
          results={comparisonResults}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  )
} 