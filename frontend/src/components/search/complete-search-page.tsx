'use client'

import { useState } from 'react'
import { APISearchInterface } from './api-search-interface'
import { SearchResults } from './search-results'
interface SearchResponse {
  results: any[]
  total_found: number
  search_time_ms: number
  query_text?: string
}

export function CompleteSearchPage() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSearchResults = (results: SearchResponse) => {
    console.log('📊 New search results received:', {
      query: results.query_text,
      total_found: results.total_found,
      search_time_ms: results.search_time_ms,
      first_frame_id: results.results[0]?.frame_id,
      first_similarity: results.results[0]?.similarity
    })
    setSearchResults(results)
    setRefreshKey(prev => prev + 1) // Force re-render
    setIsSearching(false)
  }

  const handleSearchStart = () => {
    console.log('🔄 Search started - clearing previous results')
    setIsSearching(true)
    setSearchResults(null)
    setRefreshKey(prev => prev + 1) // Clear any cached state
  }

  return (
    <div className="space-y-8">
      <APISearchInterface 
        onSearchResults={handleSearchResults}
        onSearchStart={handleSearchStart}
      />
      
      {/* Search Results Section */}
      {isSearching && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
            <p className="text-slate-600 dark:text-slate-300">Searching through video database...</p>
          </div>
        </div>
      )}
      
      {searchResults && (
        <div className="space-y-6">
          {/* Search Summary */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Search Results
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  Found {searchResults.total_found} matches in {searchResults.search_time_ms}ms
                  {searchResults.query_text && (
                    <span className="ml-2">
                      for "{searchResults.query_text}"
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Results</span>
              </div>
            </div>
          </div>
          
          {/* Display Results */}
          <SearchResults 
            key={`${refreshKey}-${searchResults.total_found}`}
            results={searchResults} 
          />
        </div>
      )}
      
      {/* Empty State */}
      {!searchResults && !isSearching && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-2xl flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Ready to Search</h3>
          <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Enter a natural language query above to search through your video collection using AI-powered semantic matching.
          </p>
        </div>
      )}
    </div>
  )
}