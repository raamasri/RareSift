'use client'

import { useState } from 'react'
import { 
  DocumentArrowDownIcon,
  EyeIcon,
  XMarkIcon,
  ChartBarIcon,
  ArchiveBoxIcon,
  InformationCircleIcon,
  ClockIcon,
  TagIcon,
  PhotoIcon
} from '@heroicons/react/24/outline'
import { DemoExportScenario, ExportFormat, DemoFrame } from '@/lib/demo-exports'
import { DemoExportGenerator, formatFileSize, getExportIcon } from '@/lib/demo-export-generator'
import clsx from 'clsx'
import Image from 'next/image'

interface ExportPreviewProps {
  scenario: DemoExportScenario
  isOpen: boolean
  onClose: () => void
  onDownload: (format: 'zip' | 'dataset' | 'csv') => void
}

export function ExportPreview({ scenario, isOpen, onClose, onDownload }: ExportPreviewProps) {
  const [selectedFormat, setSelectedFormat] = useState<'zip' | 'dataset' | 'csv'>('dataset')
  const [previewTab, setPreviewTab] = useState<'overview' | 'frames' | 'metadata'>('overview')
  const [isDownloading, setIsDownloading] = useState(false)

  if (!isOpen) return null

  const selectedFormatData = scenario.formats.find(f => f.type === selectedFormat)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await DemoExportGenerator.downloadDemoExport(scenario, selectedFormat)
      onDownload(selectedFormat)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const formatTimestamp = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <DocumentArrowDownIcon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{scenario.title}</h2>
                <p className="text-indigo-100 text-sm mt-1">{scenario.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{scenario.frame_count}</div>
              <div className="text-xs text-indigo-100">Frames</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{scenario.file_size_mb}MB</div>
              <div className="text-xs text-indigo-100">Est. Size</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold capitalize">{scenario.category.replace('_', ' ')}</div>
              <div className="text-xs text-indigo-100">Category</div>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold">{scenario.formats.length}</div>
              <div className="text-xs text-indigo-100">Formats</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col h-full max-h-[calc(90vh-200px)]">
          {/* Format Selection */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Format</h3>
            <div className="grid grid-cols-2 gap-4">
              {scenario.formats.map((format) => (
                <button
                  key={format.type}
                  onClick={() => setSelectedFormat(format.type)}
                  className={clsx(
                    'p-4 rounded-lg border-2 text-left transition-all duration-200',
                    selectedFormat === format.type
                      ? 'border-indigo-500 bg-indigo-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="text-2xl">{getExportIcon(format.type)}</div>
                    <div>
                      <div className="font-semibold text-gray-900 capitalize">{format.type} Format</div>
                      <div className="text-sm text-gray-500">{formatFileSize((format.file_size_mb || 0) * 1024 * 1024)}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">{format.description}</div>
                  <div className="space-y-1">
                    {format.contents.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-xs text-gray-500 flex items-center space-x-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>{item}</span>
                      </div>
                    ))}
                    {format.contents.length > 3 && (
                      <div className="text-xs text-gray-400">+{format.contents.length - 3} more items</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: 'Overview', icon: InformationCircleIcon },
              { id: 'frames', label: 'Frames', icon: PhotoIcon },
              { id: 'metadata', label: 'Metadata', icon: ChartBarIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPreviewTab(tab.id as any)}
                className={clsx(
                  'flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors',
                  previewTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                )}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {previewTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Use Case</h4>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">{scenario.use_case}</p>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedFormatData?.contents.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Technical Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">File Format</div>
                      <div className="font-semibold text-gray-900 uppercase">{selectedFormat}</div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Estimated Size</div>
                      <div className="font-semibold text-gray-900">{formatFileSize((selectedFormatData?.file_size_mb || 0) * 1024 * 1024)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewTab === 'frames' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Frame Preview</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenario.frames.slice(0, 6).map((frame, index) => (
                    <div key={frame.frame_id} className="bg-gray-50 rounded-lg p-4">
                      <div className="aspect-video bg-gray-200 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                        <Image
                          src={`/${frame.relative_path}`}
                          alt={`Frame ${index + 1}`}
                          width={200}
                          height={112}
                          className="object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            target.parentElement!.innerHTML = `
                              <div class="flex flex-col items-center justify-center h-full text-gray-400">
                                <svg class="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
                                </svg>
                                <span class="text-xs">Demo Frame</span>
                              </div>
                            `
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Frame {index + 1}</span>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            {Math.round(frame.similarity * 100)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <ClockIcon className="h-3 w-3" />
                          <span>{formatTimestamp(frame.timestamp)}</span>
                        </div>
                        {frame.metadata.scenario_tags && (
                          <div className="flex items-center space-x-1">
                            <TagIcon className="h-3 w-3 text-gray-400" />
                            <div className="flex flex-wrap gap-1">
                              {frame.metadata.scenario_tags.slice(0, 2).map((tag, tagIndex) => (
                                <span key={tagIndex} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {scenario.frames.length > 6 && (
                  <div className="text-center py-4">
                    <span className="text-sm text-gray-500">
                      +{scenario.frames.length - 6} more frames included in export
                    </span>
                  </div>
                )}
              </div>
            )}

            {previewTab === 'metadata' && (
              <div className="space-y-6">
                <h4 className="text-lg font-semibold text-gray-900">Metadata Structure</h4>
                
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <div className="space-y-1">
                    <div>📁 {scenario.id}_{selectedFormat}_demo.zip</div>
                    <div className="ml-4">├── 📄 {selectedFormat === 'dataset' ? 'dataset_metadata.json' : 'metadata.json'}</div>
                    {selectedFormat === 'dataset' && (
                      <div className="ml-4">├── 📊 frames_summary.csv</div>
                    )}
                    <div className="ml-4">├── 📖 README.md</div>
                    {scenario.frames.slice(0, 3).map((frame, index) => (
                      <div key={index} className="ml-4">├── 🖼️ frame_{frame.frame_id}_{String(index + 1).padStart(6, '0')}.jpg</div>
                    ))}
                    {scenario.frames.length > 3 && (
                      <div className="ml-4">└── ... (+{scenario.frames.length - 3} more frames)</div>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Sample Metadata JSON</h5>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs text-gray-600 overflow-x-auto">
{JSON.stringify({
  export_info: {
    scenario_title: scenario.title,
    category: scenario.category,
    total_frames: scenario.frame_count,
    format: selectedFormat
  },
  frames: scenario.frames.slice(0, 2).map((frame, index) => ({
    frame_id: frame.frame_id,
    video_id: frame.video_id,
    timestamp: frame.timestamp,
    similarity: frame.similarity,
    metadata: frame.metadata,
    filename: `frame_${frame.frame_id}_${String(index + 1).padStart(6, '0')}.jpg`
  }))
}, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Ready to download:</span> {formatFileSize((selectedFormatData?.file_size_mb || 0) * 1024 * 1024)} • {scenario.frame_count} frames
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <DocumentArrowDownIcon className="h-4 w-4" />
                      <span>Download {selectedFormat.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}