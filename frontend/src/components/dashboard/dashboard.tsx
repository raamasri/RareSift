'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  CpuChipIcon,
  PlayIcon,
  ArrowTrendingUpIcon,
  ClockIcon,
  FilmIcon,
  SparklesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface DashboardStats {
  totalVideos: number
  totalFrames: number
  totalSearches: number
  processingJobs: number
  avgProcessingTime: string
  storageUsed: string
}

interface QuickAction {
  id: string
  title: string
  description: string
  icon: any
  color: string
  action: () => void
}

interface DashboardProps {
  onNavigate?: (tab: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showActivityModal, setShowActivityModal] = useState(false)
  
  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  // Mock data - in real app this would come from API
  const stats: DashboardStats = {
    totalVideos: 24,
    totalFrames: 14420,
    totalSearches: 156,
    processingJobs: 2,
    avgProcessingTime: '1.2m',
    storageUsed: '2.4 GB'
  }

  const quickActions: QuickAction[] = [
    {
      id: 'upload',
      title: 'Upload Video',
      description: 'Add new driving footage for AI analysis',
      icon: CloudArrowUpIcon,
      color: 'from-blue-500 to-indigo-600',
      action: () => onNavigate?.('upload')
    },
    {
      id: 'search',
      title: 'Search Scenarios',
      description: 'Find specific driving scenarios using AI',
      icon: MagnifyingGlassIcon,
      color: 'from-emerald-500 to-green-600',
      action: () => onNavigate?.('search')
    },
    {
      id: 'videos',
      title: 'Video Library',
      description: 'Browse and manage your video collection',
      icon: FilmIcon,
      color: 'from-purple-500 to-violet-600',
      action: () => onNavigate?.('videos')
    },
    {
      id: 'exports',
      title: 'Export Manager',
      description: 'Download datasets and manage exports',
      icon: DocumentTextIcon,
      color: 'from-amber-500 to-orange-600',
      action: () => onNavigate?.('exports')
    }
  ]

  const recentActivity = [
    { id: 1, type: 'upload', description: 'highway_merge_scenario.mp4 uploaded', time: '2 minutes ago', status: 'processing' },
    { id: 2, type: 'search', description: 'Search: "pedestrian crossing at night"', time: '15 minutes ago', status: 'completed' },
    { id: 3, type: 'export', description: 'Dataset exported (45 frames)', time: '1 hour ago', status: 'completed' },
    { id: 4, type: 'upload', description: 'city_driving_rain.mp4 processed', time: '2 hours ago', status: 'completed' }
  ]

  const fullActivityLog = [
    { id: 1, type: 'upload', description: 'highway_merge_scenario.mp4 uploaded', time: '2 minutes ago', status: 'processing', details: 'File size: 245 MB, Duration: 5:32' },
    { id: 2, type: 'search', description: 'Search: "pedestrian crossing at night"', time: '15 minutes ago', status: 'completed', details: '23 results found, Search time: 0.8s' },
    { id: 3, type: 'export', description: 'Dataset exported (45 frames)', time: '1 hour ago', status: 'completed', details: 'Export format: ZIP, File size: 15.2 MB' },
    { id: 4, type: 'upload', description: 'city_driving_rain.mp4 processed', time: '2 hours ago', status: 'completed', details: 'Frames extracted: 1,247, Processing time: 3m 45s' },
    { id: 5, type: 'search', description: 'Search: "traffic light intersection"', time: '3 hours ago', status: 'completed', details: '31 results found, Search time: 1.2s' },
    { id: 6, type: 'upload', description: 'parking_scenario_complex.mp4 uploaded', time: '4 hours ago', status: 'completed', details: 'File size: 189 MB, Duration: 3:24' },
    { id: 7, type: 'export', description: 'Dataset exported (67 frames)', time: '5 hours ago', status: 'completed', details: 'Export format: ZIP, File size: 23.1 MB' },
    { id: 8, type: 'search', description: 'Image search with traffic_scene.jpg', time: '6 hours ago', status: 'completed', details: '18 similar scenes found, Search time: 0.6s' },
    { id: 9, type: 'upload', description: 'construction_zone_detour.mp4 processed', time: '8 hours ago', status: 'completed', details: 'Frames extracted: 892, Processing time: 2m 31s' },
    { id: 10, type: 'search', description: 'Search: "emergency vehicle approaching"', time: '1 day ago', status: 'completed', details: '12 results found, Search time: 0.9s' },
    { id: 11, type: 'upload', description: 'school_zone_morning.mp4 uploaded', time: '1 day ago', status: 'completed', details: 'File size: 156 MB, Duration: 2:48' },
    { id: 12, type: 'export', description: 'Dataset exported (89 frames)', time: '1 day ago', status: 'completed', details: 'Export format: ZIP, File size: 31.7 MB' },
    { id: 13, type: 'search', description: 'Search: "bicycle lane urban"', time: '2 days ago', status: 'completed', details: '27 results found, Search time: 1.1s' },
    { id: 14, type: 'upload', description: 'highway_sunset_drive.mp4 processed', time: '2 days ago', status: 'completed', details: 'Frames extracted: 1,534, Processing time: 4m 12s' },
    { id: 15, type: 'search', description: 'Search: "roundabout navigation"', time: '3 days ago', status: 'completed', details: '19 results found, Search time: 0.7s' }
  ]

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 bg-slate-200 rounded-3xl"></div>
        <div className="space-y-3">
          <div className="h-10 bg-slate-200 rounded-lg mx-auto max-w-lg"></div>
          <div className="h-6 bg-slate-200 rounded-lg mx-auto max-w-2xl"></div>
        </div>
        <div className="flex justify-center space-x-8">
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-4 bg-slate-200 rounded w-24"></div>
          <div className="h-4 bg-slate-200 rounded w-24"></div>
        </div>
      </div>
      
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} className="rs-card p-6">
            <div className="w-12 h-12 bg-slate-200 rounded-xl mx-auto mb-3"></div>
            <div className="h-8 bg-slate-200 rounded mb-2"></div>
            <div className="h-4 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
      
      {/* Quick actions skeleton */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="h-8 bg-slate-200 rounded mx-auto max-w-xs"></div>
          <div className="h-5 bg-slate-200 rounded mx-auto max-w-sm"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="rs-card p-6">
              <div className="w-14 h-14 bg-slate-200 rounded-2xl mb-4"></div>
              <div className="h-6 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 bg-slate-200 rounded mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Activity skeleton */}
      <div className="rs-card p-8">
        <div className="flex justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-32"></div>
            <div className="h-4 bg-slate-200 rounded w-48"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded w-20"></div>
        </div>
        <div className="space-y-4">
          {Array.from({length: 4}).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4">
              <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-3 bg-slate-200 rounded w-20"></div>
              </div>
              <div className="h-6 bg-slate-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-20 h-20 rs-gradient-primary rounded-3xl flex items-center justify-center rs-shadow-lg animate-float">
          <ChartBarIcon className="h-10 w-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">RareSift Dashboard</h1>
          <p className="text-xl text-slate-600 dark:text-gray-300 mt-3 max-w-3xl mx-auto">
            AI-powered autonomous vehicle scenario discovery and analysis platform
          </p>
        </div>
        <div className="flex items-center justify-center space-x-8 text-sm text-slate-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span>System Online</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>CLIP AI Ready</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Processing Active</span>
          </div>
        </div>
      </div>

      {/* Stats Grid with Staggered Animation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="rs-card p-6 text-center animate-stagger-1">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FilmIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalVideos}</div>
          <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Total Videos</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <SparklesIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalFrames.toLocaleString()}</div>
          <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Analyzed Frames</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <MagnifyingGlassIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSearches}</div>
          <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Searches Performed</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CpuChipIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.processingJobs}</div>
          <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Processing Jobs</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-5">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ClockIcon className="h-6 w-6 text-pink-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.avgProcessingTime}</div>
          <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Avg Processing</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-6">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ArrowTrendingUpIcon className="h-6 w-6 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.storageUsed}</div>
          <div className="text-sm text-slate-600 dark:text-gray-400 mt-1">Storage Used</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Quick Actions</h2>
          <p className="text-slate-600 dark:text-gray-300 mt-2">Get started with common tasks</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <button
              key={action.id}
              onClick={action.action}
              className="rs-card p-6 text-left hover:rs-shadow-lg transform hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={clsx(
                'w-14 h-14 bg-gradient-to-br rounded-2xl flex items-center justify-center mb-4 rs-shadow group-hover:scale-110 transition-transform duration-300',
                action.color
              )}>
                <action.icon className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{action.title}</h3>
              <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">{action.description}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                <span>Get Started</span>
                <PlayIcon className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rs-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
            <p className="text-slate-600 dark:text-gray-300 mt-1">Latest platform activity and processing updates</p>
          </div>
          <button 
            onClick={() => setShowActivityModal(true)}
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <div className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                activity.type === 'upload' ? 'bg-blue-100' :
                activity.type === 'search' ? 'bg-emerald-100' :
                activity.type === 'export' ? 'bg-amber-100' : 'bg-purple-100'
              )}>
                {activity.type === 'upload' && <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />}
                {activity.type === 'search' && <MagnifyingGlassIcon className="h-5 w-5 text-emerald-600" />}
                {activity.type === 'export' && <DocumentTextIcon className="h-5 w-5 text-amber-600" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{activity.description}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">{activity.time}</p>
              </div>
              <div className={clsx(
                'px-3 py-1 rounded-full text-xs font-semibold',
                activity.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                activity.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
              )}>
                {activity.status === 'processing' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span>Processing</span>
                  </div>
                )}
                {activity.status === 'completed' && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Log Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Activity Log</h3>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">Comprehensive history of all platform activities</p>
                </div>
                <button
                  onClick={() => setShowActivityModal(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto max-h-[70vh] p-6">
              <div className="space-y-4">
                {fullActivityLog.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
                    <div className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      activity.type === 'upload' ? 'bg-blue-100' :
                      activity.type === 'search' ? 'bg-emerald-100' :
                      activity.type === 'export' ? 'bg-amber-100' : 'bg-purple-100'
                    )}>
                      {activity.type === 'upload' && <CloudArrowUpIcon className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'search' && <MagnifyingGlassIcon className="h-5 w-5 text-emerald-600" />}
                      {activity.type === 'export' && <DocumentTextIcon className="h-5 w-5 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{activity.description}</p>
                        <div className={clsx(
                          'px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0',
                          activity.status === 'processing' ? 'bg-amber-100 text-amber-700' :
                          activity.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                        )}>
                          {activity.status === 'processing' && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                              <span>Processing</span>
                            </div>
                          )}
                          {activity.status === 'completed' && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">{activity.time}</p>
                        <p className="text-xs text-gray-600">{activity.details}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {fullActivityLog.length} activities from the last 7 days
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      const dataStr = JSON.stringify(fullActivityLog, null, 2)
                      const dataBlob = new Blob([dataStr], { type: 'application/json' })
                      const url = URL.createObjectURL(dataBlob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = `raresift_activity_log_${new Date().toISOString().split('T')[0]}.json`
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      URL.revokeObjectURL(url)
                    }}
                    className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Export Log
                  </button>
                  <button
                    onClick={() => setShowActivityModal(false)}
                    className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}