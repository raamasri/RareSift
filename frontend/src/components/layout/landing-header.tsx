'use client'

import { 
  Cog6ToothIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import LoginModal from '@/components/auth/login-modal'
import RegisterModal from '@/components/auth/register-modal'
import DarkModeToggle from '@/components/ui/dark-mode-toggle'

interface LandingHeaderProps {
  onNavigate?: (tab: string) => void
}

export default function LandingHeader({ onNavigate }: LandingHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const { user, logout, isAuthenticated } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    setShowUserMenu(false)
  }

  const openLogin = () => {
    setShowUserMenu(false)
    setShowLoginModal(true)
  }

  const openRegister = () => {
    setShowUserMenu(false)
    setShowRegisterModal(true)
  }

  const switchToRegister = () => {
    setShowLoginModal(false)
    setShowRegisterModal(true)
  }

  const switchToLogin = () => {
    setShowRegisterModal(false)
    setShowLoginModal(true)
  }

  return (
    <>
      <header className="rs-gradient-subtle dark:bg-gray-900/95 border-b border-slate-200/60 dark:border-gray-700/60 backdrop-blur-sm sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Brand Section */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                {/* Professional Logo */}
                <div className="relative">
                  <div className="w-10 h-10 rs-gradient-primary rounded-xl rs-shadow flex items-center justify-center">
                    <div className="w-6 h-6 relative">
                      <div className="absolute inset-0 bg-white/90 rounded-sm rotate-45 transform origin-center"></div>
                      <div className="absolute inset-1 bg-white/70 rounded-sm"></div>
                      <div className="absolute inset-2 bg-white rounded-sm"></div>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                </div>
                
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold rs-text-gradient">RareSift</h1>
                  <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Enterprise AI Platform</p>
                </div>
              </div>
              
              {/* Status Badge */}
              <div className="hidden md:flex">
                <span className="rs-status-success">
                  ✓ Demo Mode
                </span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4 h-12">
              {/* Processing Status */}
              <div className="hidden lg:flex items-center space-x-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm px-4 py-2 h-10 rounded-xl border border-slate-200/60 dark:border-gray-700/60">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700 dark:text-gray-300">System Healthy</span>
                </div>
                <div className="w-px h-4 bg-slate-200"></div>
                <div className="text-xs text-slate-500 dark:text-gray-400">
                  All services operational
                </div>
              </div>

              {/* User Menu / Auth */}
              <div className="relative">
                {isAuthenticated ? (
                  // Authenticated user menu
                  <>
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 px-3 py-2 h-10 rounded-xl border border-slate-200/60 dark:border-gray-700/60 transition-all duration-200"
                    >
                      <UserCircleIcon className="h-6 w-6 text-slate-600" />
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">{user?.email}</p>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl rs-shadow-lg border border-slate-200/60 py-2 z-50">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900">{user?.full_name || 'User'}</p>
                          <p className="text-xs text-slate-500">{user?.email}</p>
                          {user?.company && (
                            <p className="text-xs text-slate-400">{user.company}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => router.push('/dashboard')}
                          className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Full Dashboard
                        </button>
                        <button
                          onClick={() => {
                            onNavigate?.('settings')
                            setShowUserMenu(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Profile Settings
                        </button>
                        <button
                          onClick={() => {
                            onNavigate?.('settings')
                            setShowUserMenu(false)
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          API Keys
                        </button>
                        <div className="border-t border-slate-100 mt-2"></div>
                        <button 
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Sign Out
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  // Guest user menu
                  <>
                    <button 
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 px-3 py-2 h-10 rounded-xl border border-slate-200/60 dark:border-gray-700/60 transition-all duration-200"
                    >
                      <UserCircleIcon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Demo User</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300">Try RareSift</p>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-slate-400 dark:text-slate-300" />
                    </button>

                    {/* Dropdown Menu for guests */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl rs-shadow-lg border border-slate-200/60 py-2 z-50">
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-sm font-semibold text-slate-900">Demo Mode</p>
                          <p className="text-xs text-slate-500">Explore RareSift features</p>
                        </div>
                        <button 
                          onClick={openLogin}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                          Sign In
                        </button>
                        <button 
                          onClick={openRegister}
                          className="flex items-center w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50"
                        >
                          <UserPlusIcon className="h-4 w-4 mr-2" />
                          Create Account
                        </button>
                        <div className="border-t border-slate-100 mt-2"></div>
                        <div className="px-4 py-2">
                          <p className="text-xs text-slate-400">
                            Demo mode allows you to explore all features without an account
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Dark Mode Toggle */}
              <DarkModeToggle />
              
              {/* Pricing CTA Button - Furthest Right */}
              <div className="relative">
                <button
                  onClick={() => onNavigate?.('pricing')}
                  className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 sm:px-4 py-2 h-10 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  title="View Pricing Plans - 14 Day Free Trial"
                >
                  <CurrencyDollarIcon className="h-4 w-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm leading-none">
                      <span className="hidden sm:inline">View Pricing</span>
                      <span className="sm:hidden">Pricing</span>
                    </span>
                    <span className="text-xs opacity-90 leading-none hidden sm:block">Free Trial</span>
                  </div>
                </button>
                {/* Subtle pulse indicator */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={switchToRegister}
      />

      {/* Register Modal */}
      <RegisterModal 
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={switchToLogin}
      />
    </>
  )
}