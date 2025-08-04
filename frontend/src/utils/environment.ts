/**
 * Environment detection and configuration utilities
 * Provides unified deployment strategy across local, Vercel, and Render
 */

export interface DeploymentConfig {
  isProduction: boolean
  isVercel: boolean
  isRender: boolean
  isLocal: boolean
  backendUrl: string
  frontendUrl: string
  environment: 'development' | 'staging' | 'production'
}

/**
 * Detect current deployment environment
 */
export function detectEnvironment(): DeploymentConfig {
  // Server-side safe checks
  if (typeof window === 'undefined') {
    return {
      isProduction: false,
      isVercel: false,
      isRender: false,
      isLocal: true,
      backendUrl: 'http://localhost:8000',
      frontendUrl: 'http://localhost:3000',
      environment: 'development'
    }
  }

  const hostname = window.location.hostname
  const protocol = window.location.protocol
  const port = window.location.port

  // Vercel deployment detection
  const isVercel = hostname.includes('vercel.app') || hostname.includes('vercel.com')
  
  // Render deployment detection  
  const isRender = hostname.includes('render.com') || hostname.includes('onrender.com')
  
  // Local development detection
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0'
  
  // Production environment (anything not local)
  const isProduction = !isLocal

  // Backend URL configuration
  let backendUrl: string
  if (isVercel) {
    // Vercel: Backend deployed on Render
    backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://raresift-backend.onrender.com'
  } else if (isRender) {
    // Render: Both frontend and backend on Render
    backendUrl = process.env.NEXT_PUBLIC_API_URL || 'https://raresift-backend.onrender.com'
  } else if (isLocal) {
    // Local development
    backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  } else {
    // Custom domain or other hosting
    backendUrl = process.env.NEXT_PUBLIC_API_URL || `${protocol}//${hostname}:8000`
  }

  // Frontend URL
  const frontendUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`

  // Environment classification
  let environment: 'development' | 'staging' | 'production'
  if (isLocal) {
    environment = 'development'
  } else if (hostname.includes('staging') || hostname.includes('dev')) {
    environment = 'staging'
  } else {
    environment = 'production'
  }

  return {
    isProduction,
    isVercel,
    isRender,
    isLocal,
    backendUrl,
    frontendUrl,
    environment
  }
}

/**
 * Check if backend is available
 */
export async function checkBackendHealth(backendUrl: string, timeout = 3000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch (error) {
    console.warn('Backend health check failed:', error)
    return false
  }
}

/**
 * Get appropriate video source URL based on environment
 */
export function getVideoSourceUrl(videoId: number, config: DeploymentConfig): {
  primary: string
  fallback: string
  strategy: 'backend' | 'public' | 'hybrid' | 'github-lfs'
} {
  const videoMap: { [key: number]: { filename: string; folder: string } } = {
    1: { filename: 'GH010001.MP4', folder: 'driving_camera_footage' },
    2: { filename: 'GH010002.MP4', folder: 'driving_camera_footage' },
    3: { filename: 'GH010003.MP4', folder: 'driving_camera_footage' },
    4: { filename: 'GH010004.MP4', folder: 'driving_camera_footage' },
    5: { filename: 'GH010005.MP4', folder: 'driving_camera_footage' },
    6: { filename: 'GH010006.MP4', folder: 'driving_camera_footage' },
    7: { filename: 'GH010007.MP4', folder: 'driving_camera_footage' },
    8: { filename: 'GH010010.MP4', folder: 'driving_camera_footage' },
    9: { filename: 'GH020010.MP4', folder: 'driving_camera_footage' },
    15: { filename: 'GH010031.MP4', folder: 'static_camera_footage' },
    16: { filename: 'GH010032.MP4', folder: 'static_camera_footage' },
    17: { filename: 'GH010033.MP4', folder: 'static_camera_footage' },
    18: { filename: 'GH010034.MP4', folder: 'static_camera_footage' },
    19: { filename: 'GH010035.MP4', folder: 'static_camera_footage' },
    20: { filename: 'GH010036.MP4', folder: 'static_camera_footage' },
    21: { filename: 'GH010037.MP4', folder: 'static_camera_footage' },
    22: { filename: 'GH010038.MP4', folder: 'static_camera_footage' },
    23: { filename: 'GH010039.MP4', folder: 'static_camera_footage' },
    24: { filename: 'GH010041.MP4', folder: 'static_camera_footage' },
    25: { filename: 'GH010042.MP4', folder: 'static_camera_footage' },
    26: { filename: 'GH010043.MP4', folder: 'static_camera_footage' },
    27: { filename: 'GH010045.MP4', folder: 'static_camera_footage' }
  }

  const video = videoMap[videoId] || { filename: `VIDEO_${videoId}.MP4`, folder: 'driving_camera_footage' }
  const publicPath = `/videos/${video.folder}/${video.filename}`
  const backendPath = `${config.backendUrl}/api/v1/videos/${videoId}/stream`
  
  // GitHub LFS URL for production deployment
  const githubLfsPath = `https://github.com/raamasri/RareSift/raw/main/frontend/public/videos/${video.folder}/${video.filename}`

  if (config.isLocal) {
    // Local development: Public files preferred, backend as fallback if available
    return {
      primary: publicPath,
      fallback: backendPath,
      strategy: 'hybrid'
    }
  } else if (config.isProduction) {
    // Production: GitHub LFS preferred, public files as fallback for Vercel deployment
    return {
      primary: githubLfsPath,
      fallback: publicPath,
      strategy: 'github-lfs'
    }
  } else {
    // Staging: Public files only for reliability
    return {
      primary: publicPath,
      fallback: publicPath,
      strategy: 'public'
    }
  }
}

/**
 * Configure API base URL based on environment
 */
export function getApiBaseUrl(): string {
  const config = detectEnvironment()
  return config.backendUrl
}

/**
 * Check if authentication is required based on environment
 */
export function isAuthRequired(): boolean {
  const config = detectEnvironment()
  return config.isProduction
}

/**
 * Get deployment-specific feature flags
 */
export function getFeatureFlags() {
  const config = detectEnvironment()
  
  return {
    enableBackendAuth: config.isProduction,
    enableVideoStreaming: true,
    enableFileUploads: config.isProduction || config.isLocal,
    enableAnalytics: config.isProduction,
    enableDebugMode: config.isLocal,
    enableHealthChecks: true,
    maxVideoUploadSize: config.isLocal ? 100 * 1024 * 1024 : 500 * 1024 * 1024, // 100MB local, 500MB production
  }
}

// Export singleton config for easy access
export const deploymentConfig = detectEnvironment()