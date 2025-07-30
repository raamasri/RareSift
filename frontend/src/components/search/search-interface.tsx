'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { MagnifyingGlassIcon, PhotoIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery } from '@tanstack/react-query'
import { searchApi } from '@/lib/api'
import clsx from 'clsx'
import { logStore } from '@/components/debug/debug-console'

interface SearchInterfaceProps {
  onSearchResults?: (results: any) => void
}

interface SearchFilters {
  time_of_day?: string
  weather?: string
  speed_min?: number
  speed_max?: number
  similarity_threshold: number
  limit: number
}

export function SearchInterface({ onSearchResults }: SearchInterfaceProps) {
  const [searchType, setSearchType] = useState<'text' | 'image'>('text')
  const [query, setQuery] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    similarity_threshold: 0.2,
    limit: 10
  })

  // Smart search suggestions for AV scenarios
  const commonScenarios = [
    // Pedestrian scenarios
    "pedestrian crossing at night",
    "child running into street",
    "pedestrian with stroller",
    "elderly person crossing slowly",
    "pedestrian on phone distracted",
    "group of pedestrians jaywalking",
    
    // Vehicle interactions
    "aggressive lane change without signal",
    "vehicle cutting in close",
    "truck making wide turn",
    "emergency vehicle approaching",
    "motorcycle lane splitting",
    "vehicle running red light",
    
    // Weather conditions
    "heavy rain low visibility",
    "driving in snow storm",
    "fog reducing visibility",
    "sun glare blocking view",
    "ice on road surface",
    "hail storm conditions",
    
    // Construction and obstacles
    "construction zone with cones",
    "road work with lane shifts",
    "fallen tree blocking road",
    "pothole in driving lane",
    "debris on highway",
    "bridge construction barriers",
    
    // Traffic scenarios
    "traffic jam stop and go",
    "highway merge conflict",
    "roundabout navigation",
    "school bus with flashing lights",
    "double parked vehicle",
    "vehicle backing out of driveway",
    
    // Edge cases
    "animal crossing road at night",
    "cyclist in vehicle blind spot",
    "rollover accident scene",
    "vehicle stalled in traffic",
    "emergency responder on scene",
    "street festival with crowds"
  ]

  const getSmartSuggestions = (input: string) => {
    if (input.length < 2) return []
    
    const matchingScenarios = commonScenarios.filter(scenario =>
      scenario.toLowerCase().includes(input.toLowerCase())
    )
    
    // Also add contextual suggestions based on keywords
    const contextualSuggestions = []
    const keywords = input.toLowerCase().split(' ')
    
    if (keywords.includes('pedestrian') || keywords.includes('person')) {
      contextualSuggestions.push(
        "pedestrian near intersection",
        "pedestrian in crosswalk",
        "person with shopping cart"
      )
    }
    
    if (keywords.includes('night') || keywords.includes('dark')) {
      contextualSuggestions.push(
        "night driving with headlights",
        "street lights illuminated",
        "dark road no lighting"
      )
    }
    
    if (keywords.includes('rain') || keywords.includes('wet')) {
      contextualSuggestions.push(
        "wet road surface reflection",
        "windshield wipers active",
        "standing water on road"
      )
    }
    
    if (keywords.includes('construction')) {
      contextualSuggestions.push(
        "construction workers visible",
        "orange traffic cones",
        "lane closure signs"
      )
    }
    
    // Combine and deduplicate
    const allSuggestions = [...matchingScenarios, ...contextualSuggestions]
    const uniqueSuggestions = [...new Set(allSuggestions)]
    
    return uniqueSuggestions.slice(0, 8) // Limit to 8 suggestions
  }

  // Get filter suggestions
  const { data: filterSuggestions } = useQuery({
    queryKey: ['filter-suggestions'],
    queryFn: searchApi.getFilterSuggestions
  })

  // Text search mutation
  const textSearchMutation = useMutation({
    mutationFn: searchApi.searchByText,
    onMutate: (variables) => {
      logStore.addLog('info', 'Search', `Starting text search: "${variables.query}"`, {
        query: variables.query,
        filters: variables.filters,
        limit: variables.limit
      })
    },
    onSuccess: (data, variables) => {
      logStore.addLog('success', 'Search', `Text search completed - found ${data.total_found} results`, {
        query: variables.query,
        totalFound: data.total_found,
        searchTime: data.search_time_ms,
        resultCount: data.results.length
      })
      onSearchResults?.(data)
    },
    onError: (error: any, variables) => {
      logStore.addLog('error', 'Search', `Text search failed: ${error.message}`, {
        query: variables.query,
        error: error.message,
        response: error.response?.data
      })
    }
  })

  // Image search mutation
  const imageSearchMutation = useMutation({
    mutationFn: searchApi.searchByImage,
    onMutate: (variables) => {
      logStore.addLog('info', 'Search', 'Starting image search', {
        hasFile: !!variables.get('file'),
        filters: Object.fromEntries(variables.entries())
      })
    },
    onSuccess: (data) => {
      logStore.addLog('success', 'Search', `Image search completed - found ${data.total_found} results`, {
        totalFound: data.total_found,
        searchTime: data.search_time_ms,
        resultCount: data.results.length
      })
      onSearchResults?.(data)
    },
    onError: (error: any) => {
      logStore.addLog('error', 'Search', `Image search failed: ${error.message}`, {
        error: error.message,
        response: error.response?.data
      })
    }
  })

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

  const handleTextSearch = () => {
    if (!query.trim()) return
    
    textSearchMutation.mutate({
      query: query.trim(),
      limit: filters.limit,
      similarity_threshold: filters.similarity_threshold,
      filters: {
        time_of_day: filters.time_of_day,
        weather: filters.weather,
        speed_min: filters.speed_min,
        speed_max: filters.speed_max
      }
    })
  }

  const handleImageSearch = () => {
    if (!selectedImage) return

    const formData = new FormData()
    formData.append('file', selectedImage)
    formData.append('limit', filters.limit.toString())
    formData.append('similarity_threshold', filters.similarity_threshold.toString())
    
    if (filters.time_of_day) formData.append('time_of_day', filters.time_of_day)
    if (filters.weather) formData.append('weather', filters.weather)
    if (filters.speed_min) formData.append('speed_min', filters.speed_min.toString())
    if (filters.speed_max) formData.append('speed_max', filters.speed_max.toString())

    imageSearchMutation.mutate(formData)
  }

  const isLoading = textSearchMutation.isPending || imageSearchMutation.isPending

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
        <div className="mx-auto w-16 h-16 rs-gradient-primary rounded-2xl flex items-center justify-center rs-shadow-lg animate-float">
          <MagnifyingGlassIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Scenario Discovery Engine</h1>
          <p className="text-lg text-slate-600 mt-2 max-w-2xl mx-auto">
            Find specific driving scenarios using natural language or visual similarity search
          </p>
        </div>
        <div className="flex items-center justify-center space-x-6 text-sm text-slate-500">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>CLIP-powered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Semantic search</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Visual similarity</span>
          </div>
        </div>
      </div>

      <div className="rs-card p-8">
        <div className="space-y-8">
          {/* Enhanced Search Type Toggle */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Search Method</h2>
              <p className="text-slate-600 mt-1">Choose how you want to search for scenarios</p>
            </div>
            <div className="flex bg-slate-100 rounded-xl p-1.5 rs-shadow-inner">
              <button
                onClick={() => setSearchType('text')}
                className={clsx(
                  'px-6 py-3 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center space-x-2',
                  searchType === 'text'
                    ? 'bg-white text-slate-900 rs-shadow transform scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                    ? 'bg-white text-slate-900 rs-shadow transform scale-105'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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
                <label className="block text-sm font-semibold text-slate-700">
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
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow clicking suggestions
                    placeholder="Describe the scenario... (e.g., 'pedestrian crossing at night', 'car turning left in rain')"
                    className="rs-input pl-12 pr-4 py-4 text-base relative z-0"
                    disabled={isLoading}
                  />
                  
                  {/* Smart Suggestions Dropdown */}
                  {showSuggestions && suggestedQueries.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                          💡 Smart Suggestions
                        </div>
                        {suggestedQueries.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => selectSuggestion(suggestion)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-colors"
                          >
                            <div className="flex items-center space-x-2">
                              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                              <span>{suggestion}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      <div className="border-t border-gray-100 p-2 bg-gray-50 rounded-b-xl">
                        <div className="text-xs text-gray-500 text-center">
                          🤖 AI-powered suggestions based on common AV scenarios
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Use natural language to describe what you're looking for in the driving footage
                </p>
              </div>
              
              <div className="rs-card p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Query Examples</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="text-blue-700">"pedestrian near intersection at night"</div>
                    <div className="text-blue-700">"highway merge in heavy rain"</div>
                    <div className="text-blue-700">"cyclist in dedicated bike lane"</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-blue-700">"emergency vehicle with flashing lights"</div>
                    <div className="text-blue-700">"construction zone with orange cones"</div>
                    <div className="text-blue-700">"school bus stopped with children"</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Reference Image Upload
                </label>
                <div
                  {...getRootProps()}
                  className={clsx(
                    'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 group',
                    isDragActive
                      ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-purple-50 rs-shadow-lg scale-105'
                      : selectedImage
                      ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-green-50 rs-shadow'
                      : 'border-slate-300 hover:border-indigo-300 hover:bg-gradient-to-br hover:from-slate-50 hover:to-indigo-50 hover:rs-shadow'
                  )}
                >
                  <input {...getInputProps()} />
                  {selectedImage ? (
                    <div className="space-y-4">
                      <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                        <PhotoIcon className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-emerald-900">{selectedImage.name}</p>
                        <p className="text-sm text-emerald-600 mt-1">Image ready for similarity search</p>
                      </div>
                      <p className="text-sm text-emerald-600">Click to select a different image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className={clsx(
                        'mx-auto w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300',
                        isDragActive
                          ? 'bg-indigo-200 scale-110'
                          : 'bg-slate-100 group-hover:bg-indigo-100 group-hover:scale-105'
                      )}>
                        <PhotoIcon className={clsx(
                          'h-8 w-8 transition-colors duration-300',
                          isDragActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-500'
                        )} />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {isDragActive ? 'Drop your image here' : 'Upload reference image'}
                        </p>
                        <p className="text-slate-600 mt-2">
                          Find visually similar scenes in your video library
                        </p>
                      </div>
                      <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
                        <span>PNG, JPG, WEBP</span>
                        <span>•</span>
                        <span>Max 10MB</span>
                        <span>•</span>
                        <span>AI-powered matching</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Upload an image that represents the type of scenario you want to find
                </p>
              </div>
            </div>
          )}

          {/* Enhanced Advanced Filters */}
          <div className="pt-8 border-t border-slate-200">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={clsx(
                'flex items-center space-x-3 text-sm font-semibold transition-colors group',
                showFilters ? 'text-indigo-600' : 'text-slate-700 hover:text-slate-900'
              )}
            >
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                showFilters ? 'bg-indigo-100' : 'bg-slate-100 group-hover:bg-slate-200'
              )}>
                <AdjustmentsHorizontalIcon className={clsx(
                  'h-4 w-4 transition-colors',
                  showFilters ? 'text-indigo-600' : 'text-slate-600'
                )} />
              </div>
              <span>Advanced Search Filters</span>
              <div className={clsx(
                'text-xs px-2 py-1 rounded-full transition-colors',
                showFilters ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
              )}>
                {showFilters ? 'Hide' : 'Show'}
              </div>
            </button>
            
            {showFilters && (
              <div className="mt-6 rs-card p-6 bg-gradient-to-r from-slate-50 to-indigo-50">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 mb-4">Refine Your Search</h4>
                    <p className="text-xs text-slate-600 mb-4">
                      Use these filters to narrow down results based on driving conditions and search parameters
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Time of Day
                      </label>
                      <select
                        value={filters.time_of_day || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, time_of_day: e.target.value || undefined }))}
                        className="rs-input text-sm"
                      >
                        <option value="">Any time</option>
                        {filterSuggestions?.time_of_day?.map((option: string) => (
                          <option key={option} value={option}>
                            {option === 'day' && '🌅 '}
                            {option === 'night' && '🌙 '}
                            {option === 'dawn' && '🌄 '}
                            {option === 'dusk' && '🌆 '}
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500">Filter by lighting conditions</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Weather Conditions
                      </label>
                      <select
                        value={filters.weather || ''}
                        onChange={(e) => setFilters(prev => ({ ...prev, weather: e.target.value || undefined }))}
                        className="rs-input text-sm"
                      >
                        <option value="">Any weather</option>
                        {filterSuggestions?.weather?.map((option: string) => (
                          <option key={option} value={option}>
                            {option === 'sunny' && '☀️ '}
                            {option === 'cloudy' && '☁️ '}
                            {option === 'rainy' && '🌧️ '}
                            {option === 'snowy' && '❄️ '}
                            {option === 'foggy' && '🌫️ '}
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-slate-500">Filter by weather patterns</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Result Count
                      </label>
                      <select
                        value={filters.limit}
                        onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                        className="rs-input text-sm"
                      >
                        <option value={5}>5 results</option>
                        <option value={10}>10 results</option>
                        <option value={20}>20 results</option>
                        <option value={50}>50 results</option>
                      </select>
                      <p className="text-xs text-slate-500">Number of matches to return</p>
                    </div>
                    
                    <div className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-700">
                        Similarity Threshold
                      </label>
                      <select
                        value={filters.similarity_threshold}
                        onChange={(e) => setFilters(prev => ({ ...prev, similarity_threshold: parseFloat(e.target.value) }))}
                        className="rs-input text-sm"
                      >
                        <option value={0.1}>🔍 Very Broad (10%)</option>
                        <option value={0.2}>📊 Broad (20%)</option>
                        <option value={0.3}>⚖️ Balanced (30%)</option>
                        <option value={0.5}>🎯 Precise (50%)</option>
                        <option value={0.7}>💎 Very Precise (70%)</option>
                      </select>
                      <p className="text-xs text-slate-500">How similar results must be</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Search Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                <span className="font-medium text-slate-700">
                  {searchType === 'text' ? 'Natural language search' : 'Visual similarity search'}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {searchType === 'text' 
                  ? query.trim() 
                    ? `Query: "${query.trim()}"`
                    : 'Enter a description to search for matching scenarios'
                  : selectedImage
                    ? `Image: ${selectedImage.name}`
                    : 'Upload an image to find visually similar scenes'
                }
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-400">
                <span>CLIP AI-powered</span>
                <span>•</span>
                <span>Semantic matching</span>
                <span>•</span>
                <span>Real-time search</span>
              </div>
            </div>
            
            <button
              onClick={searchType === 'text' ? handleTextSearch : handleImageSearch}
              disabled={isLoading || (searchType === 'text' ? !query.trim() : !selectedImage)}
              className={clsx(
                'rs-btn-primary px-8 py-3 text-base font-semibold flex items-center space-x-3',
                (isLoading || (searchType === 'text' ? !query.trim() : !selectedImage)) ? 'opacity-50 cursor-not-allowed' : ''
              )}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Searching Scenarios...</span>
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