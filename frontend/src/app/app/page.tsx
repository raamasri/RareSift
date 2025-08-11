'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import LandingHeader from '@/components/layout/landing-header'
import Sidebar from '@/components/layout/sidebar'
import { Dashboard } from '@/components/dashboard/dashboard'
import { ErrorBoundary, NetworkStatusIndicator } from '@/components/error/error-boundary'
import { VideoUpload } from '@/components/upload/video-upload'
import { SearchInterface } from '@/components/search/search-interface'
import { APISearchInterface } from '@/components/search/api-search-interface'
import { CompleteSearchPage } from '@/components/search/complete-search-page'
import { LocalSearchPage } from '@/components/search/local-search-page'
import VideoLibrary from '@/components/videos/video-library'
import { ExportManager } from '@/components/export/export-manager'
import Analytics from '@/components/analytics/analytics'
import Settings from '@/components/settings/settings'
import ROICalculator from '@/components/roi/roi-calculator'
import BusinessDashboard from '@/components/business/business-dashboard'
import PricingCalculator from '@/components/pricing/pricing-calculator'
import DemoMode from '@/components/demo/demo-mode'

function HomeContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [useLocalData, setUseLocalData] = useState(true)
  const searchParams = useSearchParams()

  // Handle URL query parameter to set active tab on page load
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['upload', 'search', 'videos', 'exports', 'analytics', 'settings', 'roi', 'business', 'pricing', 'demo'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <VideoUpload />
      case 'search':
        return <CompleteSearchPage />
      case 'videos':
        return <VideoLibrary />
      case 'exports':
        return <ExportManager />
      case 'analytics':
        return <Analytics />
      case 'settings':
        return <Settings />
      case 'roi':
        return <ROICalculator />
      case 'business':
        return <BusinessDashboard />
      case 'pricing':
        return <PricingCalculator />
      case 'demo':
        return <DemoMode />
      default:
        return <Dashboard onNavigate={setActiveTab} />
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <NetworkStatusIndicator />
        <LandingHeader onNavigate={setActiveTab} />
        
        {/* Demo Mode Banner */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-semibold">Demo Mode</span>
              </div>
              <span className="text-white/90">You're viewing real data from 22 uploaded videos—search with natural language!</span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setActiveTab('search')}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
              >
                Try search
              </button>
              <button className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                Start free trial
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex">
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <main className="flex-1 ml-64 p-8">
            <ErrorBoundary>
              {renderContent()}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  )
}