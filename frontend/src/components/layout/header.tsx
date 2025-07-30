'use client'

import { MagnifyingGlassIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

export function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">RareSift</h1>
          </div>
          <span className="text-sm text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
            AI-Powered AV Search
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Demo Environment</p>
            <p className="text-xs text-gray-500">YC MVP Build</p>
          </div>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
} 