'use client'

import Link from 'next/link'
import { CodeBracketIcon, DocumentTextIcon, PlayIcon, CubeIcon, CommandLineIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Documentation</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Complete guide to integrating and using RareSift AI-powered video search platform
          </p>
        </div>

        {/* Quick Start Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <PlayIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Start</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Get started with RareSift in minutes. Upload your first video and start searching driving scenarios.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">1</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Create Account</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sign up and get access to the platform</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">2</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Upload Videos</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Drag and drop your driving footage</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">3</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Start Searching</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Use natural language to find scenarios</p>
            </div>
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Getting Started */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Getting Started</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Platform Overview</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  RareSift uses OpenCLIP embeddings to enable semantic search of driving scenarios. 
                  Upload videos, and our AI automatically extracts frames and generates searchable embeddings.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Support for MP4, MOV, AVI video formats</li>
                  <li>Frame extraction at 1 frame per second</li>
                  <li>1536-dimensional CLIP embeddings</li>
                  <li>Natural language and image-based search</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Video Upload Process</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Drag and drop videos or click to browse</li>
                  <li>Add metadata (optional): weather, time of day, location</li>
                  <li>Click upload - processing starts automatically</li>
                  <li>Monitor processing status in dashboard</li>
                  <li>Search becomes available once processing completes</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Search Features */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CubeIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Search Features</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Natural Language Search</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Describe scenarios in plain English. Our AI understands context and finds matching frames.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                  <div className="text-gray-900 dark:text-white font-mono">&quot;cars merging onto highway&quot;</div>
                  <div className="text-gray-900 dark:text-white font-mono">&quot;intersection with traffic lights&quot;</div>
                  <div className="text-gray-900 dark:text-white font-mono">&quot;pedestrian crossing street&quot;</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Visual Similarity Search</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Upload a reference image to find visually similar scenes across your video collection.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Supports PNG, JPG, WEBP formats</li>
                  <li>Maximum file size: 10MB</li>
                  <li>AI-powered visual similarity matching</li>
                  <li>Configurable similarity thresholds</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Integration */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CodeBracketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Integration</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">REST API Endpoints</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Integrate RareSift into your existing workflows with our comprehensive REST API.
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm font-mono space-y-1">
                  <div className="text-green-600 dark:text-green-400">POST /api/v1/videos/upload</div>
                  <div className="text-blue-600 dark:text-blue-400">POST /api/v1/search</div>
                  <div className="text-purple-600 dark:text-purple-400">GET /api/v1/videos/{'{id}'}</div>
                  <div className="text-orange-600 dark:text-orange-400">GET /api/v1/health</div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Authentication</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Use API keys for secure access to all endpoints:
                </p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm font-mono">
                  <div className="text-gray-600 dark:text-gray-300">Authorization: Bearer YOUR_API_KEY</div>
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CommandLineIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Advanced Features</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Batch Processing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Process multiple videos simultaneously and export results in various formats.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>ZIP exports with frames and metadata</li>
                  <li>JSON manifests with timestamps</li>
                  <li>CSV exports for analysis</li>
                  <li>Custom filtering and sorting</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Performance Optimization</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Redis caching for faster search results</li>
                  <li>PostgreSQL with pgvector for similarity search</li>
                  <li>Background processing for large uploads</li>
                  <li>GPU acceleration when available</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <ClipboardDocumentListIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Code Examples</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Search Request (Python)</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200">
{`import requests

url = "https://api.raresift.com/v1/search"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

payload = {
    "query": "cars merging onto highway",
    "limit": 10,
    "similarity_threshold": 0.7
}

response = requests.post(url, json=payload, headers=headers)
results = response.json()

for result in results["results"]:
    print(f"Frame {result['frame_id']} - Similarity: {result['similarity']:.2f}")
    print(f"Video: {result['video_filename']}")
    print(f"Timestamp: {result['timestamp']}s")
    print("---")`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Video Upload (JavaScript)</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-800 dark:text-gray-200">
{`const uploadVideo = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify({
    weather: 'sunny',
    time_of_day: 'day',
    location: 'highway'
  }));

  const response = await fetch('/api/v1/videos/upload', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`
    },
    body: formData
  });

  const result = await response.json();
  console.log('Upload successful:', result.video_id);
  
  // Monitor processing status
  const checkStatus = setInterval(async () => {
    const status = await fetch(\`/api/v1/videos/\${result.video_id}\`);
    const video = await status.json();
    
    if (video.processing_status === 'completed') {
      clearInterval(checkStatus);
      console.log('Processing complete!');
    }
  }, 5000);
};`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Help & Support */}
        <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/api-reference" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📚 API Reference</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Complete API documentation with examples</p>
            </Link>
            <a href="mailto:support@raresift.com" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">💬 Contact Support</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get help from our technical team</p>
            </a>
            <Link href="/demo" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🚀 Try Demo</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Explore with sample driving footage</p>
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}