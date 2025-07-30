'use client'

import React, { useRef, useEffect, useState } from 'react'
import { videoPreviewApi, type VideoInfo } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'

interface VideoPlayerProps {
  videoId: number
  startTime?: number
  className?: string
  autoPlay?: boolean
  showControls?: boolean
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

  // Get video info
  const { data: videoInfo } = useQuery<VideoInfo>({
    queryKey: ['videoInfo', videoId],
    queryFn: () => videoPreviewApi.getVideoInfo(videoId),
  })

  // Set up video src
  const videoSrc = videoPreviewApi.getVideoStream(videoId)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedData = () => {
      setDuration(video.duration)
      if (startTime > 0) {
        video.currentTime = startTime
      }
      if (autoPlay) {
        video.play()
        setIsPlaying(true)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [startTime, autoPlay])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current
    if (!video || !duration) return

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
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-contain"
        playsInline
      />
      
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          {/* Progress bar */}
          <div
            className="w-full h-1 bg-white/30 rounded-full mb-3 cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          
          {/* Controls */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <button onClick={togglePlay} className="hover:text-blue-400 transition-colors">
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              
              <button onClick={toggleMute} className="hover:text-blue-400 transition-colors">
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <span className="text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            {videoInfo && (
              <div className="text-sm text-white/80">
                {videoInfo.filename}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Play overlay for when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <button
            onClick={togglePlay}
            className="bg-white/20 hover:bg-white/30 rounded-full p-4 transition-colors"
          >
            <Play size={32} className="text-white ml-1" />
          </button>
        </div>
      )}
    </div>
  )
}