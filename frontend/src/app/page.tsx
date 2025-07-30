'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Sidebar } from '@/components/layout/sidebar'
import { VideoUpload } from '@/components/upload/video-upload'
import { SearchInterface } from '@/components/search/search-interface'
import { VideoList } from '@/components/videos/video-list'
import { SearchResults } from '@/components/search/search-results'
import { ExportManager } from '@/components/export/export-manager'
import { Dashboard } from '@/components/dashboard/dashboard'

type ActiveTab = 'dashboard' | 'upload' | 'search' | 'videos' | 'exports'

export default function Home() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard')
  const [searchResults, setSearchResults] = useState(null)

  const handleSearch = (results: any) => {
    setSearchResults(results)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} />
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
        return <Dashboard onNavigate={setActiveTab} />
    }
  }

  return (
    <div className="flex h-screen rs-gradient-subtle">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
} 