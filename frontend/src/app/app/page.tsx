'use client'

import { useState } from 'react'
import LandingHeader from '@/components/layout/landing-header'
import Sidebar from '@/components/layout/sidebar'
import { Dashboard } from '@/components/dashboard/dashboard'
import { VideoUpload } from '@/components/upload/video-upload'
import { SearchInterface } from '@/components/search/search-interface'
import { LocalSearchPage } from '@/components/search/local-search-page'
import VideoLibrary from '@/components/videos/video-library'
import { ExportManager } from '@/components/export/export-manager'
import Analytics from '@/components/analytics/analytics'
import Settings from '@/components/settings/settings'
import ROICalculator from '@/components/roi/roi-calculator'
import BusinessDashboard from '@/components/business/business-dashboard'
import PricingCalculator from '@/components/pricing/pricing-calculator'
import DemoMode from '@/components/demo/demo-mode'

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [useLocalData, setUseLocalData] = useState(true)

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <VideoUpload />
      case 'search':
        return useLocalData ? <LocalSearchPage /> : <SearchInterface />
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <LandingHeader onNavigate={setActiveTab} />
      
      {/* Demo Mode Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="font-semibold">Demo Mode</span>
            </div>
            <span className="text-indigo-100">You're viewing demo data. Connect storage to search your own logs—no data leaves your VPC.</span>
          </div>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setActiveTab('demo')}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors text-sm font-medium"
            >
              Try demo
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
          {renderContent()}
        </main>
      </div>
    </div>
  )
} 