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
import { SearchResponse, SearchResult, exportApi } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import VideoPlayer from '@/components/video/video-player'
import VideoComparison from '@/components/video/video-comparison'
import { DEMO_EXPORT_SCENARIOS, DemoExportScenario } from '@/lib/demo-exports'
import { ExportPreview } from '@/components/export/export-preview'

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
  const [showDemoExports, setShowDemoExports] = useState(false)
  const [selectedDemoScenario, setSelectedDemoScenario] = useState<DemoExportScenario | null>(null)

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
    console.log('handlePlayVideo called - videoId:', videoId, 'timestamp:', timestamp)
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
      <div className="rs-card p-12 text-center">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-slate-100 to-indigo-100 rounded-3xl flex items-center justify-center mb-6">
          <SparklesIcon className="h-10 w-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-3">No Scenarios Found</h3>
        <p className="text-slate-600 mb-6 max-w-md mx-auto">
          We couldn't find any scenarios matching your search criteria. Try adjusting your query or filters to discover relevant driving scenes.
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-sm text-slate-500">
          <div className="px-3 py-1 bg-slate-100 rounded-full">Broaden search terms</div>
          <div className="px-3 py-1 bg-slate-100 rounded-full">Adjust similarity threshold</div>
          <div className="px-3 py-1 bg-slate-100 rounded-full">Remove filters</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Results Header */}
      <div className="rs-card p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Search Results
              </h3>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-slate-600">
                  Found <span className="font-semibold text-emerald-600">{results.total_found}</span> scenarios 
                  in <span className="font-semibold">{results.search_time_ms}ms</span>
                  {results.query_text && (
                    <span> matching <em className="text-indigo-600">"{results.query_text}"</em></span>
                  )}
                </p>
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>AI-powered matching</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Semantic analysis</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Real-time processing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Enhanced Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleComparisonMode}
                className={clsx(
                  'px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center space-x-2',
                  comparisonMode 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white rs-shadow hover:from-green-600 hover:to-emerald-600' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                )}
              >
                <FilmIcon className="h-4 w-4" />
                <span>{comparisonMode ? 'Exit Compare Mode' : 'Compare Mode'}</span>
              </button>
            </div>

            {comparisonMode ? (
              // Enhanced Comparison mode controls
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-xs">{comparisonResults.length}</span>
                  </div>
                  <span className="text-slate-600 font-medium">selected for comparison</span>
                </div>
                {comparisonResults.length >= 2 && (
                  <button
                    onClick={startComparison}
                    className="rs-btn-primary px-4 py-2 text-sm flex items-center space-x-2"
                  >
                    <FilmIcon className="h-4 w-4" />
                    <span>Compare Scenarios ({comparisonResults.length})</span>
                  </button>
                )}
                {comparisonResults.length > 0 && (
                  <button
                    onClick={() => setComparisonResults([])}
                    className="text-sm text-slate-600 hover:text-slate-800 font-medium px-3 py-2 rounded-lg hover:bg-slate-100"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            ) : (
              // Enhanced Export mode controls
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <span className="text-indigo-600 font-bold text-xs">{selectedFrames.size}</span>
                  </div>
                  <span className="text-slate-600 font-medium">selected</span>
                </div>
                <button
                  onClick={selectedFrames.size === results.results.length ? clearSelection : selectAll}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold px-3 py-2 rounded-lg hover:bg-indigo-50"
                >
                  {selectedFrames.size === results.results.length ? 'Clear All' : 'Select All'}
                </button>
                {selectedFrames.size > 0 && (
                  <button
                    onClick={() => setShowExportOptions(true)}
                    className="rs-btn-primary px-4 py-2 text-sm flex items-center space-x-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    <span>Export Dataset ({selectedFrames.size})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.results.map((result: SearchResult) => {
          const isSelected = selectedFrames.has(result.frame_id)
          const isInComparison = comparisonResults.find(r => r.frame_id === result.frame_id)
          const isComparisonFull = comparisonResults.length >= 4
          
          return (
            <div
              key={result.frame_id}
              className={clsx(
                'rs-card transition-all duration-300 hover:rs-shadow-lg transform hover:-translate-y-1 overflow-hidden group',
                comparisonMode && isInComparison
                  ? 'ring-2 ring-emerald-300 border-emerald-400 bg-gradient-to-br from-white to-emerald-50' 
                  : isSelected 
                    ? 'ring-2 ring-indigo-300 border-indigo-400 bg-gradient-to-br from-white to-indigo-50' 
                    : 'hover:border-slate-300'
              )}
            >
              {/* Enhanced Frame Image */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                <Image
                  src={`http://localhost:8001/frames/${result.frame_path.split('/').pop()}`}
                  alt={`Frame at ${formatTimestamp(result.timestamp)}`}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  onError={(e) => {
                    // Fallback to a sample demo frame if image fails to load
                    const target = e.target as HTMLImageElement
                    target.src = '/assets/demo-frames/driving_camera_gh010001_frame_240.jpg'
                  }}
                />
                
                {/* Enhanced Selection Overlay */}
                <div 
                  className="absolute inset-0 cursor-pointer"
                  onClick={() => comparisonMode ? toggleComparisonSelection(result) : toggleFrameSelection(result.frame_id)}
                >
                  <div className={clsx(
                    'absolute inset-0 transition-all duration-300',
                    comparisonMode && isInComparison
                      ? 'bg-gradient-to-t from-emerald-600/30 to-transparent'
                      : isSelected 
                        ? 'bg-gradient-to-t from-indigo-600/30 to-transparent' 
                        : 'hover:bg-gradient-to-t hover:from-black/20 hover:to-transparent'
                  )} />
                  
                  <div className="absolute top-3 right-3">
                    <div className={clsx(
                      'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 backdrop-blur-sm',
                      comparisonMode && isInComparison
                        ? 'bg-emerald-600 border-emerald-600 rs-shadow-lg scale-110'
                        : isSelected
                          ? 'bg-indigo-600 border-indigo-600 rs-shadow-lg scale-110'
                          : comparisonMode && isComparisonFull
                            ? 'bg-slate-200/80 border-slate-300 opacity-50'
                            : 'bg-white/90 border-slate-300 hover:border-slate-400 hover:scale-110'
                    )}>
                      {(isSelected || (comparisonMode && isInComparison)) && (
                        <CheckIcon className="h-4 w-4 text-white" />
                      )}
                    </div>
                    
                    {/* Enhanced Comparison Mode Badge */}
                    {comparisonMode && isInComparison && (
                      <div className="absolute -bottom-8 right-0">
                        <div className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold rs-shadow">
                          #{comparisonResults.findIndex(r => r.frame_id === result.frame_id) + 1}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Enhanced Similarity Badge */}
                <div className="absolute top-3 left-3">
                  <div className={clsx(
                    'px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm rs-shadow',
                    result.similarity >= 0.8 ? 'bg-emerald-500/90 text-white' :
                    result.similarity >= 0.6 ? 'bg-blue-500/90 text-white' :
                    result.similarity >= 0.4 ? 'bg-amber-500/90 text-white' :
                    'bg-slate-500/90 text-white'
                  )}>
                    {Math.round(result.similarity * 100)}%
                  </div>
                </div>

                {/* Hover Play Button */}
                <div 
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation() // Prevent triggering selection
                    console.log('Hover play button clicked for video:', result.video_id, 'timestamp:', result.timestamp)
                    handlePlayVideo(result.video_id, result.timestamp)
                  }}
                >
                  <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center rs-shadow-lg backdrop-blur-sm hover:bg-white/95 hover:scale-110 transition-all duration-200">
                    <PlayIcon className="h-8 w-8 text-slate-700 ml-1" />
                  </div>
                </div>
              </div>

              {/* Enhanced Frame Info */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center">
                      <ClockIcon className="h-3 w-3 text-slate-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">{formatTimestamp(result.timestamp)}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                    Video #{result.video_id}
                  </div>
                </div>

                {/* Enhanced Metadata */}
                <div className="space-y-3">
                  {result.metadata?.time_of_day && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Time of Day</span>
                      <div className="flex items-center space-x-1">
                        <div className="text-xs">
                          {result.metadata.time_of_day === 'day' && '🌅'}
                          {result.metadata.time_of_day === 'night' && '🌙'}
                          {result.metadata.time_of_day === 'dawn' && '🌄'}
                          {result.metadata.time_of_day === 'dusk' && '🌆'}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 capitalize">
                          {result.metadata.time_of_day}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {result.metadata?.weather_hint && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-medium">Weather</span>
                      <div className="flex items-center space-x-1">
                        <div className="text-xs">
                          {result.metadata.weather_hint.includes('sunny') && '☀️'}
                          {result.metadata.weather_hint.includes('cloudy') && '☁️'}
                          {result.metadata.weather_hint.includes('rain') && '🌧️'}
                          {result.metadata.weather_hint.includes('snow') && '❄️'}
                          {result.metadata.weather_hint.includes('fog') && '🌫️'}
                        </div>
                        <span className="text-sm font-semibold text-slate-700 capitalize">
                          {result.metadata.weather_hint.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Similarity Score Display */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Match Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5">
                        <div 
                          className={clsx(
                            'h-1.5 rounded-full transition-all duration-500',
                            result.similarity >= 0.8 ? 'bg-emerald-500' :
                            result.similarity >= 0.6 ? 'bg-blue-500' :
                            result.similarity >= 0.4 ? 'bg-amber-500' : 'bg-slate-400'
                          )}
                          style={{ width: `${result.similarity * 100}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700">
                        {getSimilarityLabel(result.similarity)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Enhanced Actions */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  {comparisonMode ? (
                    <button
                      onClick={() => toggleComparisonSelection(result)}
                      disabled={!isInComparison && isComparisonFull}
                      className={clsx(
                        'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                        isInComparison
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : isComparisonFull
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                      )}
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>
                        {isInComparison ? 'Remove' : 'Compare'}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        console.log('Play button clicked for video:', result.video_id, 'timestamp:', result.timestamp)
                        handlePlayVideo(result.video_id, result.timestamp)
                      }}
                      className="flex items-center space-x-2 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-sm font-semibold transition-all duration-200"
                    >
                      <PlayIcon className="h-4 w-4" />
                      <span>Play</span>
                    </button>
                  )}
                  <button className="flex items-center space-x-2 px-3 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 rounded-lg text-sm font-semibold transition-all duration-200">
                    <EyeIcon className="h-4 w-4" />
                    <span>Details</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Enhanced Load More */}
      {results.total_found > results.results.length && (
        <div className="text-center">
          <div className="rs-card p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="text-sm text-slate-600">
                Showing {results.results.length} of {results.total_found} scenarios
              </div>
              <button className="rs-btn-secondary px-8 py-3 text-base font-semibold flex items-center space-x-2">
                <span>Load More Results</span>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin opacity-0 group-hover:opacity-100"></div>
              </button>
              <div className="w-full max-w-xs bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(results.results.length / results.total_found) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Export Options Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Export Options
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose how you'd like to export your selected frames
              </p>

              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setShowDemoExports(false)}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    !showDemoExports
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  )}
                >
                  Selected Frames ({selectedFrames.size})
                </button>
                <button
                  onClick={() => setShowDemoExports(true)}
                  className={clsx(
                    'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                    showDemoExports
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  )}
                >
                  Demo Scenarios ⭐
                </button>
              </div>

              {!showDemoExports ? (
                // Original export functionality
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Production Export</h4>
                    <p className="text-sm text-blue-700 mb-4">
                      Export your {selectedFrames.size} selected frames. This will create a background job and notify you when ready.
                    </p>
                    
                    <div className="space-y-3">
                      <button 
                        onClick={async () => {
                          try {
                            const exportResponse = await exportApi.create(Array.from(selectedFrames), 'dataset')
                            setShowExportOptions(false)
                            console.log('Export started:', exportResponse)
                          } catch (error) {
                            console.error('Export failed:', error)
                          }
                        }}
                        className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>Export as Dataset (JSON + Images)</span>
                      </button>
                      
                      <button 
                        onClick={async () => {
                          try {
                            const exportResponse = await exportApi.create(Array.from(selectedFrames), 'zip')
                            setShowExportOptions(false)
                            console.log('Export started:', exportResponse)
                          } catch (error) {
                            console.error('Export failed:', error)
                          }
                        }}
                        className="w-full px-4 py-3 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                        <span>Export as ZIP Archive</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Demo export scenarios
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-purple-900 mb-2">🚀 Instant Demo Exports</h4>
                    <p className="text-sm text-purple-700">
                      Pre-built scenario datasets for immediate download. Perfect for testing and demonstration.
                    </p>
                  </div>

                  {DEMO_EXPORT_SCENARIOS.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 mb-1">{scenario.title}</h5>
                          <p className="text-sm text-gray-600 mb-3">{scenario.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>📊 {scenario.frame_count} frames</span>
                            <span>💾 {scenario.file_size_mb}MB</span>
                            <span className="capitalize">🏷️ {scenario.category.replace('_', ' ')}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedDemoScenario(scenario)
                            setShowExportOptions(false)
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Preview & Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={() => setShowExportOptions(false)}
                  className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999]"
          onClick={() => {
            console.log('Modal backdrop clicked - closing video player')
            setSelectedVideoId(null)
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Video Preview - {formatTimestamp(selectedTimestamp)} (Video #{selectedVideoId})
              </h3>
              <button
                onClick={() => {
                  console.log('Close button clicked - closing video player')
                  setSelectedVideoId(null)
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-full"
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

      {/* Demo Export Preview Modal */}
      {selectedDemoScenario && (
        <ExportPreview
          scenario={selectedDemoScenario}
          isOpen={!!selectedDemoScenario}
          onClose={() => setSelectedDemoScenario(null)}
          onDownload={(format) => {
            console.log(`Downloaded ${selectedDemoScenario.title} as ${format}`)
            // You could show a success toast here
          }}
        />
      )}
    </div>
  )
} 