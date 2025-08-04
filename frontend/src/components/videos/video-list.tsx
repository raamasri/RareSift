'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  FilmIcon, 
  ClockIcon, 
  EyeIcon, 
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { videoApi, Video } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export function VideoList() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [showProcessedOnly, setShowProcessedOnly] = useState(false)
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<Video | null>(null)

  const queryClient = useQueryClient()

  // Hardcoded video data for MVP demo
  const hardcodedVideos = [
    {
      id: 1, filename: "GH010001.MP4", original_filename: "GH010001.MP4", duration: 507, fps: 30, width: 1920, height: 1080,
      file_size: 2400000000, weather: "sunny", time_of_day: "day", is_processed: true, created_at: "2024-01-15T10:30:00Z"
    },
    {
      id: 2, filename: "GH010002.MP4", original_filename: "GH010002.MP4", duration: 147, fps: 30, width: 1920, height: 1080,
      file_size: 700000000, weather: "sunny", time_of_day: "day", is_processed: true, created_at: "2024-01-15T11:45:00Z"
    },
    {
      id: 3, filename: "GH010003.MP4", original_filename: "GH010003.MP4", duration: 425, fps: 30, width: 1920, height: 1080,
      file_size: 2000000000, weather: "sunny", time_of_day: "day", is_processed: true, created_at: "2024-01-15T12:15:00Z"
    },
    {
      id: 4, filename: "GH010004.MP4", original_filename: "GH010004.MP4", duration: 361, fps: 30, width: 1920, height: 1080,
      file_size: 1700000000, weather: "sunny", time_of_day: "day", is_processed: true, created_at: "2024-01-15T13:20:00Z"
    },
    {
      id: 5, filename: "GH010005.MP4", original_filename: "GH010005.MP4", duration: 335, fps: 30, width: 1920, height: 1080,
      file_size: 1600000000, weather: "sunny", time_of_day: "day", is_processed: true, created_at: "2024-01-15T14:10:00Z"
    },
    {
      id: 6, filename: "GH010006.MP4", original_filename: "GH010006.MP4", duration: 494, fps: 30, width: 1920, height: 1080,
      file_size: 2300000000, weather: "sunny", time_of_day: "day", is_processed: true, created_at: "2024-01-15T15:30:00Z"
    },
    {
      id: 7, filename: "GH010007.MP4", original_filename: "GH010007.MP4", duration: 383, fps: 30, width: 1920, height: 1080,
      file_size: 1800000000, weather: "sunny", time_of_day: "day", is_processed: true, created_at: "2024-01-15T16:45:00Z"
    },
    {
      id: 8, filename: "GH010010.MP4", original_filename: "GH010010.MP4", duration: 708, fps: 30, width: 1920, height: 1080,
      file_size: 3300000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-16T09:15:00Z"
    },
    {
      id: 9, filename: "GH020010.MP4", original_filename: "GH020010.MP4", duration: 351, fps: 30, width: 1920, height: 1080,
      file_size: 1650000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-16T10:30:00Z"
    },
    {
      id: 15, filename: "GH010031.MP4", original_filename: "GH010031.MP4", duration: 11, fps: 30, width: 1920, height: 1080,
      file_size: 52000000, weather: "cloudy", time_of_day: "night", is_processed: true, created_at: "2024-01-16T20:15:00Z"
    },
    {
      id: 16, filename: "GH010032.MP4", original_filename: "GH010032.MP4", duration: 56, fps: 30, width: 1920, height: 1080,
      file_size: 260000000, weather: "cloudy", time_of_day: "night", is_processed: true, created_at: "2024-01-16T20:45:00Z"
    },
    {
      id: 17, filename: "GH010033.MP4", original_filename: "GH010033.MP4", duration: 80, fps: 30, width: 1920, height: 1080,
      file_size: 375000000, weather: "cloudy", time_of_day: "night", is_processed: true, created_at: "2024-01-16T21:10:00Z"
    },
    {
      id: 18, filename: "GH010034.MP4", original_filename: "GH010034.MP4", duration: 86, fps: 30, width: 1920, height: 1080,
      file_size: 400000000, weather: "rainy", time_of_day: "night", is_processed: true, created_at: "2024-01-16T21:35:00Z"
    },
    {
      id: 19, filename: "GH010035.MP4", original_filename: "GH010035.MP4", duration: 122, fps: 30, width: 1920, height: 1080,
      file_size: 570000000, weather: "cloudy", time_of_day: "night", is_processed: true, created_at: "2024-01-16T22:00:00Z"
    },
    {
      id: 20, filename: "GH010036.MP4", original_filename: "GH010036.MP4", duration: 65, fps: 30, width: 1920, height: 1080,
      file_size: 305000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-17T08:15:00Z"
    },
    {
      id: 21, filename: "GH010037.MP4", original_filename: "GH010037.MP4", duration: 48, fps: 30, width: 1920, height: 1080,
      file_size: 225000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-17T09:30:00Z"
    },
    {
      id: 22, filename: "GH010038.MP4", original_filename: "GH010038.MP4", duration: 76, fps: 30, width: 1920, height: 1080,
      file_size: 355000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-17T10:45:00Z"
    },
    {
      id: 23, filename: "GH010039.MP4", original_filename: "GH010039.MP4", duration: 124, fps: 30, width: 1920, height: 1080,
      file_size: 580000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-17T11:20:00Z"
    },
    {
      id: 24, filename: "GH010041.MP4", original_filename: "GH010041.MP4", duration: 62, fps: 30, width: 1920, height: 1080,
      file_size: 290000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-17T12:00:00Z"
    },
    {
      id: 25, filename: "GH010042.MP4", original_filename: "GH010042.MP4", duration: 175, fps: 30, width: 1920, height: 1080,
      file_size: 820000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-17T13:15:00Z"
    },
    {
      id: 26, filename: "GH010043.MP4", original_filename: "GH010043.MP4", duration: 131, fps: 30, width: 1920, height: 1080,
      file_size: 615000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-17T14:30:00Z"
    },
    {
      id: 27, filename: "GH010045.MP4", original_filename: "GH010045.MP4", duration: 204, fps: 30, width: 1920, height: 1080,
      file_size: 955000000, weather: "cloudy", time_of_day: "day", is_processed: true, created_at: "2024-01-17T15:45:00Z"
    }
  ]

  // Use hardcoded data instead of API calls for MVP
  const videosData = { videos: hardcodedVideos, total: hardcodedVideos.length }
  const isLoading = false
  const error = null
  const isError = false
  const refetch = () => Promise.resolve()

  // Delete video mutation with error handling
  const deleteMutation = useMutation({
    mutationFn: videoApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      setSelectedVideo(null)
      setDeleteConfirmVideo(null)
      // Show success message (you could add a toast notification here)
    },
    onError: (error: any) => {
      console.error('Failed to delete video:', error)
      // You could add toast notification here
      alert(`Failed to delete video: ${error.message || 'Unknown error'}. Please try again.`)
    }
  })

  const handleDeleteClick = (video: Video) => {
    setDeleteConfirmVideo(video)
  }

  const handleDeleteConfirm = () => {
    if (deleteConfirmVideo) {
      deleteMutation.mutate(deleteConfirmVideo.id)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getProcessingStatus = (video: Video) => {
    if (video.is_processed) {
      return {
        status: 'completed',
        icon: CheckCircleIcon,
        text: 'Ready for search',
        color: 'text-green-600 bg-green-50'
      }
    } else {
      return {
        status: 'processing',
        icon: Cog6ToothIcon,
        text: 'Processing...',
        color: 'text-blue-600 bg-blue-50'
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-sm text-blue-800">Loading your video library...</p>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-300 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  
  // Error state
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-red-900">Unable to Load Video Library</h3>
            <div className="mt-2 text-sm text-red-700">
              {error instanceof Error ? (
                <p>
                  {error.message.includes('fetch') 
                    ? 'Cannot connect to the server. Please check your internet connection and try again.'
                    : error.message.includes('500')
                    ? 'The server is experiencing issues. Please try again in a few minutes.'
                    : error.message.includes('404')
                    ? 'The video service is not available. Please contact support.'
                    : `Error: ${error.message}`
                  }
                </p>
              ) : (
                <p>An unexpected error occurred while loading your videos.</p>
              )}
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const videos = videosData?.videos || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Video Library</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage your uploaded AV videos and their processing status
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="processed-only"
                checked={showProcessedOnly}
                onChange={(e) => setShowProcessedOnly(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="processed-only" className="text-sm text-gray-700">
                Show processed only
              </label>
            </div>
            
            <div className="text-sm text-gray-500">
              {videosData?.total || 0} videos total
            </div>
          </div>
        </div>
      </div>

      {/* Videos List */}
      {videos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <FilmIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Videos Found</h3>
          <p className="text-gray-600 mb-4">
            {showProcessedOnly 
              ? "No processed videos yet. Upload some videos and wait for processing to complete."
              : "Upload your first AV video to get started with scenario search."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video: Video) => {
            const processingStatus = getProcessingStatus(video)
            const StatusIcon = processingStatus.icon
            
            return (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FilmIcon className="h-6 w-6 text-gray-500" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {video.original_filename}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatDuration(video.duration)}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {video.width}×{video.height}
                        </div>
                        <div className="text-xs text-gray-500">
                          {video.file_size ? formatFileSize(video.file_size) : 'Unknown size'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {video.fps} fps
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status */}
                    <div className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                      processingStatus.color
                    )}>
                      <StatusIcon className="h-3 w-3" />
                      <span>{processingStatus.text}</span>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {video.time_of_day && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full capitalize">
                          {video.time_of_day}
                        </span>
                      )}
                      {video.weather && (
                        <span className="px-2 py-1 bg-gray-100 rounded-full capitalize">
                          {video.weather}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedVideo(video)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteClick(video)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        title="Delete video"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info Row */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      Uploaded {formatDistanceToNow(new Date(video.created_at), { addSuffix: true })}
                    </span>
                    {video.location && (
                      <span>📍 {video.location}</span>
                    )}
                    {video.speed_avg && (
                      <span>🚗 {video.speed_avg} km/h avg</span>
                    )}
                  </div>
                  
                  <div>
                    Video ID: {video.id}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Video Details Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Video Details
                </h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Filename</dt>
                      <dd className="font-medium">{selectedVideo.original_filename}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Duration</dt>
                      <dd className="font-medium">{formatDuration(selectedVideo.duration)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Resolution</dt>
                      <dd className="font-medium">{selectedVideo.width}×{selectedVideo.height}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Frame Rate</dt>
                      <dd className="font-medium">{selectedVideo.fps} fps</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">File Size</dt>
                      <dd className="font-medium">{selectedVideo.file_size ? formatFileSize(selectedVideo.file_size) : 'Unknown size'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Processing Status</dt>
                      <dd className="font-medium">
                        {selectedVideo.is_processed ? 'Completed' : 'In Progress'}
                      </dd>
                    </div>
                  </dl>
                </div>

                {(selectedVideo.weather || selectedVideo.time_of_day || selectedVideo.location || selectedVideo.speed_avg) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Metadata</h4>
                    <dl className="grid grid-cols-2 gap-4 text-sm">
                      {selectedVideo.weather && (
                        <div>
                          <dt className="text-gray-500">Weather</dt>
                          <dd className="font-medium capitalize">{selectedVideo.weather}</dd>
                        </div>
                      )}
                      {selectedVideo.time_of_day && (
                        <div>
                          <dt className="text-gray-500">Time of Day</dt>
                          <dd className="font-medium capitalize">{selectedVideo.time_of_day}</dd>
                        </div>
                      )}
                      {selectedVideo.location && (
                        <div>
                          <dt className="text-gray-500">Location</dt>
                          <dd className="font-medium">{selectedVideo.location}</dd>
                        </div>
                      )}
                      {selectedVideo.speed_avg && (
                        <div>
                          <dt className="text-gray-500">Average Speed</dt>
                          <dd className="font-medium">{selectedVideo.speed_avg} km/h</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedVideo(null)}
                      className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        handleDeleteClick(selectedVideo)
                        setSelectedVideo(null)
                      }}
                      className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700"
                    >
                      Delete Video
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Video
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete "{deleteConfirmVideo.original_filename}"? 
                  This will permanently remove the video file, all extracted frames, and embeddings. 
                  This action cannot be undone.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteConfirmVideo(null)}
                  className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 border border-gray-300"
                  disabled={deleteMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteMutation.isPending}
                  className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Video'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 