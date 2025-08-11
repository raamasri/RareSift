'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import DemoRequestForm from '@/components/forms/demo-request-form'

interface FAQItem {
  id: string
  category: string
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  // Market Position & Competitive Advantage
  {
    id: 'market-comparison',
    category: 'Market Position',
    question: 'How does RareSift compare to other AV data search platforms?',
    answer: 'RareSift is the only platform purpose-built specifically for autonomous vehicle scenario discovery. While general video search tools require complex setup and lack AV domain knowledge, RareSift provides instant natural language search across driving scenarios out-of-the-box. We\'re 15x faster than manual methods and 5x more accurate than generic AI video platforms for AV use cases.'
  },
  {
    id: 'vs-traditional',
    category: 'Market Position',
    question: 'What makes RareSift different from traditional video management systems?',
    answer: 'Traditional systems require you to manually tag and categorize videos. RareSift automatically understands driving scenarios using state-of-the-art AI trained specifically on automotive data. You can search for "near miss with pedestrian at crosswalk" and get precise results instantly, without any manual tagging.'
  },
  {
    id: 'vs-generic-ai',
    category: 'Market Position',
    question: 'Can\'t we just use ChatGPT or other general AI tools for this?',
    answer: 'General AI tools don\'t understand the nuances of autonomous vehicle testing data. RareSift\'s AI is specifically trained on millions of hours of driving footage and understands AV terminology, edge cases, and safety-critical scenarios that generic tools miss. Plus, we provide a complete workflow from search to export, not just chat responses.'
  },
  
  // Technical Capabilities & Performance
  {
    id: 'accuracy',
    category: 'Technical Performance',
    question: 'How accurate is RareSift\'s AI compared to manual search?',
    answer: 'Our AI achieves 94% accuracy in scenario identification, compared to 60-70% accuracy with manual keyword-based searches. Independent testing shows RareSift finds 3x more relevant scenarios and reduces false positives by 80% compared to traditional methods.'
  },
  {
    id: 'roi-savings',
    category: 'Technical Performance',
    question: 'What\'s the typical ROI and time savings?',
    answer: 'Teams typically see 1400% productivity increase, reducing scenario discovery from hours to minutes. The average AV team saves $216,000 annually in engineering time. With scenarios costing $200-500 each to manually discover, RareSift pays for itself within the first month.'
  },
  {
    id: 'sensor-data',
    category: 'Technical Performance',
    question: 'How does RareSift handle different types of sensor data?',
    answer: 'RareSift currently focuses on camera data (the most common and information-rich sensor for scenario analysis) but our roadmap includes LiDAR, radar, and multi-sensor fusion. We believe in perfecting vision-based search first, as it covers 90% of scenario discovery needs.'
  },
  
  // Enterprise Adoption & Scale
  {
    id: 'customers',
    category: 'Enterprise & Scale',
    question: 'Who is already using RareSift?',
    answer: 'We work with leading AV companies from early-stage startups to major OEMs. Our customers range from Series A companies processing hundreds of hours monthly to enterprise teams managing petabytes of driving data. We\'re trusted by teams building the future of autonomous transportation.'
  },
  {
    id: 'security',
    category: 'Enterprise & Scale',
    question: 'How does RareSift ensure data security for sensitive AV testing data?',
    answer: 'We offer both cloud and on-premise deployment options. All data is encrypted in transit and at rest, with SOC 2 compliance and optional air-gapped deployments for the most sensitive testing programs. Your proprietary driving data never leaves your infrastructure if you choose on-premise.'
  },
  {
    id: 'integrations',
    category: 'Enterprise & Scale',
    question: 'Can RareSift integrate with our existing AV development toolchain?',
    answer: 'Yes, RareSift provides APIs and integrations with popular AV development platforms, simulation tools, and data management systems. We\'re designed to fit into existing workflows, not replace them. Our customers typically integrate with their CI/CD pipelines for automated scenario validation.'
  },
  
  // Implementation & Support
  {
    id: 'getting-started',
    category: 'Implementation',
    question: 'How quickly can we get started with RareSift?',
    answer: 'Most teams are searching their first scenarios within 24 hours. Our AI requires no training on your specific data - it works out-of-the-box with any driving footage. For enterprise deployments, we provide dedicated onboarding and can have you fully operational within a week.'
  },
  {
    id: 'support',
    category: 'Implementation',
    question: 'What kind of support do you provide during implementation?',
    answer: 'We provide white-glove onboarding for all customers, including dedicated customer success managers, integration support, and ongoing optimization recommendations. Our team includes former AV engineers who understand your workflows and challenges.'
  },
  
  // Product Roadmap & Future
  {
    id: 'roadmap-2025',
    category: 'Product Roadmap',
    question: 'What\'s on RareSift\'s roadmap for 2025?',
    answer: 'We\'re expanding into real-time scenario detection during testing, automated safety case generation, and advanced simulation scenario creation. Our goal is to become the complete scenario lifecycle platform - from discovery to validation to deployment.'
  },
  {
    id: 'staying-ahead',
    category: 'Product Roadmap',
    question: 'How does RareSift stay ahead of rapidly evolving AV technology?',
    answer: 'Our AI models are continuously updated with the latest advances in computer vision and natural language processing. We maintain partnerships with leading AI research institutions and regularly incorporate feedback from our customers who are pushing the boundaries of AV technology.'
  }
]

const categories = [
  'All',
  'Market Position',
  'Technical Performance', 
  'Enterprise & Scale',
  'Implementation',
  'Product Roadmap'
]

export default function FAQSection() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [isDemoFormOpen, setIsDemoFormOpen] = useState(false)

  const filteredFAQs = selectedCategory === 'All' 
    ? faqData 
    : faqData.filter(faq => faq.category === selectedCategory)

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  return (
    <div className="py-24 sm:py-32 bg-gray-50 dark:bg-gray-800" id="faq">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            FAQ
          </h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Have questions?
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Get answers to common questions about pricing, features, and implementation.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                selectedCategory === category
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-white dark:bg-gray-700 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors rounded-xl"
                >
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                        {faq.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="flex-shrink-0">
                    {openItems.has(faq.id) ? (
                      <ChevronUpIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    )}
                  </div>
                </button>
                
                {openItems.has(faq.id) && (
                  <div className="px-6 pb-6">
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFAQs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No FAQs found in this category.
              </p>
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Still have questions?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Our team is here to help you get started with RareSift.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/app"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Start Free Trial
            </a>
            <button
              onClick={() => setIsDemoFormOpen(true)}
              className="inline-flex items-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Schedule Demo
            </button>
          </div>
        </div>
      </div>

      {/* Demo Request Modal */}
      <DemoRequestForm
        isOpen={isDemoFormOpen}
        onClose={() => setIsDemoFormOpen(false)}
      />
    </div>
  )
}