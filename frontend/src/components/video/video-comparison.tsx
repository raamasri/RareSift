'use client'

import React, { useState } from 'react'
import { SearchResult } from '@/lib/api'
import VideoPlayer from './video-player'
import { XMarkIcon, PlayIcon, PauseIcon } from '@heroicons/react/24/outline'

interface VideoComparisonProps {
  results: SearchResult[]
  onClose: () => void
}

export default function VideoComparison({ results, onClose }: VideoComparisonProps) {
  const [syncPlayback, setSyncPlayback] = useState(false)
  const [allPlaying, setAllPlaying] = useState(false)
  
  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 bg-green-50 border-green-200'
    if (similarity >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (similarity >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  // Determine grid layout based on number of results
  const getGridClass = () => {
    if (results.length === 1) return 'grid-cols-1'
    if (results.length === 2) return 'grid-cols-1 lg:grid-cols-2'
    if (results.length === 3) return 'grid-cols-1 lg:grid-cols-3'
    if (results.length === 4) return 'grid-cols-1 lg:grid-cols-2'
    return 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Video Comparison
            </h2>
            <p className="text-sm text-gray-600">
              Comparing {results.length} scenarios side by side
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Sync Control */}
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={syncPlayback}
                onChange={(e) => setSyncPlayback(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Sync playback</span>
            </label>
            
            {/* Global Play/Pause */}
            <button
              onClick={() => setAllPlaying(!allPlaying)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {allPlaying ? (
                <>
                  <PauseIcon className="w-4 h-4" />
                  <span>Pause All</span>
                </>
              ) : (
                <>
                  <PlayIcon className="w-4 h-4" />
                  <span>Play All</span>
                </>
              )}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="flex-1 p-6 overflow-auto">
          <div className={`grid gap-6 h-full ${getGridClass()}`}>
            {results.map((result, index) => (
              <div key={result.frame_id} className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
                {/* Video Info Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {result.video_filename || `Video ${result.video_id}`}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getSimilarityColor(result.similarity)}`}>
                      {Math.round(result.similarity * 100)}% match
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Timestamp: {formatTimestamp(result.timestamp)}</span>
                    {result.video_duration && (
                      <span>Duration: {formatTimestamp(result.video_duration)}</span>
                    )}
                  </div>
                  
                  {/* Metadata */}
                  {(result.metadata?.time_of_day || result.metadata?.weather_hint) && (
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {result.metadata.time_of_day && (
                        <span className="bg-gray-200 px-2 py-1 rounded">
                          {result.metadata.time_of_day}
                        </span>
                      )}
                      {result.metadata.weather_hint && (
                        <span className="bg-gray-200 px-2 py-1 rounded">
                          {result.metadata.weather_hint.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Video Player */}
                <div className="flex-1 bg-black">
                  <VideoPlayer
                    videoId={result.video_id}
                    startTime={result.timestamp}
                    className="w-full h-full"
                    autoPlay={allPlaying}
                    showControls={!syncPlayback}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Controls for Synced Mode */}
        {syncPlayback && (
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setAllPlaying(!allPlaying)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {allPlaying ? (
                  <>
                    <PauseIcon className="w-5 h-5" />
                    <span>Pause All Videos</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    <span>Play All Videos</span>
                  </>
                )}
              </button>
              <div className="text-sm text-gray-600">
                Synchronized playback mode - all videos will play/pause together
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}