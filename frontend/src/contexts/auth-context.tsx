'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, auth, tokenManager } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (userData: { email: string; password: string; full_name: string; company?: string; role?: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user && tokenManager.isAuthenticated()

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (tokenManager.isAuthenticated()) {
          // Add timeout to prevent hanging on failed API calls
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('API timeout')), 5000)
          )
          
          const currentUser = await Promise.race([
            auth.getCurrentUser(),
            timeoutPromise
          ])
          setUser(currentUser as any)
        }
      } catch (error) {
        console.warn('Failed to initialize auth (API may be unavailable):', error)
        // Don't clear tokens immediately - API might just be temporarily down
        // tokenManager.clearTokens()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      await auth.login({ username: email, password })
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: { email: string; password: string; full_name: string; company?: string; role?: string }) => {
    setIsLoading(true)
    try {
      const newUser = await auth.register(userData)
      // Auto-login after registration
      await auth.login({ username: userData.email, password: userData.password })
      const currentUser = await auth.getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await auth.logout()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      if (tokenManager.isAuthenticated()) {
        const currentUser = await auth.getCurrentUser()
        setUser(currentUser)
      }
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
      tokenManager.clearTokens()
    }
  }

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}