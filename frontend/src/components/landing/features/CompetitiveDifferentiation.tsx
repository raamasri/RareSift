'use client'

import { CheckCircleIcon, XMarkIcon, SparklesIcon, RocketLaunchIcon, CpuChipIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

const competitors = [
  {
    name: 'Traditional Video Tools',
    description: 'Manual scrubbing through footage',
    limitations: [
      'Hours of manual review per scenario',
      'No semantic understanding',
      'Limited to keyword metadata',
      'No AI-powered search',
      'Requires extensive human labor'
    ],
    icon: '🔍',
    color: 'gray'
  },
  {
    name: 'Basic Annotation Platforms',
    description: 'Static labeling and tagging systems',
    limitations: [
      'Pre-defined tags only',
      'No natural language queries',
      'Limited to existing metadata',
      'No frame-level precision',
      'Requires manual categorization'
    ],
    icon: '📝',
    color: 'orange'
  },
  {
    name: 'Generic Search Solutions',
    description: 'Text-based database queries',
    limitations: [
      'No visual understanding',
      'Limited to structured data',
      'No contextual awareness',
      'Complex query syntax required',
      'Poor performance on video data'
    ],
    icon: '🗃️',
    color: 'blue'
  }
]

const raresiftAdvantages = [
  {
    title: 'Natural Language Search',
    description: 'Ask questions in plain English like "show me pedestrians crossing in fog"',
    icon: <MagnifyingGlassIcon className="h-6 w-6" />,
    benefit: 'No training required - instant productivity'
  },
  {
    title: 'Frame-Level Precision',
    description: 'Pinpoint exact moments down to individual frames with timestamp accuracy',
    icon: <CpuChipIcon className="h-6 w-6" />,
    benefit: 'Find needle-in-haystack scenarios instantly'
  },
  {
    title: 'Semantic Understanding',
    description: 'AI understands context, relationships, and visual concepts beyond simple tags',
    icon: <SparklesIcon className="h-6 w-6" />,
    benefit: 'Discover scenarios you never thought to search for'
  },
  {
    title: 'Enterprise Scale',
    description: 'Handle 100TB+ datasets with sub-second query performance',
    icon: <RocketLaunchIcon className="h-6 w-6" />,
    benefit: 'Scale with your data growth effortlessly'
  }
]

export default function CompetitiveDifferentiation() {
  return (
    <section className="py-24 sm:py-32 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Why RareSift
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Beyond traditional video search
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            While others require manual work or basic tagging, RareSift brings true AI understanding to autonomous vehicle scenario discovery.
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          {/* Traditional Solutions */}
          {competitors.map((competitor, index) => (
            <div key={competitor.name} className="relative">
              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 h-full">
                <div className="text-center mb-4">
                  <div className="text-4xl mb-3">{competitor.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {competitor.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {competitor.description}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                    Limitations:
                  </div>
                  {competitor.limitations.map((limitation, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <XMarkIcon className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {limitation}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* RareSift Solution */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-75"></div>
            <div className="relative rounded-2xl border-2 border-indigo-600 dark:border-indigo-400 bg-white dark:bg-gray-900 p-6 h-full">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-2xl font-bold mb-3">
                  RS
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  RareSift
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI-powered semantic search
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">
                  Advantages:
                </div>
                {raresiftAdvantages.map((advantage, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {advantage.benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Advantages */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">
            How RareSift transforms AV scenario discovery
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {raresiftAdvantages.map((advantage, index) => (
              <div key={advantage.title} className="relative">
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white">
                      {advantage.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {advantage.title}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-3">
                      {advantage.description}
                    </p>
                    <div className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/20 px-3 py-1 text-sm font-medium text-green-800 dark:text-green-400">
                      ✓ {advantage.benefit}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center rounded-full bg-indigo-100 dark:bg-indigo-900/20 px-6 py-3 text-sm font-medium text-indigo-800 dark:text-indigo-400 mb-6">
            <SparklesIcon className="mr-2 h-4 w-4" />
            Ready to experience the difference?
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            See how RareSift's AI-powered search transforms hours of manual video review into seconds of precise discovery.
          </p>
        </div>
      </div>
    </section>
  )
}