'use client'

import { VideoList } from './video-list'

export default function VideoLibrary() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Video Library</h1>
        <p className="text-slate-600 mt-2">Browse and manage your video collection</p>
      </div>
      <VideoList />
    </div>
  )
}