'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { VideoUpload } from '@/components/upload/video-upload'
import { SearchInterface } from '@/components/search/search-interface'
import { VideoList } from '@/components/videos/video-list'
import { SearchResults } from '@/components/search/search-results'
import { ExportManager } from '@/components/export/export-manager'

type ActiveTab = 'upload' | 'search' | 'videos' | 'exports'

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('search')
  const [searchResults, setSearchResults] = useState(null)

  const handleSearch = (results: any) => {
    setSearchResults(results)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <VideoUpload />
      case 'search':
        return (
          <div className="space-y-6">
            <SearchInterface onSearchResults={handleSearch} />
            {searchResults && <SearchResults results={searchResults} />}
          </div>
        )
      case 'videos':
        return <VideoList />
      case 'exports':
        return <ExportManager />
      default:
        return <SearchInterface onSearchResults={handleSearch} />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
} 