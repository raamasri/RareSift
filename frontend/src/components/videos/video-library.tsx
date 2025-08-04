'use client'

import { VideoList } from './video-list'

export default function VideoLibrary() {
  return (
    <div className="space-y-6">
      {/* Always show database video list with real data */}
      <VideoList />
    </div>
  )
}