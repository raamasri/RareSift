'use client'

import { useState, useEffect } from 'react'
import { X, Cookie, Settings } from 'lucide-react'
import Link from 'next/link'

interface CookieConsentProps {
  onAccept?: () => void
  onDecline?: () => void
  onCustomize?: () => void
}

export default function CookieConsent({ onAccept, onDecline, onCustomize }: CookieConsentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setIsVisible(false)
    onAccept?.()
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setIsVisible(false)
    onDecline?.()
  }

  const handleCustomize = () => {
    onCustomize?.()
    setShowDetails(!showDetails)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="mx-auto max-w-4xl bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-700 shadow-lg rounded-lg">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Cookie Consent</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                We use cookies and similar technologies to enhance your experience, analyze usage, 
                and provide personalized content. By clicking "Accept All", you consent to our use of cookies.
              </p>

              {showDetails && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <h4 className="font-medium mb-3 text-gray-900 dark:text-white">Cookie Categories:</h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked disabled className="rounded" />
                        <span className="font-medium text-gray-900 dark:text-white">Essential Cookies</span>
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                        Required for basic site functionality and security. Cannot be disabled.
                      </p>
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="font-medium text-gray-900 dark:text-white">Analytics Cookies</span>
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                        Help us understand how you use our site to improve performance.
                      </p>
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" defaultChecked className="rounded" />
                        <span className="font-medium text-gray-900 dark:text-white">Functional Cookies</span>
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                        Enable enhanced functionality and personalization.
                      </p>
                    </div>
                    
                    <div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="font-medium text-gray-900 dark:text-white">Marketing Cookies</span>
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 ml-6">
                        Used to track visitors across websites for marketing purposes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                <button 
                  onClick={handleAccept} 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Accept All
                </button>
                
                <button 
                  onClick={handleDecline} 
                  className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Decline
                </button>
                
                <button 
                  onClick={handleCustomize}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                >
                  <Settings className="h-4 w-4" />
                  Customize
                </button>
                
                <Link href="/privacy" className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto">
                  Privacy Policy
                </Link>
              </div>
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to check cookie consent status
export function useCookieConsent() {
  const [consent, setConsent] = useState<string | null>(null)

  useEffect(() => {
    setConsent(localStorage.getItem('cookie-consent'))
  }, [])

  const updateConsent = (value: string) => {
    localStorage.setItem('cookie-consent', value)
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setConsent(value)
  }

  return {
    consent,
    hasConsented: consent === 'accepted',
    hasDeclined: consent === 'declined',
    updateConsent
  }
}