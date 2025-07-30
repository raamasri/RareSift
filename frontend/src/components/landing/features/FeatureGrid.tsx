'use client'

import { 
  MagnifyingGlassIcon, 
  ClockIcon, 
  ArrowDownTrayIcon,
  ScaleIcon,
  ShieldCheckIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Natural Language Search',
    description: 'Search through terabytes of video data using plain English. "Find cars turning left in rain" becomes instant results.',
    icon: MagnifyingGlassIcon,
    color: 'from-indigo-500 to-blue-600'
  },
  {
    name: 'Frame-Level Precision',
    description: 'Locate exact moments, not just entire videos. Our AI identifies specific frames matching your search criteria.',
    icon: ClockIcon,
    color: 'from-purple-500 to-indigo-600'
  },
  {
    name: 'Export Ready Data',
    description: 'Package scenarios for training and validation. Export with metadata, annotations, and custom formats.',
    icon: ArrowDownTrayIcon,
    color: 'from-pink-500 to-purple-600'
  },
  {
    name: 'Enterprise Scale',
    description: 'Handle massive datasets efficiently. Built for companies processing 100TB+ of autonomous vehicle data.',
    icon: ScaleIcon,
    color: 'from-green-500 to-emerald-600'
  },
  {
    name: 'Secure & Compliant',
    description: 'SOC2 certified with enterprise-grade security. Your sensitive AV data stays protected and private.',
    icon: ShieldCheckIcon,
    color: 'from-blue-500 to-cyan-600'
  },
  {
    name: 'Smart Insights',
    description: 'Get analytics on scenario frequency, edge cases, and data gaps to improve your AV model training.',
    icon: LightBulbIcon,
    color: 'from-orange-500 to-pink-600'
  }
]

export default function FeatureGrid() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600 dark:text-indigo-400">
            Powerful Features
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Everything you need to search AV data
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Built specifically for autonomous vehicle teams who need to find specific driving scenarios 
            quickly and accurately across massive video datasets.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {features.map((feature, index) => (
              <div 
                key={feature.name} 
                className="group relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </dd>
                </div>
                
                {/* Hover effect overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}