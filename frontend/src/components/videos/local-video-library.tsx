'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { getSafeApiUrl, getSafeImageUrl, sanitizeFileName, sanitizeInput } from '../../utils/security'
import VideoPlayer from '@/components/video/video-player'
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
  SunIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

// Define video structure from API
interface Video {
  id: number
  original_filename: string
  duration: number
  width: number
  height: number
  fps: number
  file_size: number
  time_of_day: string
  weather: string
  video_metadata: {
    camera_type?: string
    location?: string
  }
  is_processed: boolean
  processing_started_at?: string
  processing_completed_at?: string
}

export function LocalVideoLibrary() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [showProcessedOnly, setShowProcessedOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [playingVideoId, setPlayingVideoId] = useState<number | null>(null)
  const [playingTimestamp, setPlayingTimestamp] = useState<number>(0)
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use static local video data instead of API calls
  useEffect(() => {
    const loadLocalVideos = () => {
      setLoading(true)
      
      // Static video data for local demo mode
      const localVideos: Video[] = [
        { id: 1, original_filename: 'GH010001.MP4', duration: 507, width: 1920, height: 1080, fps: 30, file_size: 2872187705, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 2, original_filename: 'GH010002.MP4', duration: 147, width: 1920, height: 1080, fps: 30, file_size: 829765120, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 3, original_filename: 'GH010003.MP4', duration: 425, width: 1920, height: 1080, fps: 30, file_size: 2401234560, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 4, original_filename: 'GH010004.MP4', duration: 361, width: 1920, height: 1080, fps: 30, file_size: 2039382016, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 5, original_filename: 'GH010005.MP4', duration: 335, width: 1920, height: 1080, fps: 30, file_size: 1893478400, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 6, original_filename: 'GH010006.MP4', duration: 494, width: 1920, height: 1080, fps: 30, file_size: 2791587840, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 7, original_filename: 'GH010007.MP4', duration: 383, width: 1920, height: 1080, fps: 30, file_size: 2163712000, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 8, original_filename: 'GH010010.MP4', duration: 708, width: 1920, height: 1080, fps: 30, file_size: 4001792000, time_of_day: 'day', weather: 'cloudy', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 9, original_filename: 'GH020010.MP4', duration: 351, width: 1920, height: 1080, fps: 30, file_size: 1983528960, time_of_day: 'day', weather: 'rainy', video_metadata: { camera_type: 'driving_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 10, original_filename: 'GH010031.MP4', duration: 11, width: 1920, height: 1080, fps: 30, file_size: 62177280, time_of_day: 'dusk', weather: 'foggy', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 11, original_filename: 'GH010032.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'night', weather: 'clear', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 12, original_filename: 'GH010033.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'night', weather: 'clear', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 13, original_filename: 'GH010034.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'partly_cloudy', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 14, original_filename: 'GH010035.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'partly_cloudy', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 15, original_filename: 'GH010036.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'partly_cloudy', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 16, original_filename: 'GH010037.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'partly_cloudy', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 17, original_filename: 'GH010038.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'partly_cloudy', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 18, original_filename: 'GH010039.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'partly_cloudy', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 19, original_filename: 'GH010041.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 20, original_filename: 'GH010042.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 21, original_filename: 'GH010043.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined },
        { id: 22, original_filename: 'GH010045.MP4', duration: 87, width: 1920, height: 1080, fps: 30, file_size: 491876352, time_of_day: 'day', weather: 'sunny', video_metadata: { camera_type: 'static_camera' }, is_processed: true, processing_started_at: undefined, processing_completed_at: undefined }
      ]
      
      setVideos(localVideos)
      setError(null)
      setLoading(false)
    }

    // Simulate brief loading for UX
    setTimeout(loadLocalVideos, 500)
  }, [])

  // Helper function to determine category from filename and metadata
  const getVideoCategory = (video: Video): 'driving_camera' | 'static_camera' => {
    // Use camera_type from metadata if available
    if (video.video_metadata?.camera_type) {
      return video.video_metadata.camera_type as 'driving_camera' | 'static_camera'
    }
    
    // Fallback: determine from filename patterns
    const filename = video.original_filename.toLowerCase()
    if (filename.includes('gh010001') || filename.includes('gh010002') || 
        filename.includes('gh010003') || filename.includes('gh010004') ||
        filename.includes('gh010005') || filename.includes('gh010006') ||
        filename.includes('gh010007') || filename.includes('gh010010') ||
        filename.includes('gh020010')) {
      return 'driving_camera'
    }
    return 'static_camera'
  }

  // Helper function to get location from metadata or derive from filename
  const getVideoLocation = (video: Video): string => {
    if (video.video_metadata?.location) {
      return video.video_metadata.location
    }
    
    const category = getVideoCategory(video)
    return category === 'driving_camera' ? 'Highway driving' : 'Intersection monitoring'
  }

  // Filter videos based on current filters
  const filteredVideos = videos.filter(video => {
    const category = getVideoCategory(video)
    if (filterCategory !== 'all' && category !== filterCategory) return false
    if (showProcessedOnly && !video.is_processed) return false
    if (searchQuery && !video.original_filename.toLowerCase().includes(searchQuery.toLowerCase())) return false
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

  const getProcessingStatus = (video: Video) => {
    if (video.is_processed) {
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

  const getVideoThumbnail = (video: Video) => {
    // Map video filename to a representative frame
    // Use a frame from the middle of each video for best representation
    const frameMapping: { [key: string]: string } = {
      'GH010001.MP4': 'driving_camera_gh010001_frame_060.jpg',
      'GH010002.MP4': 'driving_camera_gh010002_frame_070.jpg', 
      'GH010003.MP4': 'driving_camera_gh010003_frame_070.jpg',
      'GH010004.MP4': 'driving_camera_gh010004_frame_075.jpg',
      'GH010005.MP4': 'driving_camera_gh010005_frame_080.jpg',
      'GH010006.MP4': 'driving_camera_gh010006_frame_085.jpg',
      'GH010007.MP4': 'driving_camera_gh010007_frame_090.jpg',
      'GH010010.MP4': 'driving_camera_gh010010_frame_095.jpg',
      'GH020010.MP4': 'driving_camera_gh020010_frame_100.jpg',
      'GH010031.MP4': 'static_camera_gh010031_frame_006.jpg',
      'GH010032.MP4': 'static_camera_gh010032_frame_040.jpg',
      'GH010033.MP4': 'static_camera_gh010033_frame_040.jpg',
      'GH010034.MP4': 'static_camera_gh010034_frame_040.jpg',
      'GH010035.MP4': 'static_camera_gh010035_frame_040.jpg',
      'GH010036.MP4': 'static_camera_gh010036_frame_040.jpg',
      'GH010037.MP4': 'static_camera_gh010037_frame_040.jpg',
      'GH010038.MP4': 'static_camera_gh010038_frame_040.jpg',
      'GH010039.MP4': 'static_camera_gh010039_frame_040.jpg',
      'GH010041.MP4': 'static_camera_gh010041_frame_040.jpg',
      'GH010042.MP4': 'static_camera_gh010042_frame_040.jpg',
      'GH010043.MP4': 'static_camera_gh010043_frame_040.jpg',
      'GH010045.MP4': 'static_camera_gh010045_frame_040.jpg'
    }

    const frameName = frameMapping[video.original_filename]
    return frameName ? getSafeImageUrl(`/frames/${frameName}`) : null
  }

  const handlePlayVideo = (video: Video) => {
    setPlayingVideoId(video.id)
    setPlayingTimestamp(0) // Start from beginning
  }

  const stats = {
    total: videos.length,
    processed: videos.filter(v => v.is_processed).length,
    driving: videos.filter(v => getVideoCategory(v) === 'driving_camera').length,
    static: videos.filter(v => getVideoCategory(v) === 'static_camera').length,
    totalSize: videos.reduce((acc, v) => acc + (v.file_size || 0), 0)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <FilmIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Local Video Library</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">Loading videos...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
              <div className="aspect-video bg-slate-200 dark:bg-slate-700" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <ExclamationTriangleIcon className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Video Library Error</h1>
            <p className="text-lg text-red-600 dark:text-red-400 mt-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
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
          const category = getVideoCategory(video)
          const CategoryIcon = getCategoryIcon(category)
          
          return (
            <div
              key={video.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200 hover:shadow-md"
            >
              {/* Video Thumbnail */}
              <div className="relative aspect-video bg-slate-100 dark:bg-slate-700">
                {getVideoThumbnail(video) ? (
                  <img
                    src={getVideoThumbnail(video)!}
                    alt={`Thumbnail for ${video.original_filename}`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onLoad={() => {
                      console.log('Thumbnail loaded:', getVideoThumbnail(video));
                    }}
                    onError={(e) => {
                      console.error('Thumbnail failed to load:', getVideoThumbnail(video));
                      console.error('Error event:', e);
                      // Hide image on error, show fallback
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null}
                
                {/* Overlay with video info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Status Badge - overlay on thumbnail */}
                <div className="absolute top-3 right-3">
                  <div className={clsx(
                    'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 backdrop-blur-sm',
                    processingStatus.color.replace('bg-', 'bg-').replace('text-', 'text-')
                  )}>
                    <StatusIcon className="h-3 w-3" />
                    <span>{processingStatus.text}</span>
                  </div>
                </div>
                
                {/* Category badge - overlay on thumbnail */}
                <div className="absolute top-3 left-3">
                  <div className="bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
                    <CategoryIcon className="h-3 w-3 text-white" />
                    <span className="text-xs text-white font-medium">{getCategoryLabel(category)}</span>
                  </div>
                </div>
                
                {/* Duration overlay */}
                <div className="absolute bottom-3 right-3">
                  <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1 flex items-center space-x-1">
                    <ClockIcon className="h-3 w-3 text-white" />
                    <span className="text-xs text-white font-medium">{formatDuration(video.duration || 0)}</span>
                  </div>
                </div>
                
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handlePlayVideo(video)}
                    className="bg-black/70 hover:bg-black/80 text-white rounded-full p-4 backdrop-blur-sm transform hover:scale-105 transition-all"
                  >
                    <PlayIcon className="h-8 w-8 ml-1" />
                  </button>
                </div>

                {/* Fallback icon when no thumbnail */}
                {!getVideoThumbnail(video) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FilmIcon className="h-16 w-16 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      {video.original_filename}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Video ID: {video.id}
                    </p>
                  </div>
                </div>

                {/* Video Details */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {video.width}×{video.height} • {video.fps} fps
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {formatFileSize(video.file_size || 0)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-600 dark:text-slate-300">
                      {getVideoLocation(video)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {video.weather} • {video.time_of_day}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-600">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePlayVideo(video)}
                      className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                    >
                      <PlayIcon className="h-4 w-4" />
                      <span>Play Video</span>
                    </button>
                    <button
                      onClick={() => setSelectedVideo(video)}
                      className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>Details</span>
                    </button>
                  </div>
                  
                  {video.is_processed && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      ✓ Ready for search
                    </span>
                  )}
                </div>
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
                      <dd className="font-medium text-slate-900 dark:text-white">{selectedVideo.original_filename}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Category</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{getCategoryLabel(getVideoCategory(selectedVideo))}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500 dark:text-slate-400">Duration</dt>
                      <dd className="font-medium text-slate-900 dark:text-white">{formatDuration(selectedVideo.duration || 0)}</dd>
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
                      <dd className="font-medium text-slate-900 dark:text-white">{formatFileSize(selectedVideo.file_size || 0)}</dd>
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
                      <dd className="font-medium text-slate-900 dark:text-white">{getVideoLocation(selectedVideo)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Processing Status */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Processing Status</h4>
                  <div className="flex items-center space-x-3">
                    <div className={clsx(
                      'px-3 py-2 rounded-lg flex items-center space-x-2',
                      selectedVideo.is_processed 
                        ? 'bg-emerald-50 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        : 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    )}>
                      {selectedVideo.is_processed ? (
                        <CheckCircleIcon className="h-4 w-4" />
                      ) : (
                        <Cog6ToothIcon className="h-4 w-4 animate-spin" />
                      )}
                      <span className="font-medium">
                        {selectedVideo.is_processed ? 'Ready for search' : 'Processing frames and embeddings...'}
                      </span>
                    </div>
                  </div>
                  {selectedVideo.is_processed && (
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

      {/* Video Player */}
      {playingVideoId && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Video Player - {videos.find(v => v.id === playingVideoId)?.original_filename}
                </h3>
                <button
                  onClick={() => setPlayingVideoId(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <VideoPlayer 
                videoId={playingVideoId} 
                timestamp={playingTimestamp}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}