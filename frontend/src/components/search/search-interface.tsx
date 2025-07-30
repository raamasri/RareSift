'use client'

import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { MagnifyingGlassIcon, PhotoIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline'
import { useMutation, useQuery } from '@tanstack/react-query'
import { searchApi } from '@/lib/api'
import clsx from 'clsx'
import { logStore } from '@/components/debug/debug-console'

interface SearchInterfaceProps {
  onSearchResults: (results: any) => void
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
  const [filters, setFilters] = useState<SearchFilters>({
    similarity_threshold: 0.2,
    limit: 10
  })

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
      onSearchResults(data)
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
      onSearchResults(data)
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="space-y-6">
        {/* Search Type Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Search Scenarios</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSearchType('text')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                searchType === 'text'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <MagnifyingGlassIcon className="h-4 w-4 inline mr-2" />
              Text Search
            </button>
            <button
              onClick={() => setSearchType('image')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                searchType === 'image'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              <PhotoIcon className="h-4 w-4 inline mr-2" />
              Image Search
            </button>
          </div>
        </div>

        {/* Search Input */}
        {searchType === 'text' ? (
          <div className="space-y-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                placeholder="Describe the scenario you're looking for... (e.g., 'pedestrian crossing at night', 'car turning left in rain')"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div className="text-sm text-gray-500">
              <strong>Examples:</strong> "pedestrian near intersection at night", "highway merge in rain", "cyclist in bike lane", "emergency vehicle approaching"
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={clsx(
                'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : selectedImage
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              )}
            >
              <input {...getInputProps()} />
              {selectedImage ? (
                <div className="space-y-2">
                  <PhotoIcon className="mx-auto h-8 w-8 text-green-600" />
                  <p className="text-sm font-medium text-green-900">{selectedImage.name}</p>
                  <p className="text-xs text-green-600">Click to change image</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <PhotoIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {isDragActive ? 'Drop the image here' : 'Drag & drop an image here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="border-t pt-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2" />
            Advanced Filters
          </button>
          
          {showFilters && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Time of Day</label>
                <select
                  value={filters.time_of_day || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, time_of_day: e.target.value || undefined }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {filterSuggestions?.time_of_day?.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Weather</label>
                <select
                  value={filters.weather || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, weather: e.target.value || undefined }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Any</option>
                  {filterSuggestions?.weather?.map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Results</label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value={5}>5 results</option>
                  <option value={10}>10 results</option>
                  <option value={20}>20 results</option>
                  <option value={50}>50 results</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Similarity</label>
                <select
                  value={filters.similarity_threshold}
                  onChange={(e) => setFilters(prev => ({ ...prev, similarity_threshold: parseFloat(e.target.value) }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500"
                >
                  <option value={0.1}>Very Low (10%)</option>
                  <option value={0.2}>Low (20%)</option>
                  <option value={0.3}>Medium (30%)</option>
                  <option value={0.5}>High (50%)</option>
                  <option value={0.7}>Very High (70%)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Search across all processed videos for matching scenarios
          </div>
          <button
            onClick={searchType === 'text' ? handleTextSearch : handleImageSearch}
            disabled={isLoading || (searchType === 'text' ? !query.trim() : !selectedImage)}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <MagnifyingGlassIcon className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 