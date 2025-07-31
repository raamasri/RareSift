'use client'

import { useState, useEffect } from 'react'
import { VideoList } from './video-list'
import { LocalVideoLibrary } from './local-video-library'
import { Switch } from '@headlessui/react'
import { ServerIcon, FolderIcon } from '@heroicons/react/24/outline'
import { auth, tokenManager } from '@/lib/auth'
import clsx from 'clsx'

export default function VideoLibrary() {
  const [useLocalLibrary, setUseLocalLibrary] = useState(true)
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Auto-login as demo user when switching to database mode
  const handleModeSwitch = async (useLocal: boolean) => {
    if (!useLocal && !tokenManager.isAuthenticated()) {
      // Switching to database mode but not authenticated - login as demo user
      setIsAuthenticating(true)
      try {
        await auth.login({
          username: 'demo@raresift.com',
          password: 'demo123'
        })
        console.log('Auto-logged in as demo user')
      } catch (error) {
        console.error('Failed to auto-login as demo user:', error)
        // Fall back to local mode if demo login fails
        useLocal = true
      } finally {
        setIsAuthenticating(false)
      }
    }
    setUseLocalLibrary(useLocal)
  }

  return (
    <div className="space-y-6">
      {/* Library Mode Toggle */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Video Library Mode</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {useLocalLibrary 
                ? "Browsing local video assets with demo data"
                : isAuthenticating 
                  ? "Authenticating with demo user..."
                  : "Connected to backend database (demo user)"
              }
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <ServerIcon className={clsx(
                  "h-5 w-5",
                  !useLocalLibrary ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                )} />
                <span className={clsx(
                  "text-sm font-medium",
                  !useLocalLibrary ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                )}>
                  Database
                </span>
              </div>
              
              <Switch
                checked={useLocalLibrary}
                onChange={handleModeSwitch}
                disabled={isAuthenticating}
                className={clsx(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                  useLocalLibrary ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600',
                  isAuthenticating && 'opacity-50 cursor-not-allowed'
                )}
              >
                <span
                  className={clsx(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    useLocalLibrary ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </Switch>
              
              <div className="flex items-center space-x-2">
                <FolderIcon className={clsx(
                  "h-5 w-5",
                  useLocalLibrary ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                )} />
                <span className={clsx(
                  "text-sm font-medium",
                  useLocalLibrary ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                )}>
                  Local Assets
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {useLocalLibrary && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">
                Demo Mode: Showing 22 local video assets from video_assets/ directory
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Render appropriate library component */}
      {useLocalLibrary ? <LocalVideoLibrary /> : <VideoList />}
    </div>
  )
}