'use client'

import { 
  Cog6ToothIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'

export function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="rs-gradient-subtle border-b border-slate-200/60 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Brand Section */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              {/* Professional Logo */}
              <div className="relative">
                <div className="w-10 h-10 rs-gradient-primary rounded-xl rs-shadow flex items-center justify-center">
                  <div className="w-6 h-6 relative">
                    <div className="absolute inset-0 bg-white/90 rounded-sm rotate-45 transform origin-center"></div>
                    <div className="absolute inset-1 bg-white/70 rounded-sm"></div>
                    <div className="absolute inset-2 bg-white rounded-sm"></div>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold rs-text-gradient">RareSift</h1>
                <p className="text-xs text-slate-500 font-medium">Enterprise AI Platform</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="hidden md:flex">
              <span className="rs-status-success">
                ✓ Production Ready
              </span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Processing Status */}
            <div className="hidden lg:flex items-center space-x-3 bg-white/70 backdrop-blur-sm px-4 py-2 rounded-xl border border-slate-200/60">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700">System Healthy</span>
              </div>
              <div className="w-px h-4 bg-slate-200"></div>
              <div className="text-xs text-slate-500">
                All services operational
              </div>
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-xl transition-all duration-200">
              <BellIcon className="h-5 w-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"></span>
            </button>

            {/* Settings */}
            <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-xl transition-all duration-200">
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-white/70 backdrop-blur-sm hover:bg-white/90 px-3 py-2 rounded-xl border border-slate-200/60 transition-all duration-200"
              >
                <UserCircleIcon className="h-6 w-6 text-slate-600" />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-900">Admin User</p>
                  <p className="text-xs text-slate-500">admin@company.com</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl rs-shadow-lg border border-slate-200/60 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Admin User</p>
                    <p className="text-xs text-slate-500">admin@company.com</p>
                  </div>
                  <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Profile Settings</a>
                  <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">API Keys</a>
                  <a href="#" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Usage & Billing</a>
                  <div className="border-t border-slate-100 mt-2"></div>
                  <a href="#" className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Sign Out</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
} 