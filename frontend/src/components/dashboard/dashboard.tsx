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
  onNavigate: (tab: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const [isLoading, setIsLoading] = useState(true)
  
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
      action: () => onNavigate('upload')
    },
    {
      id: 'search',
      title: 'Search Scenarios',
      description: 'Find specific driving scenarios using AI',
      icon: MagnifyingGlassIcon,
      color: 'from-emerald-500 to-green-600',
      action: () => onNavigate('search')
    },
    {
      id: 'videos',
      title: 'Video Library',
      description: 'Browse and manage your video collection',
      icon: FilmIcon,
      color: 'from-purple-500 to-violet-600',
      action: () => onNavigate('videos')
    },
    {
      id: 'exports',
      title: 'Export Manager',
      description: 'Download datasets and manage exports',
      icon: DocumentTextIcon,
      color: 'from-amber-500 to-orange-600',
      action: () => onNavigate('exports')
    }
  ]

  const recentActivity = [
    { id: 1, type: 'upload', description: 'highway_merge_scenario.mp4 uploaded', time: '2 minutes ago', status: 'processing' },
    { id: 2, type: 'search', description: 'Search: "pedestrian crossing at night"', time: '15 minutes ago', status: 'completed' },
    { id: 3, type: 'export', description: 'Dataset exported (45 frames)', time: '1 hour ago', status: 'completed' },
    { id: 4, type: 'upload', description: 'city_driving_rain.mp4 processed', time: '2 hours ago', status: 'completed' }
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
          <h1 className="text-4xl font-bold text-slate-900">RareSift Dashboard</h1>
          <p className="text-xl text-slate-600 mt-3 max-w-3xl mx-auto">
            AI-powered autonomous vehicle scenario discovery and analysis platform
          </p>
        </div>
        <div className="flex items-center justify-center space-x-8 text-sm text-slate-500">
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
          <div className="text-2xl font-bold text-slate-900">{stats.totalVideos}</div>
          <div className="text-sm text-slate-600 mt-1">Total Videos</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-2">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <SparklesIcon className="h-6 w-6 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalFrames.toLocaleString()}</div>
          <div className="text-sm text-slate-600 mt-1">Analyzed Frames</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <MagnifyingGlassIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalSearches}</div>
          <div className="text-sm text-slate-600 mt-1">Searches Performed</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <CpuChipIcon className="h-6 w-6 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.processingJobs}</div>
          <div className="text-sm text-slate-600 mt-1">Processing Jobs</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-5">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ClockIcon className="h-6 w-6 text-pink-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.avgProcessingTime}</div>
          <div className="text-sm text-slate-600 mt-1">Avg Processing</div>
        </div>

        <div className="rs-card p-6 text-center animate-stagger-6">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <ArrowTrendingUpIcon className="h-6 w-6 text-slate-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.storageUsed}</div>
          <div className="text-sm text-slate-600 mt-1">Storage Used</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
          <p className="text-slate-600 mt-2">Get started with common tasks</p>
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
              <h3 className="text-lg font-bold text-slate-900 mb-2">{action.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{action.description}</p>
              <div className="mt-4 flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
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
            <h2 className="text-xl font-bold text-slate-900">Recent Activity</h2>
            <p className="text-slate-600 mt-1">Latest platform activity and processing updates</p>
          </div>
          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-50">
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors duration-200">
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
                <p className="text-sm font-semibold text-slate-900">{activity.description}</p>
                <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
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
    </div>
  )
}