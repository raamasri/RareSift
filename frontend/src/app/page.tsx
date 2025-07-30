'use client'

import { useState } from 'react'
import LandingHeader from '@/components/layout/landing-header'
import Sidebar from '@/components/layout/sidebar'
import { Dashboard } from '@/components/dashboard/dashboard'
import { VideoUpload } from '@/components/upload/video-upload'
import { SearchInterface } from '@/components/search/search-interface'
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

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return <VideoUpload />
      case 'search':
        return <SearchInterface />
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
      <div className="flex">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 ml-64 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  )
} 