'use client'

import { 
  MagnifyingGlassIcon, 
  CloudArrowUpIcon, 
  FilmIcon, 
  ArrowDownTrayIcon,
  ChartBarIcon,
  CpuChipIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const primaryNavigation = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: ChartBarIcon, 
    description: 'Overview & analytics',
    badge: 'HOME',
    color: 'slate'
  },
  { 
    id: 'search', 
    name: 'AI Search', 
    icon: MagnifyingGlassIcon, 
    description: 'Natural language search',
    badge: 'AI',
    color: 'indigo'
  },
  { 
    id: 'upload', 
    name: 'Data Ingestion', 
    icon: CloudArrowUpIcon, 
    description: 'Upload & process videos',
    badge: 'NEW',
    color: 'emerald'
  },
  { 
    id: 'videos', 
    name: 'Video Library', 
    icon: FilmIcon, 
    description: 'Manage datasets',
    badge: '',
    color: 'blue'
  },
  { 
    id: 'exports', 
    name: 'Export Hub', 
    icon: ArrowDownTrayIcon, 
    description: 'Download results',
    badge: '',
    color: 'purple'
  },
]

const secondaryNavigation = [
  { id: 'analytics', name: 'Analytics', icon: DocumentChartBarIcon, description: 'Usage insights' },
  { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, description: 'Configuration' },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-72 bg-white border-r border-slate-200/60 flex flex-col rs-shadow-sm">
      {/* Navigation Header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rs-gradient-primary rounded-lg flex items-center justify-center">
            <CpuChipIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">AI Platform</h2>
            <p className="text-xs text-slate-500">Autonomous Vehicle Intelligence</p>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <div className="flex-1 py-6">
        <div className="px-4 mb-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Core Features
          </h3>
        </div>
        
        <nav className="space-y-1 px-4">
          {primaryNavigation.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  'w-full group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 relative',
                  isActive
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rs-shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"></div>
                )}
                
                <div className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rs-shadow'
                    : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'
                )}>
                  <item.icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{item.name}</span>
                    {item.badge && (
                      <span className={clsx(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        item.badge === 'AI' 
                          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'
                          : item.badge === 'HOME'
                            ? 'bg-gradient-to-r from-slate-100 to-gray-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-700'
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className={clsx(
                    'text-xs mt-0.5',
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  )}>
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Secondary Navigation */}
        <div className="mt-8">
          <div className="px-4 mb-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Management
            </h3>
          </div>
          
          <nav className="space-y-1 px-4">
            {secondaryNavigation.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={clsx(
                    'w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                    isActive
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  <span>{item.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>
      
      {/* Status Footer */}
      <div className="border-t border-slate-100 p-4">
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-900">System Status</p>
              <p className="text-xs text-slate-600">All services operational</p>
            </div>
            <ChartBarIcon className="h-5 w-5 text-emerald-500" />
          </div>
          
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>API Latency: 45ms</span>
            <span>Uptime: 99.9%</span>
          </div>
        </div>
      </div>
    </div>
  )
} 