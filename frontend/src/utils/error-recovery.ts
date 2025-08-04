/**
 * Network error recovery utilities for production resilience
 */

interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
}

/**
 * Retry a network request with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, baseDelay, maxDelay, backoffFactor } = { ...defaultRetryConfig, ...config }
  
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      )
      const jitter = Math.random() * 0.1 * delay
      const totalDelay = delay + jitter
      
      console.log(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(totalDelay)}ms...`)
      
      await new Promise(resolve => setTimeout(resolve, totalDelay))
    }
  }
  
  throw lastError
}

/**
 * Enhanced fetch with automatic retry and timeout
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000)
  
  try {
    return await retryWithBackoff(async () => {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      return response
    }, retryConfig)
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorName = error.name?.toLowerCase() || ''
  
  return (
    errorName === 'networkerror' ||
    errorName === 'typeerror' ||
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('abort')
  )
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred'
  
  const errorMessage = error.message?.toLowerCase() || ''
  
  if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.'
  }
  
  if (isNetworkError(error)) {
    return 'Network connection problem. Please check your internet connection and try again.'
  }
  
  if (error.response?.status === 429) {
    return 'Too many requests. Please wait a moment and try again.'
  }
  
  if (error.response?.status >= 500) {
    return 'Server temporarily unavailable. Please try again in a few minutes.'
  }
  
  if (error.response?.status === 404) {
    return 'Service not found. Please contact support if this problem persists.'
  }
  
  if (error.response?.status >= 400 && error.response?.status < 500) {
    return error.response.data?.detail || 'Invalid request. Please check your input and try again.'
  }
  
  return error.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Connection health checker
 */
export class ConnectionHealthChecker {
  private isOnline = navigator.onLine
  private listeners: ((isOnline: boolean) => void)[] = []
  
  constructor() {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }
  
  private handleOnline() {
    this.isOnline = true
    this.notifyListeners()
  }
  
  private handleOffline() {
    this.isOnline = false
    this.notifyListeners()
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline))
  }
  
  public getStatus(): boolean {
    return this.isOnline
  }
  
  public onStatusChange(listener: (isOnline: boolean) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
  
  public async checkConnectivity(url: string = '/health'): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      })
      return response.ok
    } catch {
      return false
    }
  }
}

// Global connection health checker instance
export const connectionHealthChecker = new ConnectionHealthChecker()

/**
 * Higher-order component for automatic retry on network errors
 */
export function withNetworkRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  retryConfig?: Partial<RetryConfig>
) {
  return async (...args: T): Promise<R> => {
    return retryWithBackoff(() => fn(...args), retryConfig)
  }
}