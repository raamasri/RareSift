'use client'

import { useEffect, useState } from 'react'

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)
  const [splineLoaded, setSplineLoaded] = useState(false)
  const [useSpline, setUseSpline] = useState(true)

  useEffect(() => {
    setMounted(true)
    
    // Check if device can handle Spline (disable on mobile for performance)
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      if (isMobile) {
        setUseSpline(false)
      } else {
        // Load Spline viewer script and create viewer
        loadSplineViewer()
      }
    }
  }, [])

  const loadSplineViewer = async () => {
    try {
      // Load Spline viewer script
      const script = document.createElement('script')
      script.type = 'module'
      script.src = 'https://unpkg.com/@splinetool/viewer@1.10.38/build/spline-viewer.js'
      document.head.appendChild(script)
      
      script.onload = () => {
        // Create spline-viewer element
        const splineViewer = document.createElement('spline-viewer')
        splineViewer.setAttribute('url', 'https://prod.spline.design/LV81zVt0n3R5ztaC/scene.splinecode')
        splineViewer.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.9;
          pointer-events: auto;
          z-index: -1;
        `
        
        splineViewer.addEventListener('load', () => {
          console.log('Spline viewer loaded successfully')
          setSplineLoaded(true)
        })
        
        splineViewer.addEventListener('error', () => {
          console.warn('Spline viewer failed to load, using fallback background')
          setUseSpline(false)
        })
        
        const backgroundElement = document.querySelector('.spline-background-container')
        if (backgroundElement) {
          backgroundElement.appendChild(splineViewer)
        }
      }
      
      script.onerror = () => {
        console.warn('Spline viewer script failed to load, using fallback background')
        setUseSpline(false)
      }
      
    } catch (error) {
      console.warn('Spline failed to load, using fallback background:', error)
      setUseSpline(false)
    }
  }

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
    <div className="spline-background-container absolute inset-0 -z-20 overflow-hidden">
      {!useSpline || !splineLoaded ? <FallbackBackground /> : null}
      
      {/* Minimal overlay - just a subtle gradient to help with text contrast */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Very subtle left-side gradient for text area only */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />
      </div>
    </div>
  )
}