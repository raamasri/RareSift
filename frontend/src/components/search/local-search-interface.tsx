'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { MagnifyingGlassIcon, PhotoIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'

// Import comprehensive sample of extracted frames
import { SAMPLE_SEARCH_DATABASE } from '../../frontend_sample_imports'

interface SearchResult {
  id: string
  frame_image: any
  confidence: number
  video_source: string
  timestamp: number
  metadata: {
    weather: string
    time_of_day: string
    location: string
    category: string
  }
}

interface LocalSearchInterfaceProps {
  onSearchResults?: (results: { results: SearchResult[], total_found: number, search_time_ms: number }) => void
}

interface SearchFilters {
  time_of_day?: string
  weather?: string
  category?: string
  similarity_threshold: number
  limit: number
}

// Use the comprehensive search database from extracted frames
const SEARCH_DATABASE = SAMPLE_SEARCH_DATABASE

export function LocalSearchInterface({ onSearchResults }: LocalSearchInterfaceProps) {
  const [searchType, setSearchType] = useState<'text' | 'image'>('text')
  const [query, setQuery] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  const simulateSearch = (searchQuery: string, imageFile?: File): SearchResult[] => {
    let results = [...SEARCH_DATABASE]
    
    // Apply text-based filtering
    if (searchQuery.toLowerCase().includes('highway') || searchQuery.toLowerCase().includes('driving')) {
      results = results.filter(r => r.metadata.category === 'driving_camera')
    } else if (searchQuery.toLowerCase().includes('intersection') || searchQuery.toLowerCase().includes('static')) {
      results = results.filter(r => r.metadata.category === 'static_camera')
    }
    
    // Apply metadata filters
    if (filters.time_of_day) {
      results = results.filter(r => r.metadata.time_of_day === filters.time_of_day)
    }
    if (filters.weather) {
      results = results.filter(r => r.metadata.weather === filters.weather)
    }
    if (filters.category) {
      results = results.filter(r => r.metadata.category === filters.category)
    }
    
    // Apply similarity threshold (mock by filtering confidence)
    const confidenceThreshold = (1 - filters.similarity_threshold) * 100
    results = results.filter(r => r.confidence >= confidenceThreshold)
    
    // Sort by confidence (simulated similarity score)
    results.sort((a, b) => b.confidence - a.confidence)
    
    // Apply limit
    results = results.slice(0, filters.limit)
    
    // Add some randomness to make it feel more realistic
    results = results.map(r => ({
      ...r,
      confidence: Math.max(70, r.confidence + (Math.random() - 0.5) * 10)
    }))
    
    return results
  }

  const handleTextSearch = async () => {
    if (!query.trim()) return
    
    setIsLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400))
    
    const results = simulateSearch(query.trim())
    
    const searchResults = {
      results,
      total_found: results.length,
      search_time_ms: Math.round(50 + Math.random() * 150)
    }
    
    onSearchResults?.(searchResults)
    setIsLoading(false)
  }

  const handleImageSearch = async () => {
    if (!selectedImage) return

    setIsLoading(true)
    
    // Simulate API delay for image processing
    await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 600))
    
    // For image search, return a mix of results with preference based on filename patterns
    const results = simulateSearch('', selectedImage)
    
    const searchResults = {
      results,
      total_found: results.length,
      search_time_ms: Math.round(80 + Math.random() * 200)
    }
    
    onSearchResults?.(searchResults)
    setIsLoading(false)
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
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Local Scenario Search</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2 max-w-2xl mx-auto">
            Search through your local video assets using AI-powered semantic matching
          </p>
        </div>
        <div className="flex items-center justify-center space-x-6 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>Demo Mode</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Local Assets</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>4,985 Frames Available</span>
          </div>
        </div>
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
                    placeholder="Describe the scenario... (e.g., 'highway driving', 'intersection view', 'cars in traffic')"
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
                          🤖 AI-powered suggestions for local video assets
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Search through 4,985 extracted frames from 22 videos (9 driving + 13 static cameras)
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Available Content</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="text-blue-700 dark:text-blue-400">"highway driving perspective"</div>
                    <div className="text-blue-700 dark:text-blue-400">"cars on multi-lane highway"</div>
                    <div className="text-blue-700 dark:text-blue-400">"vehicles in traffic"</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-blue-700 dark:text-blue-400">"intersection monitoring view"</div>
                    <div className="text-blue-700 dark:text-blue-400">"static camera intersection"</div>
                    <div className="text-blue-700 dark:text-blue-400">"traffic lights and cars"</div>
                  </div>
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
                          Find visually similar scenes in your local video collection
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                        <span>PNG, JPG, WEBP</span>
                        <span>•</span>
                        <span>Max 10MB</span>
                        <span>•</span>
                        <span>Local processing</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload an image to find similar frames in your 4,985 available video frames
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
                      Filter results based on the metadata from your local video collection
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
                  {searchType === 'text' ? 'Local semantic search' : 'Local visual similarity search'}
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
                <span>Demo Mode</span>
                <span>•</span>
                <span>4,985 frames available</span>
                <span>•</span>
                <span>Local processing</span>
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
                  <span>Searching Frames...</span>
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