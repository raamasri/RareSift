'use client'

import { useEffect, useState, useRef } from 'react'
import SplineManager from '@/lib/spline-manager'

export default function DemoSplineBackground() {
  const [mounted, setMounted] = useState(false)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [useSpline, setUseSpline] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && typeof window !== 'undefined' && containerRef.current) {
      const splineManager = SplineManager.getInstance()
      
      // Check if device can handle Spline
      const canUseSpline = splineManager.canUseSplineForDevice()
      
      if (!canUseSpline) {
        setUseSpline(false)
        return
      }

      // Create demo Spline scene with a slight delay to ensure DOM is ready
      const timer = setTimeout(() => {
        loadSplineScene(splineManager)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [mounted])

  const loadSplineScene = async (splineManager: any) => {
    if (!containerRef.current) return

    try {
      const success = await splineManager.createScene(
        'demo',
        'https://prod.spline.design/1rhGKOSq6D84mt41/scene.splinecode',
        containerRef.current,
        {
          opacity: 0.7,
          pointerEvents: false,
          zIndex: -1
        }
      )

      if (success) {
        // Poll for scene load status
        let pollCount = 0
        const checkLoaded = () => {
          pollCount++
          const isLoaded = splineManager.isSceneLoaded('demo')
          
          if (isLoaded) {
            setSplineLoaded(true)
          } else if (pollCount < 50) { // Max 5 seconds of polling
            setTimeout(checkLoaded, 100)
          } else {
            setUseSpline(false)
          }
        }
        setTimeout(checkLoaded, 500) // Give it a moment to start loading
      } else {
        setUseSpline(false)
      }
      
    } catch (error) {
      console.warn('Demo Spline failed to load:', error)
      setUseSpline(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const splineManager = SplineManager.getInstance()
      splineManager.removeScene('demo')
    }
  }, [])

  if (!mounted) return null

  // Fallback animated background for mobile or when Spline fails
  const FallbackBackground = () => (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-indigo-500/20 dark:bg-indigo-400/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="animate-pulse">
        <div className="absolute top-1/3 left-1/3 h-64 w-64 rounded-full bg-gradient-to-r from-indigo-400/10 to-purple-400/10 blur-3xl" />
        <div className="absolute top-2/3 right-1/3 h-80 w-80 rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 blur-3xl" />
      </div>

      <style jsx>{`
        .absolute.h-1.w-1 {
          animation: float linear infinite;
        }
        
        @keyframes float {
          0% {
            transform: translateY(100vh) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )

  return (
    <div ref={containerRef} className="demo-spline-background-container absolute inset-0 -z-20 overflow-hidden">
      {!useSpline || !splineLoaded ? <FallbackBackground /> : null}
      
      {/* Overlay for better text contrast */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/20 to-white/40 dark:from-gray-900/40 dark:via-gray-900/20 dark:to-gray-900/40" />
      </div>
    </div>
  )
}