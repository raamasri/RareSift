'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  FilmIcon 
} from '@heroicons/react/24/outline'
import { videoApi } from '@/lib/api'
import clsx from 'clsx'
import { logStore } from '@/components/debug/debug-console'

interface UploadMetadata {
  weather: string
  time_of_day: string
  location: string
  speed_avg: string
}

export function VideoUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [metadata, setMetadata] = useState<UploadMetadata>({
    weather: '',
    time_of_day: '',
    location: '',
    speed_avg: ''
  })
  const [uploadProgress, setUploadProgress] = useState(0)

  const queryClient = useQueryClient()

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      logStore.addLog('info', 'Upload', 'Starting video upload', {
        filename: selectedFile?.name,
        size: selectedFile?.size
      })

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      try {
        const result = await videoApi.upload(formData)
        clearInterval(progressInterval)
        setUploadProgress(100)
        
        logStore.addLog('success', 'Upload', 'Video upload completed successfully', {
          videoId: result.id,
          filename: result.original_filename,
          duration: result.duration
        })
        
        return result
      } catch (error: any) {
        clearInterval(progressInterval)
        setUploadProgress(0)
        
        logStore.addLog('error', 'Upload', 'Video upload failed', {
          error: error.message,
          response: error.response?.data
        })
        
        throw error
      }
    },
    onSuccess: (data) => {
      logStore.addLog('info', 'Processing', 'Background processing started', {
        videoId: data.id
      })
      
      // Invalidate videos list to refresh
      queryClient.invalidateQueries({ queryKey: ['videos'] })
      // Reset form
      setSelectedFile(null)
      setMetadata({
        weather: '',
        time_of_day: '',
        location: '',
        speed_avg: ''
      })
      setTimeout(() => setUploadProgress(0), 2000)
    },
    onError: (error: any) => {
      logStore.addLog('error', 'Upload', 'Upload mutation failed', {
        error: error.message
      })
    }
  })

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setSelectedFile(acceptedFiles[0])
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.webm']
    },
    multiple: false,
    maxSize: 1024 * 1024 * 1024 // 1GB
  })

  const handleUpload = () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('file', selectedFile)
    
    if (metadata.weather) formData.append('weather', metadata.weather)
    if (metadata.time_of_day) formData.append('time_of_day', metadata.time_of_day)
    if (metadata.location) formData.append('location', metadata.location)
    if (metadata.speed_avg) formData.append('speed_avg', metadata.speed_avg)

    uploadMutation.mutate(formData)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isUploading = uploadMutation.isPending
  const uploadSuccess = uploadMutation.isSuccess && uploadProgress === 100

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rs-gradient-primary rounded-2xl flex items-center justify-center rs-shadow-lg animate-float">
          <CloudArrowUpIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Data Ingestion Portal</h1>
          <p className="text-lg text-slate-600 dark:text-gray-200 mt-2 max-w-2xl mx-auto">
            Upload autonomous vehicle footage for AI-powered analysis and scenario detection
          </p>
        </div>
        <div className="flex items-center justify-center space-x-6 text-sm text-slate-500 dark:text-gray-300">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Real-time processing</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Enterprise security</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>CLIP AI analysis</span>
          </div>
        </div>
      </div>

      <div className="rs-card p-8">
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Video Upload</h2>
            <p className="text-slate-600 dark:text-gray-200 mt-2">
              Support for all major video formats with intelligent preprocessing
            </p>
          </div>

          {/* Professional File Drop Zone */}
          <div
            {...getRootProps()}
            className={clsx(
              'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group',
              isDragActive
                ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 rs-shadow-lg scale-105'
                : selectedFile
                ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 rs-shadow'
                : 'border-slate-300 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-slate-50 hover:to-indigo-50 hover:rs-shadow'
            )}
          >
            <input {...getInputProps()} />
            
            {selectedFile ? (
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-emerald-900">{selectedFile.name}</p>
                  <p className="text-sm text-emerald-600 mt-1">{formatFileSize(selectedFile.size)}</p>
                </div>
                <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
                  <FilmIcon className="h-4 w-4" />
                  <span>Video ready for processing</span>
                </div>
                <p className="text-sm text-emerald-600">Click to select a different video</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={clsx(
                  'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
                  isDragActive
                    ? 'bg-indigo-200 scale-110'
                    : 'bg-slate-100 group-hover:bg-indigo-100 group-hover:scale-105'
                )}>
                  <CloudArrowUpIcon className={clsx(
                    'h-8 w-8 transition-colors duration-300',
                    isDragActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'
                  )} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {isDragActive ? 'Drop your video here' : 'Upload your AV footage'}
                  </p>
                  <p className="text-slate-600 dark:text-gray-300 mt-2">
                    Drag and drop your video file, or click to browse
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-4 text-sm text-slate-500 dark:text-gray-400">
                  <span>MP4, AVI, MOV, MKV, WEBM</span>
                  <span>•</span>
                  <span>Max 1GB</span>
                  <span>•</span>
                  <span>Secure processing</span>
                </div>
              </div>
            )}

            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg opacity-50"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg opacity-30"></div>
          </div>

          {/* Professional Upload Progress */}
          {isUploading && (
            <div className="rs-card p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <div className="animate-spin h-4 w-4 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">Processing Upload</p>
                      <p className="text-sm text-slate-600 dark:text-gray-300">Preparing your video for AI analysis</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-600">{uploadProgress}%</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Complete</p>
                  </div>
                </div>
                <div className="relative">
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-gray-300">
                  <span>Extracting frames and generating embeddings...</span>
                  <span>ETA: {Math.max(1, Math.ceil((100 - uploadProgress) / 10))}m</span>
                </div>
              </div>
            </div>
          )}

          {/* Professional Success Message */}
          {uploadSuccess && (
            <div className="rs-card p-6 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-900">Upload Successful!</h4>
                  <p className="text-sm text-emerald-700 mt-1">
                    Your video has been uploaded and is now being processed by our AI pipeline. 
                    You can start searching as soon as processing completes.
                  </p>
                </div>
                <div className="rs-status-success">
                  Processing Started
                </div>
              </div>
            </div>
          )}

          {/* Professional Error Message */}
          {uploadMutation.isError && (
            <div className="rs-card p-6 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900">Upload Failed</h4>
                  <p className="text-sm text-red-700 mt-1">
                    {uploadMutation.error?.message || 'An unexpected error occurred during upload. Please try again.'}
                  </p>
                </div>
                <button className="rs-btn-secondary text-red-600 border-red-200 hover:bg-red-50">
                  Retry Upload
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Metadata Form */}
      <div className="rs-card p-8">
        <div className="space-y-8">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-slate-100 to-indigo-100 rounded-xl flex items-center justify-center mb-4">
              <FilmIcon className="h-6 w-6 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Video Metadata</h3>
            <p className="text-slate-600 dark:text-gray-300 mt-2 max-w-md mx-auto">
              Enrich your upload with contextual information to improve AI search accuracy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200">
                Weather Conditions
              </label>
              <select
                value={metadata.weather}
                onChange={(e) => setMetadata(prev => ({ ...prev, weather: e.target.value }))}
                className="rs-input"
                disabled={isUploading}
              >
                <option value="">Select weather conditions</option>
                <option value="sunny">☀️ Sunny & Clear</option>
                <option value="cloudy">☁️ Cloudy & Overcast</option>
                <option value="rainy">🌧️ Rainy & Wet</option>
                <option value="snowy">❄️ Snowy & Icy</option>
                <option value="foggy">🌫️ Foggy & Low Visibility</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-gray-400">Helps identify weather-specific driving scenarios</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200">
                Time of Day
              </label>
              <select
                value={metadata.time_of_day}
                onChange={(e) => setMetadata(prev => ({ ...prev, time_of_day: e.target.value }))}
                className="rs-input"
                disabled={isUploading}
              >
                <option value="">Select time period</option>
                <option value="day">🌅 Daytime</option>
                <option value="night">🌙 Nighttime</option>
                <option value="dawn">🌄 Dawn & Early Morning</option>
                <option value="dusk">🌆 Dusk & Evening</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-gray-400">Enhances lighting condition detection</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200">
                Location Context
              </label>
              <input
                type="text"
                value={metadata.location}
                onChange={(e) => setMetadata(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Highway 101, Downtown SF, Residential Area"
                className="rs-input"
                disabled={isUploading}
              />
              <p className="text-xs text-slate-500 dark:text-gray-400">Specify road type, city, or landmark</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200">
                Average Speed (km/h)
              </label>
              <input
                type="number"
                value={metadata.speed_avg}
                onChange={(e) => setMetadata(prev => ({ ...prev, speed_avg: e.target.value }))}
                placeholder="e.g., 35"
                min="0"
                max="200"
                className="rs-input"
                disabled={isUploading}
              />
              <p className="text-xs text-slate-500 dark:text-gray-400">Typical driving speed during recording</p>
            </div>
          </div>

          {/* Enhanced Upload Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                {selectedFile ? (
                  <>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium text-slate-700 dark:text-gray-200">Ready to upload:</span>
                    <span className="text-slate-600 dark:text-gray-300">{selectedFile.name}</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                    <span className="text-slate-500 dark:text-gray-400">Select a video file to begin processing</span>
                  </>
                )}
              </div>
              {selectedFile && (
                <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-gray-400">
                  <span>Size: {formatFileSize(selectedFile.size)}</span>
                  <span>•</span>
                  <span>Format: {selectedFile.name.split('.').pop()?.toUpperCase()}</span>
                  <span>•</span>
                  <span>Est. processing: {Math.ceil(selectedFile.size / (1024 * 1024) * 0.5)}min</span>
                </div>
              )}
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={clsx(
                'rs-btn-primary px-8 py-3 text-base font-semibold flex items-center space-x-3',
                !selectedFile || isUploading ? 'opacity-50 cursor-not-allowed' : ''
              )}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Processing Upload...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-5 w-5" />
                  <span>Upload & Process Video</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Processing Info */}
      <div className="rs-card p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <FilmIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="space-y-3 flex-1">
            <div>
              <h4 className="text-base font-bold text-indigo-900">AI Processing Pipeline</h4>
              <p className="text-sm text-indigo-700 mt-1">
                Your video undergoes advanced AI analysis for intelligent scenario detection
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                  <span className="text-sm font-medium text-indigo-800">Frame Extraction</span>
                </div>
                <p className="text-xs text-indigo-600 ml-4">1-second intervals for comprehensive coverage</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm font-medium text-indigo-800">CLIP Embeddings</span>
                </div>
                <p className="text-xs text-indigo-600 ml-4">1536-dimensional vectors for semantic search</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-sm font-medium text-indigo-800">Scene Analysis</span>
                </div>
                <p className="text-xs text-indigo-600 ml-4">Lighting, weather, and context detection</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full"></div>
                  <span className="text-sm font-medium text-indigo-800">Search Indexing</span>
                </div>
                <p className="text-xs text-indigo-600 ml-4">Natural language query optimization</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-indigo-200">
              <div className="text-xs text-indigo-600">
                Typical processing time: <span className="font-semibold">1-2 minutes per video minute</span>
              </div>
              <div className="rs-status-processing text-xs">
                GPU Accelerated
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 