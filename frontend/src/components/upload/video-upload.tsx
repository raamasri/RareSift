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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Upload AV Video</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload driving videos to analyze and search for scenarios. Supported formats: MP4, AVI, MOV, MKV, WEBM
            </p>
          </div>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={clsx(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : selectedFile
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            )}
          >
            <input {...getInputProps()} />
            
            {selectedFile ? (
              <div className="space-y-3">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">{selectedFile.name}</p>
                  <p className="text-xs text-green-600">{formatFileSize(selectedFile.size)}</p>
                </div>
                <p className="text-xs text-green-600">Click to change video</p>
              </div>
            ) : (
              <div className="space-y-3">
                <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">
                    {isDragActive ? 'Drop the video here' : 'Drag & drop a video here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Maximum file size: 1GB</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading...</span>
                <span className="text-gray-900 font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">
                  Video uploaded successfully! Processing will begin automatically.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <p className="text-sm font-medium text-red-900">
                  Upload failed: {uploadMutation.error?.message || 'Unknown error'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Metadata Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Video Metadata</h3>
            <p className="text-sm text-gray-600 mt-1">
              Provide additional context to improve search accuracy (optional)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weather Conditions
              </label>
              <select
                value={metadata.weather}
                onChange={(e) => setMetadata(prev => ({ ...prev, weather: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUploading}
              >
                <option value="">Select weather</option>
                <option value="sunny">Sunny</option>
                <option value="cloudy">Cloudy</option>
                <option value="rainy">Rainy</option>
                <option value="snowy">Snowy</option>
                <option value="foggy">Foggy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time of Day
              </label>
              <select
                value={metadata.time_of_day}
                onChange={(e) => setMetadata(prev => ({ ...prev, time_of_day: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUploading}
              >
                <option value="">Select time</option>
                <option value="day">Day</option>
                <option value="night">Night</option>
                <option value="dawn">Dawn</option>
                <option value="dusk">Dusk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={metadata.location}
                onChange={(e) => setMetadata(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., Highway 101, Downtown SF"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Speed (km/h)
              </label>
              <input
                type="number"
                value={metadata.speed_avg}
                onChange={(e) => setMetadata(prev => ({ ...prev, speed_avg: e.target.value }))}
                placeholder="e.g., 35"
                min="0"
                max="200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              {selectedFile ? (
                <span>Ready to upload: {selectedFile.name}</span>
              ) : (
                <span>Select a video file to begin</span>
              )}
            </div>
            
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="h-4 w-4" />
                  <span>Upload & Process</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Processing Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FilmIcon className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-900">About Video Processing</p>
            <p className="text-sm text-blue-700">
              After upload, your video will be automatically processed to:
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mt-2">
              <li>Extract frames every second for analysis</li>
              <li>Generate AI-powered embeddings using CLIP</li>
              <li>Detect basic conditions (lighting, weather hints)</li>
              <li>Make content searchable by natural language</li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              Processing typically takes 1-2 minutes per minute of video.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 