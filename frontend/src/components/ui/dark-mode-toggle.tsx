'use client'

import { SunIcon, MoonIcon } from '@heroicons/react/24/outline'
import { useTheme } from '@/contexts/theme-context'
import clsx from 'clsx'

export default function DarkModeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={clsx(
        'relative inline-flex items-center justify-center px-3 py-2 h-10 rounded-xl transition-all duration-200',
        'bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-slate-200/60',
        'dark:bg-slate-800/70 dark:hover:bg-slate-800/90 dark:border-slate-700/60',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500'
      )}
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      <div className="relative w-5 h-5">
        <SunIcon 
          className={clsx(
            'absolute inset-0 w-5 h-5 transition-all duration-300',
            'text-amber-500',
            theme === 'light' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 rotate-90 scale-0'
          )}
        />
        <MoonIcon 
          className={clsx(
            'absolute inset-0 w-5 h-5 transition-all duration-300',
            'text-slate-700 dark:text-slate-300',
            theme === 'dark' 
              ? 'opacity-100 rotate-0 scale-100' 
              : 'opacity-0 -rotate-90 scale-0'
          )}
        />
      </div>
    </button>
  )
}