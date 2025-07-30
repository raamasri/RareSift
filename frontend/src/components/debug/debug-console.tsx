'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  BugAntIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import clsx from 'clsx'

interface LogEntry {
  id: string
  timestamp: Date
  level: 'info' | 'success' | 'warning' | 'error'
  category: string
  message: string
  details?: any
}

interface DebugConsoleProps {
  isOpen: boolean
  onClose: () => void
}

// Global log store
class LogStore {
  private logs: LogEntry[] = []
  private listeners: ((logs: LogEntry[]) => void)[] = []
  private maxLogs = 100

  addLog(level: LogEntry['level'], category: string, message: string, details?: any) {
    const log: LogEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      level,
      category,
      message,
      details
    }

    this.logs.unshift(log)
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    this.notifyListeners()
  }

  getLogs() {
    return this.logs
  }

  clearLogs() {
    this.logs = []
    this.notifyListeners()
  }

  subscribe(listener: (logs: LogEntry[]) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]))
  }
}

export const logStore = new LogStore()

// Enhanced API wrapper with logging
export const createLoggedApi = () => {
  const originalPost = api.post
  const originalGet = api.get
  const originalDelete = api.delete

  api.post = async (...args) => {
    const [url, data] = args
    logStore.addLog('info', 'API', `POST ${url}`, { data })
    try {
      const response = await originalPost.apply(api, args as any)
      logStore.addLog('success', 'API', `POST ${url} - Success`, { 
        status: response.status,
        data: response.data 
      })
      return response
    } catch (error: any) {
      logStore.addLog('error', 'API', `POST ${url} - Failed`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
      throw error
    }
  }

  api.get = async (...args) => {
    const [url] = args
    logStore.addLog('info', 'API', `GET ${url}`)
    try {
      const response = await originalGet.apply(api, args as any)
      logStore.addLog('success', 'API', `GET ${url} - Success`, { 
        status: response.status 
      })
      return response
    } catch (error: any) {
      logStore.addLog('error', 'API', `GET ${url} - Failed`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
      throw error
    }
  }

  api.delete = async (...args) => {
    const [url] = args
    logStore.addLog('info', 'API', `DELETE ${url}`)
    try {
      const response = await originalDelete.apply(api, args as any)
      logStore.addLog('success', 'API', `DELETE ${url} - Success`, { 
        status: response.status 
      })
      return response
    } catch (error: any) {
      logStore.addLog('error', 'API', `DELETE ${url} - Failed`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      })
      throw error
    }
  }
}

export default function DebugConsole({ isOpen, onClose }: DebugConsoleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState<'all' | 'error' | 'warning' | 'success' | 'info'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Backend health check
  const { data: healthData, refetch: refetchHealth } = useQuery({
    queryKey: ['debug-health'],
    queryFn: async () => {
      const response = await api.get('/health')
      return response.data
    },
    refetchInterval: 5000,
    retry: false
  })

  // Subscribe to logs
  useEffect(() => {
    const unsubscribe = logStore.subscribe(setLogs)
    setLogs(logStore.getLogs())
    return unsubscribe
  }, [])

  // Auto scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Initialize API logging
  useEffect(() => {
    createLoggedApi()
    logStore.addLog('info', 'System', 'Debug console initialized')
  }, [])

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter)

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-600" />
      case 'info':
        return <InformationCircleIcon className="w-4 h-4 text-blue-600" />
    }
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-800 bg-green-50'
      case 'error':
        return 'text-red-800 bg-red-50'
      case 'warning':
        return 'text-yellow-800 bg-yellow-50'
      case 'info':
        return 'text-blue-800 bg-blue-50'
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white w-full h-2/3 rounded-t-lg shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <BugAntIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Debug Console</h3>
            
            {/* Backend Status */}
            <div className="flex items-center space-x-2">
              <div className={clsx(
                'w-3 h-3 rounded-full',
                healthData?.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'
              )} />
              <span className="text-sm text-gray-600">
                Backend: {healthData?.status || 'Unknown'}
              </span>
              <button
                onClick={() => refetchHealth()}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <ArrowPathIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => logStore.clearLogs()}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
            >
              <TrashIcon className="w-4 h-4" />
              <span>Clear</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {(['all', 'error', 'warning', 'success', 'info'] as const).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={clsx(
                  'px-3 py-1 text-sm rounded-full transition-colors',
                  filter === level
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
                {level !== 'all' && (
                  <span className="ml-1">
                    ({logs.filter(log => log.level === level).length})
                  </span>
                )}
              </button>
            ))}
            
            <label className="flex items-center space-x-2 ml-8">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Auto-scroll</span>
            </label>
          </div>
        </div>

        {/* System Info */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Database:</span>
              <span className={clsx(
                'ml-2',
                healthData?.database === 'connected' ? 'text-green-600' : 'text-red-600'
              )}>
                {healthData?.database || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">AI Model:</span>
              <span className={clsx(
                'ml-2',
                healthData?.ai_model === 'loaded' ? 'text-green-600' : 'text-red-600'
              )}>
                {healthData?.ai_model || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Logs:</span>
              <span className="ml-2 text-gray-900">{logs.length}</span>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-auto p-4 space-y-2 font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No logs to display
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className={clsx(
                  'p-3 rounded-lg border',
                  getLevelColor(log.level)
                )}
              >
                <div className="flex items-start space-x-3">
                  {getLevelIcon(log.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-medium">[{log.category}]</span>
                      <span className="text-xs opacity-75">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <div className="font-medium mb-1">{log.message}</div>
                    {log.details && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs opacity-75 hover:opacity-100">
                          Show details
                        </summary>
                        <pre className="mt-2 text-xs bg-black bg-opacity-10 p-2 rounded overflow-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
    </div>
  )
} 