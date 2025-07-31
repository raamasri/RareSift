'use client'

import React, { useRef, useEffect, useState } from 'react'
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline'
import { getSafeApiUrl } from '../../utils/security'

interface VideoPlayerProps {
  videoId: number
  startTime?: number
  timestamp?: number
  className?: string
  autoPlay?: boolean
  showControls?: boolean
}

// Map video IDs to actual video filenames based on our LOCAL_VIDEOS data
const getVideoFilename = (videoId: number): string => {
  const videoMap: { [key: number]: string } = {
    1: 'GH010001.MP4',
    2: 'GH010002.MP4', 
    3: 'GH010003.MP4',
    4: 'GH010004.MP4',
    5: 'GH010005.MP4',
    6: 'GH010006.MP4',
    7: 'GH010007.MP4',
    8: 'GH010010.MP4',
    9: 'GH020010.MP4',
    10: 'GH010031.MP4',
    11: 'GH010032.MP4',
    12: 'GH010033.MP4',
    13: 'GH010034.MP4',
    14: 'GH010035.MP4',
    15: 'GH010036.MP4',
    16: 'GH010037.MP4',
    17: 'GH010038.MP4',
    18: 'GH010039.MP4',
    19: 'GH010041.MP4',
    20: 'GH010042.MP4',
    21: 'GH010043.MP4',
    22: 'GH010045.MP4'
  }
  return videoMap[videoId] || `VIDEO_${videoId}.MP4`
}

export default function VideoPlayer({
  videoId,
  startTime = 0,
  className = '',
  autoPlay = false,
  showControls = true
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const videoFilename = getVideoFilename(videoId)
  // Use backend streaming endpoint for actual video playback
  const videoSrc = getSafeApiUrl(`/api/v1/videos/${videoId}/stream`)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setIsLoading(false)
      setError(null)
      setDuration(video.duration)
      if (startTime > 0) {
        video.currentTime = startTime
      }
      if (autoPlay) {
        video.play().catch(e => {
          console.warn('Autoplay failed:', e)
        })
        setIsPlaying(true)
      }
    }

    const handleLoadStart = () => {
      setIsLoading(true)
      setError(null)
    }

    const handleError = () => {
      setIsLoading(false)
      setError('Failed to load video file')
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [startTime, autoPlay])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video || error) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play().catch(e => {
        console.warn('Play failed:', e)
      })
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video || error) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !duration || error) return

    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const newTime = (clickX / rect.width) * duration
    video.currentTime = newTime
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={`relative bg-slate-900 rounded-lg overflow-hidden ${className}`}>
      {error ? (
        // Error state - video failed to load
        <div className="w-full h-64 lg:h-96 bg-gradient-to-br from-red-900/50 to-slate-900 flex flex-col items-center justify-center text-white p-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <PlayIcon className="h-10 w-10 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Video Load Error</h3>
            <p className="text-slate-300 text-sm max-w-md">
              {error}
            </p>
            <div className="flex flex-col space-y-2 text-xs text-slate-400">
              <div>🎹 Video ID: {videoId}</div>
              <div>⏰ Jump to: {formatTime(startTime)}</div>
              <div>🎬 Filename: {videoFilename}</div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            playsInline
            crossOrigin="anonymous"
          />
          
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <div className="flex flex-col items-center space-y-4 text-white">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm">Loading {videoFilename}...</p>
              </div>
            </div>
          )}
          
          {showControls && !isLoading && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              {/* Progress bar */}
              <div
                className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-3">
                  <button onClick={togglePlay} className="hover:text-indigo-400 transition-colors">
                    {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                  </button>
                  
                  <button onClick={toggleMute} className="hover:text-indigo-400 transition-colors">
                    {isMuted ? <SpeakerXMarkIcon className="h-5 w-5" /> : <SpeakerWaveIcon className="h-5 w-5" />}
                  </button>
                  
                  <span className="text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                
                <div className="text-sm text-white/80 font-medium">
                  {videoFilename}
                </div>
              </div>
            </div>
          )}
          
          {/* Play overlay for when paused */}
          {!isPlaying && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <button
                onClick={togglePlay}
                className="bg-white/20 hover:bg-white/30 rounded-full p-6 transition-all duration-200 hover:scale-110"
              >
                <PlayIcon className="h-8 w-8 text-white ml-1" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}