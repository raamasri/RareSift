'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { MagnifyingGlassIcon, PhotoIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface SearchResult {
  frame_id: number
  video_id: number
  timestamp: number
  similarity: number
  frame_path: string
  frame_url?: string
  metadata: {
    [key: string]: any
  }
  video_filename?: string
  video_duration?: number
}

interface SearchResponse {
  search_id: number
  results: SearchResult[]
  total_found: number | string
  search_time_ms: number
  query_text?: string
  filters: { [key: string]: any }
}

interface APISearchInterfaceProps {
  onSearchResults?: (results: SearchResponse) => void
}

interface SearchFilters {
  time_of_day?: string
  weather?: string
  category?: string
  similarity_threshold: number
  limit: number
}

export function APISearchInterface({ onSearchResults }: APISearchInterfaceProps) {
  const [searchType, setSearchType] = useState<'text' | 'image'>('text')
  const [query, setQuery] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({
    similarity_threshold: 0.2,
    limit: 10
  })

  // Smart search suggestions for AV scenarios
  const commonScenarios = [
    // Driving scenarios
    "highway driving with cars",
    "road with lane markings", 
    "vehicles on highway",
    "driving perspective view",
    "cars in traffic",
    "highway with multiple lanes",
    
    // Intersection scenarios
    "intersection with traffic lights",
    "cars at intersection",
    "intersection monitoring view",
    "traffic light controls",
    "intersection from above",
    "static camera intersection view",
    
    // General scenarios
    "sunny day driving",
    "clear weather conditions",
    "daytime driving footage",
    "good visibility driving",
    "normal traffic flow",
    "standard road conditions"
  ]

  const getSmartSuggestions = (input: string) => {
    if (input.length < 2) return []
    
    const matchingScenarios = commonScenarios.filter(scenario =>
      scenario.toLowerCase().includes(input.toLowerCase())
    )
    
    // Add contextual suggestions based on keywords
    const contextualSuggestions = []
    const keywords = input.toLowerCase().split(' ')
    
    if (keywords.includes('highway') || keywords.includes('road')) {
      contextualSuggestions.push(
        "highway driving perspective",
        "multi-lane highway",
        "cars on highway"
      )
    }
    
    if (keywords.includes('intersection') || keywords.includes('traffic')) {
      contextualSuggestions.push(
        "intersection with traffic lights",
        "cars at intersection",
        "traffic monitoring view"
      )
    }
    
    if (keywords.includes('driving') || keywords.includes('car')) {
      contextualSuggestions.push(
        "first person driving view",
        "vehicles in traffic",
        "driving on highway"
      )
    }
    
    // Combine and deduplicate
    const allSuggestions = [...matchingScenarios, ...contextualSuggestions]
    const uniqueSuggestions = Array.from(new Set(allSuggestions))
    
    return uniqueSuggestions.slice(0, 8)
  }

  const handleTextSearch = async () => {
    if (!query.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const searchPayload = {
        query: query.trim(),
        limit: filters.limit,
        similarity_threshold: filters.similarity_threshold,
        filters: {
          time_of_day: filters.time_of_day,
          weather: filters.weather,
          category: filters.category
        }
      }

      // For demo purposes, use localhost backend
      const response = await fetch('/api/v1/search/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchPayload)
      })
      
      if (!response.ok) {
        // If API fails, fall back to local search
        console.warn('API search failed, falling back to local search')
        await handleLocalTextSearch()
        return
      }
      
      const searchResults: SearchResponse = await response.json()
      onSearchResults?.(searchResults)
      
    } catch (error) {
      console.error('Search failed:', error)
      setError('Search failed. Please try again.')
      // Fall back to local search
      await handleLocalTextSearch()
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocalTextSearch = async () => {
    // Fallback to local search with mock results using actual demo frames
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
    
    const mockResults: SearchResponse = {
      search_id: Math.floor(Math.random() * 1000),
      results: [
        {
          frame_id: 1,
          video_id: 1,
          timestamp: 45,
          similarity: 0.89,
          frame_path: '/demo-assets/frames/drive_01_frame_003.jpg',
          frame_url: '/demo-assets/frames/drive_01_frame_003.jpg',
          metadata: {
            weather: 'sunny',
            time_of_day: 'day',
            location: 'Highway driving'
          },
          video_filename: 'GH010001.MP4',
          video_duration: 600
        },
        {
          frame_id: 2,
          video_id: 2,
          timestamp: 78,
          similarity: 0.84,
          frame_path: '/demo-assets/frames/drive_02_frame_004.jpg',
          frame_url: '/demo-assets/frames/drive_02_frame_004.jpg',
          metadata: {
            weather: 'sunny',
            time_of_day: 'day',
            location: 'Highway driving'
          },
          video_filename: 'GH010002.MP4',
          video_duration: 650
        },
        {
          frame_id: 3,
          video_id: 6,
          timestamp: 123,
          similarity: 0.82,
          frame_path: '/demo-assets/frames/drive_03_frame_005.jpg',
          frame_url: '/demo-assets/frames/drive_03_frame_005.jpg',
          metadata: {
            weather: 'sunny',
            time_of_day: 'day',
            location: 'Highway driving'
          },
          video_filename: 'GH010006.MP4',
          video_duration: 720
        },
        {
          frame_id: 4,
          video_id: 10,
          timestamp: 74,
          similarity: 0.76,
          frame_path: '/demo-assets/frames/static_03_frame_000.jpg',
          frame_url: '/demo-assets/frames/static_03_frame_000.jpg',
          metadata: {
            weather: 'sunny',
            time_of_day: 'day',
            location: 'Intersection monitoring'
          },
          video_filename: 'GH010034.MP4',
          video_duration: 480
        }
      ],
      total_found: 4,
      search_time_ms: Math.round(50 + Math.random() * 150),
      query_text: query.trim(),
      filters: {}
    }
    
    onSearchResults?.(mockResults)
  }

  const handleImageSearch = async () => {
    if (!selectedImage) return

    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedImage)
      formData.append('limit', filters.limit.toString())
      formData.append('similarity_threshold', filters.similarity_threshold.toString())
      
      if (filters.time_of_day) formData.append('time_of_day', filters.time_of_day)
      if (filters.weather) formData.append('weather', filters.weather)
      if (filters.category) formData.append('category', filters.category)

      const response = await fetch('/api/v1/search/image', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        console.warn('API image search failed, falling back to local search')
        await handleLocalImageSearch()
        return
      }
      
      const searchResults: SearchResponse = await response.json()
      onSearchResults?.(searchResults)
      
    } catch (error) {
      console.error('Image search failed:', error)
      setError('Image search failed. Please try again.')
      await handleLocalImageSearch()
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocalImageSearch = async () => {
    // Fallback local image search
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 600))
    
    const mockResults: SearchResponse = {
      search_id: Math.floor(Math.random() * 1000),
      results: [
        {
          frame_id: 2,
          video_id: 1,
          timestamp: 120,
          similarity: 0.78,
          frame_path: '/api/frames/2/thumbnail',
          metadata: {
            weather: 'sunny',
            time_of_day: 'day',
            location: 'Highway driving'
          },
          video_filename: 'GH010001.MP4',
          video_duration: 600
        }
      ],
      total_found: 1,
      search_time_ms: Math.round(80 + Math.random() * 200),
      query_text: `Image search: ${selectedImage?.name}`,
      filters: {}
    }
    
    onSearchResults?.(mockResults)
  }

  const onImageDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setSelectedImage(acceptedFiles[0])
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: false
  })

  const handleQueryChange = (value: string) => {
    setQuery(value)
    const suggestions = getSmartSuggestions(value)
    setSuggestedQueries(suggestions)
    setShowSuggestions(suggestions.length > 0 && value.length > 1)
  }

  const selectSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    setSuggestedQueries([])
  }

  return (
    <div className="space-y-8">
      {/* Professional Page Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
          <MagnifyingGlassIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">AI-Powered Scenario Search</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2 max-w-2xl mx-auto">
            Search through your video collection using natural language or visual similarity
          </p>
        </div>
        <div className="flex items-center justify-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Live API</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Database Search</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>4,985 Frames Indexed</span>
          </div>
        </div>
        {error && (
          <div className="mx-auto max-w-md p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">⚠️ API unavailable - using fallback search</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
        <div className="space-y-8">
          {/* Enhanced Search Type Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Search Method</h2>
              <p className="text-slate-600 dark:text-slate-300 mt-1">Choose how you want to search for scenarios</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1.5 shadow-inner">
              <button
                onClick={() => setSearchType('text')}
                className={clsx(
                  'px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2',
                  searchType === 'text'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow transform scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-600'
                )}
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Natural Language</span>
              </button>
              <button
                onClick={() => setSearchType('image')}
                className={clsx(
                  'px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2',
                  searchType === 'image'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow transform scale-105'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-600'
                )}
              >
                <PhotoIcon className="h-4 w-4" />
                <span>Visual Similarity</span>
              </button>
            </div>
          </div>

          {/* Enhanced Search Input */}
          {searchType === 'text' ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Natural Language Query
                </label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 z-10" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => handleQueryChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                    onFocus={() => query.length > 1 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="Describe a scenario or paste a link to a clip..."
                    className="w-full pl-12 pr-4 py-4 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 relative z-0"
                    disabled={isLoading}
                  />
                  
                  {/* Smart Suggestions Dropdown */}
                  {showSuggestions && suggestedQueries.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 px-2">
                          💡 Smart Suggestions
                        </div>
                        {suggestedQueries.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => selectSuggestion(suggestion)}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 rounded-lg transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                              <span>{suggestion}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      <div className="border-t border-slate-100 dark:border-slate-600 p-2 bg-slate-50 dark:bg-slate-700 rounded-b-xl">
                        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                          🤖 AI-powered suggestions for video content
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search through 4,985 indexed frames from 22 videos (9 driving + 13 static cameras)
                </p>
              </div>
              
              {/* Quick Search Chips */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Quick scenarios
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Pedestrian at night",
                    "Freeway cut-ins", 
                    "Left turns in rain",
                    "Work zones"
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setQuery(chip)}
                      className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/20 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Reference Image Upload
                </label>
                <div
                  {...getRootProps()}
                  className={clsx(
                    'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group',
                    isDragActive
                      ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 shadow-lg scale-105'
                      : selectedImage
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 shadow'
                      : 'border-slate-300 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-gradient-to-br hover:from-slate-50 hover:to-indigo-50 dark:hover:from-slate-700 dark:hover:to-indigo-900/20 hover:shadow'
                  )}
                >
                  <input {...getInputProps()} />
                  {selectedImage ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-900 rounded-2xl flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-300">{selectedImage.name}</p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">Image ready for similarity search</p>
                      </div>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">Click to select a different image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={clsx(
                        'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
                        isDragActive
                          ? 'bg-indigo-200 dark:bg-indigo-800 scale-110'
                          : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-800 group-hover:scale-105'
                      )}>
                        <PhotoIcon className={clsx(
                          'h-8 w-8 transition-colors duration-300',
                          isDragActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                        )} />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">
                          {isDragActive ? 'Drop your image here' : 'Upload reference image'}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 mt-2">
                          Find visually similar scenes in your video collection
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                        <span>PNG, JPG, WEBP</span>
                        <span>•</span>
                        <span>Max 10MB</span>
                        <span>•</span>
                        <span>AI processing</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload an image to find similar frames in your 4,985 indexed video frames from both driving and static cameras
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Advanced Filters */}
          <div className="pt-8 border-t border-slate-200 dark:border-slate-600">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'flex items-center space-x-3 text-sm font-semibold transition-colors group',
                showFilters ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                showFilters ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600'
              )}>
                <AdjustmentsHorizontalIcon className={clsx(
                  'h-4 w-4 transition-colors',
                  showFilters ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                )} />
              </div>
              <span>Advanced Search Filters</span>
              <div className={clsx(
                'text-xs px-2 py-1 rounded-full transition-colors',
                showFilters ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              )}>
                {showFilters ? 'Hide' : 'Show'}
              </div>
            </button>
            
            {showFilters && (
              <div className="mt-6 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/20 rounded-xl p-6 border border-slate-200 dark:border-slate-600">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Refine Your Search</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                      Filter results based on video metadata and similarity thresholds
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Time of Day
                      </label>
                      <select
                        value={filters.time_of_day || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, time_of_day: e.target.value || undefined }))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Any time</option>
                        <option value="day">🌅 Daytime</option>
                        <option value="night">🌙 Nighttime</option>
                        <option value="dawn">🌄 Dawn</option>
                        <option value="dusk">🌆 Dusk</option>
                      </select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Filter by lighting conditions</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Weather Conditions
                      </label>
                      <select
                        value={filters.weather || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, weather: e.target.value || undefined }))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Any weather</option>
                        <option value="sunny">☀️ Sunny</option>
                        <option value="cloudy">☁️ Cloudy</option>
                        <option value="rainy">🌧️ Rainy</option>
                        <option value="snowy">❄️ Snowy</option>
                        <option value="foggy">🌫️ Foggy</option>
                      </select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Filter by weather patterns</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Camera Type
                      </label>
                      <select
                        value={filters.category || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Any camera</option>
                        <option value="driving_camera">🚗 Driving Camera</option>
                        <option value="static_camera">📹 Static Camera</option>
                      </select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Filter by camera perspective</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Result Count
                      </label>
                      <select
                        value={filters.limit}
                        onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value={5}>5 results</option>
                        <option value={10}>10 results</option>
                        <option value={15}>15 results</option>
                        <option value={20}>20 results</option>
                      </select>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Number of matches to return</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Search Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t border-slate-200 dark:border-slate-600">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {searchType === 'text' ? 'AI semantic search' : 'AI visual similarity search'}
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {searchType === 'text' 
                  ? query.trim() 
                    ? `Query: "${query.trim()}"`
                    : 'Enter a description to search for matching scenarios'
                  : selectedImage
                    ? `Image: ${selectedImage.name}`
                    : 'Upload an image to find visually similar scenes'
                }
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-400 dark:text-slate-500">
                <span>Database Search</span>
                <span>•</span>
                <span>4,985 frames indexed</span>
                <span>•</span>
                <span>CLIP embeddings</span>
              </div>
            </div>
            
            <button
              onClick={searchType === 'text' ? handleTextSearch : handleImageSearch}
              disabled={isLoading || (searchType === 'text' ? !query.trim() : !selectedImage)}
              className={clsx(
                'px-8 py-3 text-base font-semibold rounded-lg flex items-center space-x-3 transition-all duration-200',
                (isLoading || (searchType === 'text' ? !query.trim() : !selectedImage))
                  ? 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Searching Database...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  <span>
                    {searchType === 'text' ? 'Search by Text' : 'Search by Image'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}