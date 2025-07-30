'use client'

import { useState, useEffect } from 'react'
import { 
  FilmIcon, 
  ClockIcon, 
  EyeIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  VideoCameraIcon,
  MapPinIcon,
  CloudIcon,
  SunIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

// Define local video assets structure
interface LocalVideo {
  id: string
  filename: string
  category: 'driving_camera' | 'static_camera'
  weather: string
  time_of_day: string
  location: string
  size: number
  estimatedDuration: number
  fps: number
  width: number
  height: number
  isProcessed: boolean
}

// Mock local video data based on actual video assets - ALL 22 videos processed in v0.6.0 with 4,985 frames
const LOCAL_VIDEOS: LocalVideo[] = [
  // Driving Camera Footage (9 videos - all processed with frame extraction)
  { id: '1', filename: 'GH010001.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 127458304, estimatedDuration: 120, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '2', filename: 'GH010002.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 134217728, estimatedDuration: 135, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '3', filename: 'GH010003.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 141234560, estimatedDuration: 140, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '4', filename: 'GH010004.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 156823040, estimatedDuration: 150, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '5', filename: 'GH010005.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 167772160, estimatedDuration: 165, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '6', filename: 'GH010006.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 178956352, estimatedDuration: 175, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '7', filename: 'GH010007.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 189234176, estimatedDuration: 180, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '8', filename: 'GH010010.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 198654976, estimatedDuration: 195, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '9', filename: 'GH020010.MP4', category: 'driving_camera', weather: 'sunny', time_of_day: 'day', location: 'Highway driving', size: 205623296, estimatedDuration: 200, fps: 30, width: 1920, height: 1080, isProcessed: true },
  
  // Static Camera Footage (13 videos - all processed with frame extraction)
  { id: '10', filename: 'GH010031.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 156823040, estimatedDuration: 180, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '11', filename: 'GH010032.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 167772160, estimatedDuration: 190, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '12', filename: 'GH010033.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 178956352, estimatedDuration: 200, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '13', filename: 'GH010034.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 189234176, estimatedDuration: 210, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '14', filename: 'GH010035.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 198654976, estimatedDuration: 220, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '15', filename: 'GH010036.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 205623296, estimatedDuration: 230, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '16', filename: 'GH010037.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 212992512, estimatedDuration: 240, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '17', filename: 'GH010038.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 220361728, estimatedDuration: 250, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '18', filename: 'GH010039.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 227730944, estimatedDuration: 260, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '19', filename: 'GH010041.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 235100160, estimatedDuration: 270, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '20', filename: 'GH010042.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 242469376, estimatedDuration: 280, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '21', filename: 'GH010043.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 249838592, estimatedDuration: 290, fps: 30, width: 1920, height: 1080, isProcessed: true },
  { id: '22', filename: 'GH010045.MP4', category: 'static_camera', weather: 'sunny', time_of_day: 'day', location: 'Intersection monitoring', size: 257207808, estimatedDuration: 300, fps: 30, width: 1920, height: 1080, isProcessed: true }
]

export function LocalVideoLibrary() {
  const [selectedVideo, setSelectedVideo] = useState<LocalVideo | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showProcessedOnly, setShowProcessedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter videos based on current filters
  const filteredVideos = LOCAL_VIDEOS.filter(video => {
    if (filterCategory !== 'all' && video.category !== filterCategory) return false
    if (showProcessedOnly && !video.isProcessed) return false
    if (searchQuery && !video.filename.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getProcessingStatus = (video: LocalVideo) => {
    if (video.isProcessed) {
      return {
        status: 'completed',
        icon: CheckCircleIcon,
        text: 'Ready for search',
        color: 'text-emerald-600 bg-emerald-50'
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

  const getCategoryIcon = (category: string) => {
    return category === 'driving_camera' ? VideoCameraIcon : MapPinIcon
  }

  const getCategoryLabel = (category: string) => {
    return category === 'driving_camera' ? 'Driving Camera' : 'Static Camera'
  }

  const stats = {
    total: LOCAL_VIDEOS.length,
    processed: LOCAL_VIDEOS.filter(v => v.isProcessed).length,
    driving: LOCAL_VIDEOS.filter(v => v.category === 'driving_camera').length,
    static: LOCAL_VIDEOS.filter(v => v.category === 'static_camera').length,
    totalSize: LOCAL_VIDEOS.reduce((acc, v) => acc + v.size, 0)
  }

  return (
    <div className="space-y-8">
      {/* Header with Stats */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
          <FilmIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Local Video Library</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2 max-w-2xl mx-auto">
            Browse and analyze your autonomous vehicle footage collection
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-6xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.total}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Total Videos</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.processed}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Processed</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.driving}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Driving Camera</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.static}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Static Camera</div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatFileSize(stats.totalSize)}</div>
            <div className="text-sm text-slate-600 dark:text-slate-300">Total Size</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            {/* Category Filter */}
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="driving_camera">Driving Camera</option>
                <option value="static_camera">Static Camera</option>
              </select>
            </div>
            
            {/* Processed Filter */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="processed-only"
                checked={showProcessedOnly}
                onChange={(e) => setShowProcessedOnly(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="processed-only" className="text-sm text-slate-700 dark:text-slate-300">
                Processed only
              </label>
            </div>
          </div>
          
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing {filteredVideos.length} of {stats.total} videos
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVideos.map((video) => {
          const processingStatus = getProcessingStatus(video)
          const StatusIcon = processingStatus.icon
          const CategoryIcon = getCategoryIcon(video.category)
          
          return (
            <div
              key={video.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <CategoryIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {video.filename}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {getCategoryLabel(video.category)}
                    </p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={clsx(
                  'px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                  processingStatus.color
                )}>
                  <StatusIcon className="h-3 w-3" />
                  <span>{processingStatus.text}</span>
                </div>
              </div>

              {/* Video Details */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                    <ClockIcon className="h-3 w-3" />
                    <span>{formatDuration(video.estimatedDuration)}</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {video.width}×{video.height} • {video.fps} fps
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    {formatFileSize(video.size)}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Video ID: {video.id}
                  </div>
                </div>
              </div>

              {/* Metadata Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs capitalize flex items-center space-x-1">
                  <SunIcon className="h-3 w-3" />
                  <span>{video.time_of_day}</span>
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs capitalize flex items-center space-x-1">
                  <CloudIcon className="h-3 w-3" />
                  <span>{video.weather}</span>
                </span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs flex items-center space-x-1">
                  <MapPinIcon className="h-3 w-3" />
                  <span>{video.location}</span>
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-600">
                <button
                  onClick={() => setSelectedVideo(video)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span>View Details</span>
                </button>
                
                {video.isProcessed && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    ✓ Ready for search
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <FilmIcon className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No Videos Found</h3>
          <p className="text-slate-600 dark:text-slate-300 mb-4">
            {searchQuery 
              ? `No videos match "${searchQuery}"`
              : showProcessedOnly 
                ? "No processed videos match your current filters."
                : "Adjust your filters to see more videos."
            }
          </p>
          <button
            onClick={() => {
              setSearchQuery('')
              setFilterCategory('all')
              setShowProcessedOnly(false)
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Video Details Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Video Details
                </h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Basic Information</h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Filename</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{selectedVideo.filename}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Category</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{getCategoryLabel(selectedVideo.category)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Duration</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{formatDuration(selectedVideo.estimatedDuration)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Resolution</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{selectedVideo.width}×{selectedVideo.height}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Frame Rate</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{selectedVideo.fps} fps</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">File Size</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{formatFileSize(selectedVideo.size)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Metadata */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Recording Conditions</h4>
                  <dl className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Weather</dt>
                      <dd className="font-medium text-slate-900 dark:text-white capitalize">{selectedVideo.weather}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Time of Day</dt>
                      <dd className="font-medium text-slate-900 dark:text-white capitalize">{selectedVideo.time_of_day}</dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-slate-500 dark:text-slate-400">Location</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{selectedVideo.location}</dd>
                    </div>
                  </dl>
                </div>

                {/* Processing Status */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Processing Status</h4>
                  <div className="flex items-center space-x-3">
                    <div className={clsx(
                      'px-3 py-2 rounded-lg flex items-center space-x-2',
                      selectedVideo.isProcessed 
                        ? 'bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    )}>
                      {selectedVideo.isProcessed ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <Cog6ToothIcon className="h-4 w-4 animate-spin" />
                      )}
                      <span className="font-medium">
                        {selectedVideo.isProcessed ? 'Ready for search' : 'Processing frames and embeddings...'}
                      </span>
                    </div>
                  </div>
                  {selectedVideo.isProcessed && (
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                      ✓ Frames extracted • ✓ CLIP embeddings generated • ✓ Search index ready
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => setSelectedVideo(null)}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}