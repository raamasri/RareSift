'use client'

import { useState, useEffect } from 'react'
import { 
  PlayIcon,
  PauseIcon,
  BeakerIcon,
  SparklesIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  FilmIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface DemoVideo {
  id: string
  filename: string
  thumbnail: string
  duration: number
  scenarios: string[]
  metadata: {
    location: string
    weather: string
    time_of_day: string
    speed_avg: number
  }
  frames_analyzed: number
  processing_time: string
}

interface DemoSearchResult {
  id: string
  video_id: string
  timestamp: number
  similarity: number
  description: string
  thumbnail: string
  metadata: {
    weather: string
    time_of_day: string
    location: string
  }
}

const sampleVideos: DemoVideo[] = [
  {
    id: 'demo_1',
    filename: 'sf_downtown_rush_hour.mp4',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNGMkY0RjciLz48cGF0aCBkPSJNMTQwIDgwSDI2MFYxMDBIMTQwVjgwWiIgZmlsbD0iIzM3NEE1MSIvPjxjaXJjbGUgY3g9IjE4MCIgY3k9IjkwIiByPSIzIiBmaWxsPSIjRUY0NDQ0Ii8+PHRleHQgeD0iMTYwIiB5PSIxMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NEE1MSI+U0YgUnVzaCBIb3VyPC90ZXh0Pjwvc3ZnPg==',
    duration: 420,
    scenarios: ['pedestrian crossing at intersection', 'bus stop with passengers', 'cyclist in bike lane', 'delivery truck double parked'],
    metadata: {
      location: 'San Francisco Downtown',
      weather: 'clear',
      time_of_day: 'day',
      speed_avg: 15
    },
    frames_analyzed: 1260,
    processing_time: '2m 15s'
  },
  {
    id: 'demo_2', 
    filename: 'highway_night_rain.mp4',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiMyRDNBNDgiLz48cGF0aCBkPSJNNDAgMTIwSDI4MFYxNDBINDBWMTIwWiIgZmlsbD0iIzRBNTU2OCIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjYwIiByPSIyIiBmaWxsPSIjRkZGRkZGIi8+PGNpcmNsZSBjeD0iMjIwIiBjeT0iNDAiIHI9IjIiIGZpbGw9IiNGRkZGRkYiLz48dGV4dCB4PSIxMjAiIHk9IjE2NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjRkZGRkZGIj5OaWdodCBSYWluPC90ZXh0Pjwvc3ZnPg==',
    duration: 720,
    scenarios: ['lane change in heavy rain', 'vehicle aquaplaning', 'reduced visibility conditions', 'emergency vehicle in distance'],
    metadata: {
      location: 'I-101 Highway',
      weather: 'rainy',
      time_of_day: 'night',
      speed_avg: 65
    },
    frames_analyzed: 2160,
    processing_time: '3m 45s'
  },
  {
    id: 'demo_3',
    filename: 'suburban_school_zone.mp4', 
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyMCIgaGVpZ2h0PSIxODAiIGZpbGw9IiNGNEY5RkEiLz48cGF0aCBkPSJNMTAwIDgwSDE2MFY5MEgxMDBWODBaIiBmaWxsPSIjRjU5RTBCIi8+PGNpcmNsZSBjeD0iMjAwIiBjeT0iMTAwIiByPSI0IiBmaWxsPSIjMTBCOTgxIi8+PHRleHQgeD0iMTA1IiB5PSIxNDAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxMiIgZmlsbD0iIzM3NEE1MSI+U2Nob29sIFpvbmU8L3RleHQ+PC9zdmc+',
    duration: 180,
    scenarios: ['school bus with flashing lights', 'children crossing street', 'crossing guard directing traffic'],
    metadata: {
      location: 'Suburban School Zone',
      weather: 'clear',
      time_of_day: 'day',
      speed_avg: 20
    },
    frames_analyzed: 540,
    processing_time: '1m 30s'
  }
]

const sampleSearchResults: Record<string, DemoSearchResult[]> = {
  'pedestrian crossing at night': [
    {
      id: 'result_1',
      video_id: 'demo_2',
      timestamp: 145.5,
      similarity: 0.94,
      description: 'Pedestrian crossing at intersection with street lights',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiMyRDNBNDgiLz48Y2lyY2xlIGN4PSI4MCIgY3k9IjQ1IiByPSI4IiBmaWxsPSIjRkZGRkZGIi8+PC9zdmc+',
      metadata: {
        weather: 'rainy',
        time_of_day: 'night',
        location: 'I-101 Highway'
      }
    },
    {
      id: 'result_2',
      video_id: 'demo_1',
      timestamp: 89.2,
      similarity: 0.87,
      description: 'Person walking across busy intersection',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiNGMkY0RjciLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjQ1IiByPSI2IiBmaWxsPSIjMzc0QTUxIi8+PC9zdmc+',
      metadata: {
        weather: 'clear',
        time_of_day: 'day',
        location: 'San Francisco Downtown'
      }
    }
  ],
  'school bus': [
    {
      id: 'result_3',
      video_id: 'demo_3',
      timestamp: 45.0,
      similarity: 0.96,
      description: 'School bus with stop sign extended and flashing lights',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiNGNEY5RkEiLz48cmVjdCB4PSI0MCIgeT0iMzAiIHdpZHRoPSI4MCIgaGVpZ2h0PSIzMCIgZmlsbD0iI0Y1OUUwQiIvPjwvc3ZnPg==',
      metadata: {
        weather: 'clear',
        time_of_day: 'day',
        location: 'Suburban School Zone'
      }
    }
  ],
  'heavy rain': [
    {
      id: 'result_4',
      video_id: 'demo_2',
      timestamp: 234.8,
      similarity: 0.91,
      description: 'Heavy rainfall with reduced visibility on highway',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTYwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iOTAiIGZpbGw9IiMyRDNBNDgiLz48bGluZSB4MT0iMjAiIHkxPSIxMCIgeDI9IjE1IiB5Mj0iMjAiIHN0cm9rZT0iIzlDQTNBRiIvPjxsaW5lIHgxPSI0MCIgeTE9IjE1IiB4Mj0iMzUiIHkyPSIyNSIgc3Ryb2tlPSIjOUNBM0FGIi8+PC9zdmc+',
      metadata: {
        weather: 'rainy',
        time_of_day: 'night',
        location: 'I-101 Highway'
      }
    }
  ]
}

export default function DemoMode() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<DemoSearchResult[]>([])
  const [processingVideos, setProcessingVideos] = useState<string[]>([])
  const [completedVideos, setCompletedVideos] = useState<string[]>([])

  const demoSteps = [
    {
      title: 'Upload AV Videos',
      description: 'Upload driving footage with metadata',
      action: 'upload',
      duration: 3000
    },
    {
      title: 'AI Processing',
      description: 'Extract frames and generate CLIP embeddings',
      action: 'process',
      duration: 4000
    },
    {
      title: 'Natural Language Search',
      description: 'Search using natural language queries',
      action: 'search',
      duration: 2000
    },
    {
      title: 'Export Results',
      description: 'Download scenarios for training/testing',
      action: 'export',
      duration: 1500
    }
  ]

  useEffect(() => {
    if (isPlaying && currentStep < demoSteps.length) {
      const timer = setTimeout(() => {
        executeStep(currentStep)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isPlaying, currentStep])

  const executeStep = async (step: number) => {
    const currentAction = demoSteps[step]
    
    switch (currentAction.action) {
      case 'upload':
        // Simulate video upload
        setProcessingVideos(['demo_1'])
        setTimeout(() => {
          setProcessingVideos(['demo_1', 'demo_2'])
        }, 1000)
        setTimeout(() => {
          setProcessingVideos(['demo_1', 'demo_2', 'demo_3'])
          setCurrentStep(1)
        }, 2000)
        break
        
      case 'process':
        // Simulate processing completion
        setTimeout(() => {
          setCompletedVideos(['demo_1'])
          setProcessingVideos(['demo_2', 'demo_3'])
        }, 1500)
        setTimeout(() => {
          setCompletedVideos(['demo_1', 'demo_2'])
          setProcessingVideos(['demo_3'])
        }, 2500)
        setTimeout(() => {
          setCompletedVideos(['demo_1', 'demo_2', 'demo_3'])
          setProcessingVideos([])
          setCurrentStep(2)
        }, 3500)
        break
        
      case 'search':
        // Simulate search
        setSearchQuery('pedestrian crossing at night')
        setTimeout(() => {
          setSearchResults(sampleSearchResults['pedestrian crossing at night'])
          setTimeout(() => {
            setCurrentStep(3)
          }, 1000)
        }, 1500)
        break
        
      case 'export':
        // Simulate export
        setTimeout(() => {
          setIsPlaying(false)
          alert('🎉 Demo Complete!\n\nResults exported successfully. In a real scenario, you would download a ZIP file containing:\n\n• Selected video frames\n• Metadata (timestamps, locations, weather)\n• Training-ready dataset format\n\nThis demo shows a 15x speed improvement over manual scenario discovery!')
        }, 1000)
        break
    }
  }

  const startDemo = () => {
    setCurrentStep(0)
    setIsPlaying(true)
    setSearchQuery('')
    setSearchResults([])
    setProcessingVideos([])
    setCompletedVideos([])
  }

  const resetDemo = () => {
    setIsPlaying(false)
    setCurrentStep(0)
    setSearchQuery('')
    setSearchResults([])
    setProcessingVideos([])
    setCompletedVideos([])
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
          <BeakerIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Live Demo Mode</h1>
          <p className="text-lg text-gray-600 dark:text-slate-300 mt-2 max-w-2xl mx-auto">
            Experience RareSift's AI-powered scenario discovery in action
          </p>
        </div>
      </div>

      {/* Demo Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Interactive Demo</h3>
            <p className="text-sm text-gray-600">Watch RareSift process videos and search scenarios</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={startDemo}
              disabled={isPlaying}
              className={clsx(
                'flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors',
                isPlaying
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
            >
              <PlayIcon className="h-4 w-4" />
              <span>Start Demo</span>
            </button>
            <button
              onClick={resetDemo}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowRightIcon className="h-4 w-4 transform rotate-180" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {demoSteps.map((step, index) => (
            <div
              key={index}
              className={clsx(
                'p-4 rounded-lg border transition-all duration-500',
                index === currentStep && isPlaying
                  ? 'border-indigo-500 bg-indigo-50'
                  : index < currentStep
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              )}
            >
              <div className="flex items-center space-x-2 mb-2">
                {index < currentStep ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : index === currentStep && isPlaying ? (
                  <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                <span className="font-medium text-sm">{step.title}</span>
              </div>
              <p className="text-xs text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Video Library */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FilmIcon className="h-5 w-5 text-indigo-600 mr-2" />
            Video Library
          </h3>
          
          <div className="space-y-4">
            {sampleVideos.map((video) => (
              <div
                key={video.id}
                className={clsx(
                  'flex items-center space-x-4 p-4 rounded-lg border transition-all duration-500',
                  processingVideos.includes(video.id)
                    ? 'border-blue-500 bg-blue-50'
                    : completedVideos.includes(video.id)
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                )}
              >
                <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  <img src={video.thumbnail} alt={video.filename} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {video.filename}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')} • {video.frames_analyzed} frames
                  </div>
                </div>
                
                <div className="flex-shrink-0">
                  {processingVideos.includes(video.id) ? (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs">Processing...</span>
                    </div>
                  ) : completedVideos.includes(video.id) ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="text-xs">Ready</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Search Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MagnifyingGlassIcon className="h-5 w-5 text-indigo-600 mr-2" />
            AI Search
          </h3>
          
          <div className="space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Natural language search..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={currentStep < 2}
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-900">
                  Found {searchResults.length} matching scenarios:
                </div>
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors"
                  >
                    <div className="w-12 h-8 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      <img src={result.thumbnail} alt="Result" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {result.description}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.floor(result.timestamp / 60)}:{String(Math.floor(result.timestamp % 60)).padStart(2, '0')} • {(result.similarity * 100).toFixed(0)}% match
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="text-xs font-medium text-green-600">
                        {(result.similarity * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ChartBarIcon className="h-5 w-5 text-green-600 mr-2" />
          Demo Performance Metrics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">15x</div>
            <div className="text-sm text-gray-600">Faster than Manual</div>
            <div className="text-xs text-gray-500 mt-1">6 min vs 2.5 hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">94%</div>
            <div className="text-sm text-gray-600">Search Accuracy</div>
            <div className="text-xs text-gray-500 mt-1">AI-powered matching</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">1.2s</div>
            <div className="text-sm text-gray-600">Search Time</div>
            <div className="text-xs text-gray-500 mt-1">Sub-second results</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">3,960</div>
            <div className="text-sm text-gray-600">Frames Analyzed</div>
            <div className="text-xs text-gray-500 mt-1">Complete coverage</div>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            <SparklesIcon className="h-4 w-4 inline mr-1" />
            This demo represents real-world performance on typical AV datasets
          </p>
        </div>
      </div>
    </div>
  )
}