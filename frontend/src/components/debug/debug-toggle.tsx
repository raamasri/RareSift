'use client'

import React, { useState } from 'react'
import { BugAntIcon } from '@heroicons/react/24/outline'
import DebugConsole from './debug-console'
import clsx from 'clsx'

export default function DebugToggle() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Debug Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          'fixed bottom-4 right-4 z-40 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 transition-all',
          isOpen && 'hidden'
        )}
        title="Open Debug Console"
      >
        <BugAntIcon className="w-6 h-6" />
      </button>

      {/* Debug Console */}
      <DebugConsole 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  )
} 