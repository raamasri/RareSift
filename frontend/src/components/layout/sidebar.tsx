'use client'

import { 
  MagnifyingGlassIcon, 
  CloudArrowUpIcon, 
  FilmIcon, 
  ArrowDownTrayIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const navigation = [
  { id: 'search', name: 'Search', icon: MagnifyingGlassIcon, description: 'Find scenarios' },
  { id: 'upload', name: 'Upload', icon: CloudArrowUpIcon, description: 'Add videos' },
  { id: 'videos', name: 'Videos', icon: FilmIcon, description: 'Manage library' },
  { id: 'exports', name: 'Exports', icon: ArrowDownTrayIcon, description: 'Download results' },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex-1 py-6">
        <nav className="space-y-2 px-3">
          {navigation.map((item) => {
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={clsx(
                  'w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <item.icon 
                  className={clsx(
                    'mr-3 h-5 w-5',
                    isActive ? 'text-blue-700' : 'text-gray-400'
                  )} 
                />
                <div className="text-left">
                  <div>{item.name}</div>
                  <div className={clsx(
                    'text-xs',
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  )}>
                    {item.description}
                  </div>
                </div>
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="h-4 w-4 text-gray-400" />
          <div className="text-xs text-gray-500">
            Status: Ready for Demo
          </div>
        </div>
      </div>
    </div>
  )
} 