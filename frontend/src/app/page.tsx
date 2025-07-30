'use client'

import LandingHeader from '@/components/landing/LandingHeader'
import HeroSection from '@/components/landing/hero/HeroSection'
import FeatureGrid from '@/components/landing/features/FeatureGrid'
import InteractiveDemo from '@/components/landing/features/InteractiveDemo'
import StatsSection from '@/components/landing/social-proof/StatsSection'
import TestimonialCarousel from '@/components/landing/social-proof/TestimonialCarousel'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <LandingHeader />
      <HeroSection />
      
      <section id="features" className="bg-gray-50 dark:bg-gray-800/50">
        <FeatureGrid />
      </section>
      
      <section id="demo">
        <InteractiveDemo />
      </section>
      
      <StatsSection />
      
      <section className="bg-gray-50 dark:bg-gray-800/50">
        <TestimonialCarousel />
      </section>
      
      {/* Pricing section will be added in Phase 4 */}
    </div>
  )
}