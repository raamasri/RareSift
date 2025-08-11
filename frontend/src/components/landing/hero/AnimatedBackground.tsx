'use client'

import { useEffect, useState, useRef } from 'react'
import SplineManager from '@/lib/spline-manager'

export default function AnimatedBackground() {
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

      // Create hero Spline scene with a slight delay to ensure DOM is ready
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
        'hero',
        'https://prod.spline.design/LV81zVt0n3R5ztaC/scene.splinecode',
        containerRef.current,
        {
          opacity: 0.9,
          pointerEvents: true,
          zIndex: -1
        }
      )

      if (success) {
        // Poll for scene load status
        const checkLoaded = () => {
          if (splineManager.isSceneLoaded('hero')) {
            console.log('Hero Spline scene loaded successfully')
            setSplineLoaded(true)
          } else {
            setTimeout(checkLoaded, 100)
          }
        }
        setTimeout(checkLoaded, 500) // Give it a moment to start loading
      } else {
        console.warn('Failed to create hero Spline scene, using fallback')
        setUseSpline(false)
      }
      
    } catch (error) {
      console.warn('Hero Spline failed to load, using fallback background:', error)
      setUseSpline(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const splineManager = SplineManager.getInstance()
      splineManager.removeScene('hero')
    }
  }, [])

  if (!mounted) return null

  // Fallback animated background for mobile or when Spline fails
  const FallbackBackground = () => (
    <div className="absolute inset-0 -z-20 overflow-hidden">
      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
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
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-gradient-to-r from-indigo-400/10 to-purple-400/10 blur-3xl" />
        <div className="absolute top-3/4 right-1/4 h-96 w-96 rounded-full bg-gradient-to-r from-purple-400/10 to-pink-400/10 blur-3xl" />
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
    <div ref={containerRef} className="spline-background-container absolute inset-0 -z-20 overflow-hidden">
      {!useSpline || !splineLoaded ? <FallbackBackground /> : null}
      
      {/* Minimal overlay - just a subtle gradient to help with text contrast */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Very subtle left-side gradient for text area only */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
      </div>
    </div>
  )
}