'use client'

import Link from 'next/link'
import { CodeBracketIcon, ServerIcon, KeyIcon, DocumentTextIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function APIReferencePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">API Reference</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete reference for RareSift's REST API endpoints, authentication, and response formats
          </p>
        </div>

        {/* Base URL & Authentication */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <ServerIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Base URL</h2>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-mono text-gray-800 dark:text-gray-200">
                  https://api.raresift.com/v1
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                All API requests should be made to this base URL with HTTPS.
              </p>
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <KeyIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Authentication</h2>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm font-mono text-gray-800 dark:text-gray-200">
                  Authorization: Bearer YOUR_API_KEY
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Include your API key in the Authorization header for all requests.
              </p>
            </div>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-8">
          
          {/* Health Check */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-semibold rounded-full">
                    GET
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">/health</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">No Auth Required</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Check the health status of the API service
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Example Request</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-800 dark:text-gray-200">
{`curl -X GET https://api.raresift.com/v1/health`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Response</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-800 dark:text-gray-200">
{`{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00Z",
  "database": "connected",
  "redis": "connected"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Endpoint */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-semibold rounded-full">
                    POST
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">/search</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <KeyIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auth Required</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Search for video frames using natural language queries or image similarity
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Request Parameters</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Parameter</th>
                          <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Type</th>
                          <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Required</th>
                          <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 dark:text-blue-400">query</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">string</td>
                          <td className="p-3 text-green-600 dark:text-green-400">Yes</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">Natural language description of the scenario</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 dark:text-blue-400">limit</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">integer</td>
                          <td className="p-3 text-orange-600 dark:text-orange-400">No</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">Maximum number of results (default: 10, max: 100)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 dark:text-blue-400">similarity_threshold</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">float</td>
                          <td className="p-3 text-orange-600 dark:text-orange-400">No</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">Minimum similarity score (0.0 - 1.0, default: 0.2)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 dark:text-blue-400">filters</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">object</td>
                          <td className="p-3 text-orange-600 dark:text-orange-400">No</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">Optional filters (time_of_day, weather, category)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Example Request</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-800 dark:text-gray-200">
{`curl -X POST https://api.raresift.com/v1/search \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "query": "cars merging onto highway",
    "limit": 10,
    "similarity_threshold": 0.7,
    "filters": {
      "time_of_day": "day",
      "weather": "sunny"
    }
  }'`}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Response</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-800 dark:text-gray-200">
{`{
  "results": [
    {
      "frame_id": 1234,
      "video_id": 56,
      "timestamp": 45.2,
      "similarity": 0.89,
      "frame_path": "/frames/video_56_frame_45.jpg",
      "frame_url": "https://cdn.raresift.com/frames/...",
      "metadata": {
        "weather": "sunny",
        "time_of_day": "day",
        "location": "highway"
      },
      "video_filename": "highway_drive_001.mp4",
      "video_duration": 300.5
    }
  ],
  "total_found": 1,
  "search_time_ms": 125
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Upload */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-semibold rounded-full">
                    POST
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">/videos/upload</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <KeyIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auth Required</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Upload a video file for processing and indexing
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Request Format</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Use multipart/form-data encoding for file uploads
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Field</th>
                          <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Type</th>
                          <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Required</th>
                          <th className="text-left p-3 font-semibold text-gray-900 dark:text-white">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        <tr>
                          <td className="p-3 font-mono text-blue-600 dark:text-blue-400">file</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">file</td>
                          <td className="p-3 text-green-600 dark:text-green-400">Yes</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">Video file (MP4, MOV, AVI)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-mono text-blue-600 dark:text-blue-400">metadata</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">JSON string</td>
                          <td className="p-3 text-orange-600 dark:text-orange-400">No</td>
                          <td className="p-3 text-gray-600 dark:text-gray-400">Video metadata as JSON</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Example Request</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-800 dark:text-gray-200">
{`curl -X POST https://api.raresift.com/v1/videos/upload \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -F "file=@/path/to/video.mp4" \\
  -F 'metadata={"weather":"sunny","time_of_day":"day","location":"highway"}'`}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Response</h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-800 dark:text-gray-200">
{`{
  "video_id": 123,
  "filename": "video.mp4",
  "size_bytes": 52428800,
  "duration_seconds": 300.5,
  "processing_status": "queued",
  "created_at": "2024-01-15T10:30:00Z",
  "estimated_processing_time": "2-5 minutes"
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Get Video */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-6 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm font-semibold rounded-full">
                    GET
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">/videos/{'{video_id}'}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <KeyIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Auth Required</span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                Get details about a specific video and its processing status
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Example Request</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-800 dark:text-gray-200">
{`curl -X GET https://api.raresift.com/v1/videos/123 \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
                    </pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Response</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                    <pre className="text-sm text-gray-800 dark:text-gray-200">
{`{
  "video_id": 123,
  "filename": "highway_drive.mp4",
  "size_bytes": 52428800,
  "duration_seconds": 300.5,
  "processing_status": "completed",
  "frames_extracted": 300,
  "embeddings_generated": 300,
  "created_at": "2024-01-15T10:30:00Z",
  "processed_at": "2024-01-15T10:35:00Z",
  "metadata": {
    "weather": "sunny",
    "time_of_day": "day",
    "location": "highway"
  }
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Codes */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">HTTP Status Codes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Success Codes</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="font-mono text-green-700 dark:text-green-300">200 OK</span>
                  <span className="text-gray-600 dark:text-gray-400">Request successful</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                  <span className="font-mono text-green-700 dark:text-green-300">201 Created</span>
                  <span className="text-gray-600 dark:text-gray-400">Resource created</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Error Codes</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="font-mono text-red-700 dark:text-red-300">400 Bad Request</span>
                  <span className="text-gray-600 dark:text-gray-400">Invalid request format</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="font-mono text-red-700 dark:text-red-300">401 Unauthorized</span>
                  <span className="text-gray-600 dark:text-gray-400">Invalid API key</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="font-mono text-red-700 dark:text-red-300">429 Too Many Requests</span>
                  <span className="text-gray-600 dark:text-gray-400">Rate limit exceeded</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <span className="font-mono text-red-700 dark:text-red-300">500 Server Error</span>
                  <span className="text-gray-600 dark:text-gray-400">Internal server error</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rate Limiting</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Free Tier</h3>
              <p className="text-gray-600 dark:text-gray-400">100 requests/hour</p>
              <p className="text-gray-600 dark:text-gray-400">10 video uploads/day</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Pro Tier</h3>
              <p className="text-gray-600 dark:text-gray-400">1,000 requests/hour</p>
              <p className="text-gray-600 dark:text-gray-400">100 video uploads/day</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enterprise</h3>
              <p className="text-gray-600 dark:text-gray-400">Custom limits</p>
              <p className="text-gray-600 dark:text-gray-400">Priority support</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/documentation" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Documentation
          </Link>
        </div>
      </div>
    </div>
  )
}