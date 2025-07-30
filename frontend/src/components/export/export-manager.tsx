'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { exportApi } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

interface ExportItem {
  export_id: number
  status: string
  frame_count: number
  export_format: string
  file_size?: number
  created_at: string
  completed_at?: string
  error_message?: string
}

export function ExportManager() {
  const [selectedExport, setSelectedExport] = useState<ExportItem | null>(null)

  const queryClient = useQueryClient()

  // Fetch exports
  const { data: exportsData, isLoading } = useQuery({
    queryKey: ['exports'],
    queryFn: () => exportApi.list({ limit: 50 }),
    refetchInterval: 5000 // Refresh every 5 seconds for status updates
  })

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: exportApi.download,
    onSuccess: () => {
      // Show success message
    }
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: exportApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports'] })
      setSelectedExport(null)
    }
  })

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircleIcon,
          text: 'Ready',
          color: 'text-green-600 bg-green-50 border-green-200'
        }
      case 'processing':
        return {
          icon: ClockIcon,
          text: 'Processing',
          color: 'text-blue-600 bg-blue-50 border-blue-200'
        }
      case 'failed':
        return {
          icon: ExclamationTriangleIcon,
          text: 'Failed',
          color: 'text-red-600 bg-red-50 border-red-200'
        }
      default:
        return {
          icon: ClockIcon,
          text: 'Pending',
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
        }
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-300 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const exports = exportsData?.exports || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Export Manager</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage and download your scenario exports
            </p>
          </div>
          
          <div className="text-sm text-gray-500">
            {exportsData?.total || 0} exports total
          </div>
        </div>
      </div>

      {/* Exports List */}
      {exports.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <ArrowDownTrayIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Exports Yet</h3>
          <p className="text-gray-600 mb-4">
            Export scenarios from your search results to create downloadable datasets.
          </p>
          <p className="text-sm text-gray-500">
            Go to Search → Find scenarios → Select frames → Export
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {exports.map((exportItem: ExportItem) => {
            const statusInfo = getStatusInfo(exportItem.status)
            const StatusIcon = statusInfo.icon
            const canDownload = exportItem.status === 'completed'
            
            return (
              <div
                key={exportItem.export_id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={clsx(
                      'h-10 w-10 rounded-lg flex items-center justify-center border',
                      statusInfo.color
                    )}>
                      <StatusIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900">
                        Export #{exportItem.export_id}
                      </h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="text-xs text-gray-500">
                          {exportItem.frame_count} frames
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {exportItem.export_format} format
                        </div>
                        {exportItem.file_size && (
                          <div className="text-xs text-gray-500">
                            {formatFileSize(exportItem.file_size)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status */}
                    <div className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium border',
                      statusInfo.color
                    )}>
                      {statusInfo.text}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      {canDownload && (
                        <button
                          onClick={() => downloadMutation.mutate(exportItem.export_id)}
                          disabled={downloadMutation.isPending}
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                          title="Download export"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => setSelectedExport(exportItem)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                        title="View details"
                      >
                        <ClockIcon className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteMutation.mutate(exportItem.export_id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                        title="Delete export"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      Created {formatDistanceToNow(new Date(exportItem.created_at), { addSuffix: true })}
                    </span>
                    {exportItem.completed_at && (
                      <span>
                        Completed {formatDistanceToNow(new Date(exportItem.completed_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {exportItem.error_message && (
                    <div className="text-red-600 font-medium">
                      Error: {exportItem.error_message}
                    </div>
                  )}
                </div>

                {/* Download Action for Completed */}
                {canDownload && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => downloadMutation.mutate(exportItem.export_id)}
                      disabled={downloadMutation.isPending}
                      className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {downloadMutation.isPending ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          <span>Download ({formatFileSize(exportItem.file_size)})</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Export Details Modal */}
      {selectedExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Export Details
                </h3>
                <button
                  onClick={() => setSelectedExport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Export Information</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Export ID</dt>
                      <dd className="font-medium">#{selectedExport.export_id}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Status</dt>
                      <dd className="font-medium capitalize">{selectedExport.status}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Frames</dt>
                      <dd className="font-medium">{selectedExport.frame_count}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Format</dt>
                      <dd className="font-medium uppercase">{selectedExport.export_format}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">File Size</dt>
                      <dd className="font-medium">{formatFileSize(selectedExport.file_size)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Created</dt>
                      <dd className="font-medium">
                        {formatDistanceToNow(new Date(selectedExport.created_at), { addSuffix: true })}
                      </dd>
                    </div>
                    {selectedExport.completed_at && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Completed</dt>
                        <dd className="font-medium">
                          {formatDistanceToNow(new Date(selectedExport.completed_at), { addSuffix: true })}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                {selectedExport.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-red-900 mb-1">Error Message</h4>
                    <p className="text-sm text-red-700">{selectedExport.error_message}</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedExport(null)}
                      className="flex-1 px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
                    >
                      Close
                    </button>
                    {selectedExport.status === 'completed' && (
                      <button
                        onClick={() => {
                          downloadMutation.mutate(selectedExport.export_id)
                          setSelectedExport(null)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 