'use client'

import { Fragment, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PlayIcon } from '@heroicons/react/24/outline'

interface VideoModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  videoUrl?: string
  thumbnailUrl?: string
}

export default function VideoModal({ 
  isOpen, 
  onClose, 
  title = "RareSift Demo", 
  videoUrl = "https://player.vimeo.com/video/example",
  thumbnailUrl
}: VideoModalProps) {
  
  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Video Content */}
                <div className="relative bg-black">
                  <div className="aspect-video">
                    {/* Demo Video Placeholder - Replace with actual video */}
                    <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center relative overflow-hidden">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />
                      </div>
                      
                      {/* Video Content */}
                      <div className="relative z-10 text-center text-white max-w-2xl px-6">
                        <div className="mb-6">
                          <PlayIcon className="h-20 w-20 mx-auto mb-4 opacity-80" />
                        </div>
                        <h3 className="text-3xl font-bold mb-4">
                          RareSift Demo Video
                        </h3>
                        <p className="text-lg opacity-90 mb-8">
                          See how autonomous vehicle teams are finding critical driving scenarios 
                          in seconds instead of hours with our AI-powered search platform.
                        </p>
                        
                        {/* Demo Features Highlighted */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-2xl mb-2">🔍</div>
                            <div className="font-semibold mb-1">Natural Language Search</div>
                            <div className="opacity-80">Search with plain English</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-2xl mb-2">⚡</div>
                            <div className="font-semibold mb-1">Instant Results</div>
                            <div className="opacity-80">0.3 second search time</div>
                          </div>
                          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="text-2xl mb-2">📊</div>
                            <div className="font-semibold mb-1">Frame Precision</div>
                            <div className="opacity-80">Exact moment detection</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actual video would go here when available */}
                    {/* 
                    <iframe
                      src={videoUrl}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title={title}
                    />
                    */}
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ready to see RareSift in action with your data?
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          onClose()
                          // Navigate to demo request form
                          window.location.href = '#demo-form'
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                      >
                        Schedule Live Demo
                      </button>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}