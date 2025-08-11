'use client'

import LandingHeader from '@/components/landing/LandingHeader'
import HeroSection from '@/components/landing/hero/HeroSection'
import FeatureGrid from '@/components/landing/features/FeatureGrid'
import InteractiveDemo from '@/components/landing/features/InteractiveDemo'
import CompetitiveDifferentiation from '@/components/landing/features/CompetitiveDifferentiation'
import StatsSection from '@/components/landing/social-proof/StatsSection'
import TestimonialCarousel from '@/components/landing/social-proof/TestimonialCarousel'
import PricingSection from '@/components/landing/pricing/PricingSection'
import FAQSection from '@/components/landing/faq/FAQSection'
import FinalCTA from '@/components/landing/conversion/FinalCTA'
import LandingFooter from '@/components/landing/LandingFooter'

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

      <CompetitiveDifferentiation />
      
      <StatsSection />
      
      <section className="bg-gray-50 dark:bg-gray-800/50">
        <TestimonialCarousel />
      </section>
      
      <PricingSection />
      
      <FAQSection />
      
      <FinalCTA />
      
      <LandingFooter />
    </div>
  )
}