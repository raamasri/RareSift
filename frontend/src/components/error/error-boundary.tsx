'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })
    
    // You could send error to monitoring service here
    // trackError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      
      return (
        <FallbackComponent 
          error={this.state.error!} 
          reset={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. This has been reported to our team.
        </p>
        
        <details className="text-left mb-6">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            Show error details
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-32">
            {error.message}
          </div>
        </details>
        
        <div className="flex space-x-3">
          <button
            onClick={reset}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reload Page
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          If this problem persists, please contact our support team.
        </p>
      </div>
    </div>
  )
}

/**
 * Hook for handling async errors in components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])
  
  const captureError = React.useCallback((error: Error) => {
    console.error('Async error captured:', error)
    setError(error)
  }, [])
  
  const clearError = React.useCallback(() => {
    setError(null)
  }, [])
  
  return { captureError, clearError }
}

/**
 * Hook for handling network connectivity
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(true) // Default to online for SSR
  const [wasOffline, setWasOffline] = React.useState(false)
  const [isClient, setIsClient] = React.useState(false)
  
  React.useEffect(() => {
    // Set client-side flag and initial online status
    setIsClient(true)
    setIsOnline(navigator.onLine)
    
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        // Show reconnection message
        console.log('Connection restored')
      }
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])
  
  return { isOnline, wasOffline, isClient }
}

/**
 * Network status indicator component
 */
export function NetworkStatusIndicator() {
  const { isOnline, wasOffline, isClient } = useNetworkStatus()
  
  // Don't render anything during SSR to prevent hydration mismatch
  if (!isClient) {
    return null
  }
  
  if (isOnline && !wasOffline) {
    return null
  }
  
  return (
    <div className={`fixed top-0 left-0 right-0 z-50 p-3 text-center text-sm font-medium transition-colors ${
      isOnline 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`}>
      {isOnline 
        ? '✓ Connection restored' 
        : '⚠️ No internet connection - Some features may not work'
      }
    </div>
  )
}