'use client'

import LandingHeader from '@/components/landing/LandingHeader'
import HeroSection from '@/components/landing/hero/HeroSection'
import FeatureGrid from '@/components/landing/features/FeatureGrid'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <LandingHeader />
      <HeroSection />
      
      <section id="features" className="bg-gray-50 dark:bg-gray-800/50">
        <FeatureGrid />
      </section>
      
      {/* More sections will be added in Phase 3 */}
    </div>
  )
}