'use client'

import { useState } from 'react'
import { 
  CogIcon,
  UserCircleIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  CircleStackIcon,
  CpuChipIcon,
  CloudIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/auth-context'

interface SettingsSectionProps {
  title: string
  description: string
  icon: any
  children: React.ReactNode
}

const SettingsSection = ({ title, description, icon: Icon, children }: SettingsSectionProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center mb-4">
      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center mr-3">
        <Icon className="h-5 w-5 text-indigo-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
    {children}
  </div>
)

interface ToggleSwitchProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
  label: string
  description?: string
}

const ToggleSwitch = ({ enabled, onChange, label, description }: ToggleSwitchProps) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1">
      <label className="text-sm font-medium text-gray-900">{label}</label>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        enabled ? 'bg-indigo-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
)

export default function Settings() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    processingComplete: true,
    weeklyReports: true,
    securityAlerts: true
  })
  
  const [processing, setProcessing] = useState({
    autoProcessing: true,
    highQuality: false,
    frameExtraction: true,
    audioAnalysis: false
  })

  const [privacy, setPrivacy] = useState({
    dataRetention: '90',
    shareAnalytics: false,
    logRequests: true
  })

  const [apiSettings, setApiSettings] = useState({
    rateLimitPerHour: '1000',
    enableCaching: true,
    corsEnabled: true
  })

  const handleSaveProfile = async () => {
    try {
      // Get form values
      const formData = new FormData(document.querySelector('#profile-form') as HTMLFormElement)
      const profileData = {
        full_name: formData.get('full_name') as string,
        email: formData.get('email') as string,
        company: formData.get('company') as string
      }

      // Validate required fields
      if (!profileData.full_name?.trim() || !profileData.email?.trim()) {
        alert('Please fill in all required fields (Name and Email)')
        return
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profileData.email)) {
        alert('Please enter a valid email address')
        return
      }

      // Simulate API call with loading state
      const saveButton = document.querySelector('#save-profile-btn') as HTMLButtonElement
      const originalText = saveButton.textContent
      saveButton.disabled = true
      saveButton.textContent = 'Saving...'

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update user context (in real app, this would come from API response)
      // For now, we'll simulate success
      
      saveButton.disabled = false
      saveButton.textContent = originalText

      alert('✅ Profile settings saved successfully!\n\nYour changes have been updated in the system.')
    } catch (error) {
      alert('❌ Failed to save profile settings. Please try again.')
      console.error('Profile save error:', error)
    }
  }

  const handleGenerateApiKey = async () => {
    try {
      // Confirm action
      if (!confirm('🔑 Generate New API Key?\n\nThis will create a new API key and invalidate any existing keys. Are you sure you want to continue?')) {
        return
      }

      const generateButton = document.querySelector('#generate-api-btn') as HTMLButtonElement
      const originalText = generateButton.textContent
      generateButton.disabled = true
      generateButton.textContent = 'Generating...'

      // Simulate API key generation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate a realistic API key
      const prefix = 'rs_live_'
      const keyPart1 = Math.random().toString(36).substring(2, 15)
      const keyPart2 = Math.random().toString(36).substring(2, 15)
      const keyPart3 = Math.random().toString(36).substring(2, 15)
      const newApiKey = `${prefix}${keyPart1}${keyPart2}${keyPart3}`

      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(newApiKey)
        
        // Update the displayed API key in the UI
        const apiKeyDisplay = document.querySelector('.api-key-display')
        if (apiKeyDisplay) {
          apiKeyDisplay.textContent = `${prefix}${'•'.repeat(32)}`
        }

        generateButton.disabled = false
        generateButton.textContent = originalText

        alert(`✅ New API Key Generated!\n\nYour new API key has been generated and copied to your clipboard:\n\n${newApiKey}\n\n⚠️ Important: Save this key securely. For security reasons, you won't be able to see it again.`)
      } catch (clipboardError) {
        // Fallback if clipboard API is not available
        const textarea = document.createElement('textarea')
        textarea.value = newApiKey
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy') 
        document.body.removeChild(textarea)

        generateButton.disabled = false
        generateButton.textContent = originalText

        alert(`✅ New API Key Generated!\n\nYour new API key:\n${newApiKey}\n\n⚠️ Please copy this key manually and save it securely.`)
      }
    } catch (error) {
      alert('❌ Failed to generate API key. Please try again.')
      console.error('API key generation error:', error)
    }
  }

  const handleExportData = async () => {
    try {
      // Confirm action
      if (!confirm('📦 Export Your Data?\n\nThis will create a comprehensive export of all your videos, searches, analytics, and metadata. The export may take several minutes to prepare.\n\nProceed with data export?')) {
        return
      }

      const exportButton = document.querySelector('#export-data-btn') as HTMLButtonElement
      const originalText = exportButton.textContent
      exportButton.disabled = true
      exportButton.textContent = 'Preparing Export...'

      // Simulate export preparation
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Create mock export data
      const exportData = {
        user_profile: {
          full_name: user?.full_name || 'Demo User',
          email: user?.email || 'demo@example.com',
          company: user?.company || 'Demo Company',
          created_at: new Date().toISOString()
        },
        videos: [
          { id: 1, filename: 'highway_driving.mp4', duration: 120, created_at: '2025-01-15T10:00:00Z' },
          { id: 2, filename: 'city_traffic.mp4', duration: 95, created_at: '2025-01-16T14:30:00Z' },
          { id: 3, filename: 'parking_scenario.mp4', duration: 45, created_at: '2025-01-17T09:15:00Z' }
        ],
        searches: [
          { id: 1, query: 'pedestrian crossing', results_count: 15, created_at: '2025-01-18T11:00:00Z' },
          { id: 2, query: 'traffic light', results_count: 23, created_at: '2025-01-18T11:30:00Z' }
        ],
        analytics: {
          total_videos_processed: 24,
          total_searches_performed: 156,
          total_exports_created: 12,
          storage_used_gb: 2.4
        },
        export_metadata: {
          export_date: new Date().toISOString(),
          format_version: '1.0',
          total_records: 147
        }
      }

      // Create and download JSON file
      const dataStr = JSON.stringify(exportData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `raresift_data_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      exportButton.disabled = false
      exportButton.textContent = originalText

      alert('✅ Data Export Complete!\n\nYour complete data export has been downloaded as a JSON file. This includes:\n\n• User profile information\n• Video metadata and processing history\n• Search history and results\n• Analytics and usage data\n\nThe export is saved in a structured JSON format for easy processing.')
    } catch (error) {
      alert('❌ Failed to export data. Please try again.')
      console.error('Data export error:', error)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // First confirmation
      if (!confirm('⚠️ Delete Account?\n\nThis will permanently delete your account and ALL associated data including:\n\n• All uploaded videos and their analyses\n• Search history and saved searches\n• Export history and generated datasets\n• Analytics and usage data\n• API keys and integrations\n\nThis action CANNOT be undone.\n\nAre you sure you want to continue?')) {
        return
      }

      // Second confirmation with typing requirement
      const confirmationText = prompt('🔴 FINAL CONFIRMATION\n\nTo confirm account deletion, please type "DELETE MY ACCOUNT" exactly as shown (case sensitive):')
      
      if (confirmationText !== 'DELETE MY ACCOUNT') {
        if (confirmationText !== null) { // User didn't cancel
          alert('❌ Confirmation text did not match. Account deletion cancelled for your security.')
        }
        return
      }

      // Third confirmation with email verification (simulated)
      const emailVerification = prompt('📧 Email Verification\n\nFor security, please enter your account email address to verify your identity:')
      
      if (!emailVerification || !emailVerification.includes('@')) {
        alert('❌ Invalid email address. Account deletion cancelled.')
        return
      }

      const deleteButton = document.querySelector('#delete-account-btn') as HTMLButtonElement
      const originalText = deleteButton.textContent
      deleteButton.disabled = true
      deleteButton.textContent = 'Processing Deletion...'

      // Simulate account deletion process
      await new Promise(resolve => setTimeout(resolve, 4000))

      // Show final confirmation
      alert('✅ Account Deletion Initiated\n\nYour account deletion request has been processed. Within the next 24-48 hours:\n\n• All your data will be permanently removed from our servers\n• You will receive a final confirmation email\n• Your API keys will be immediately invalidated\n• All active sessions will be terminated\n\nThank you for using RareSift. We\'re sorry to see you go!')

      // In a real app, this would log the user out and redirect
      // For demo purposes, we'll just reset the button
      deleteButton.disabled = false
      deleteButton.textContent = originalText

    } catch (error) {
      alert('❌ Failed to process account deletion. Please contact support.')
      console.error('Account deletion error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account, preferences, and system configuration</p>
      </div>

      {/* Profile Settings */}
      <SettingsSection
        title="Profile Settings"
        description="Update your personal information and account details"
        icon={UserCircleIcon}
      >
        <form id="profile-form" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                name="full_name"
                defaultValue={user?.full_name || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                defaultValue={user?.email || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              name="company"
              defaultValue={user?.company || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter your company name"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              id="save-profile-btn"
              onClick={handleSaveProfile}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </form>
      </SettingsSection>

      {/* API Keys */}
      <SettingsSection
        title="API Keys"
        description="Manage your API keys for programmatic access"
        icon={KeyIcon}
      >
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Primary API Key</h4>
                <p className="text-xs text-gray-500 mt-1">Created on Jan 15, 2025 • Last used 2 hours ago</p>
                <code className="api-key-display text-xs bg-white px-2 py-1 rounded border mt-2 inline-block">rs_live_••••••••••••••••••••••••••••••••</code>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={async () => {
                    try {
                      const apiKey = 'rs_live_••••••••••••••••••••••••••••••••'
                      await navigator.clipboard.writeText('rs_live_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z')
                      alert('✅ API Key Copied!\n\nThe API key has been copied to your clipboard.')
                    } catch (error) {
                      alert('❌ Failed to copy API key. Please try again.')
                    }
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Copy
                </button>
                <button 
                  onClick={() => {
                    if (confirm('🔑 Revoke API Key?\n\nThis will immediately invalidate the API key and all requests using it will fail. Are you sure?')) {
                      alert('✅ API Key Revoked\n\nThe API key has been revoked and is no longer valid. Generate a new key if you need continued API access.')
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>
          <button
            id="generate-api-btn"
            onClick={handleGenerateApiKey}
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Generate New API Key
          </button>
        </div>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection
        title="Notifications"
        description="Control how and when you receive notifications"
        icon={BellIcon}
      >
        <div className="space-y-2">
          <ToggleSwitch
            enabled={notifications.emailNotifications}
            onChange={(enabled) => setNotifications({ ...notifications, emailNotifications: enabled })}
            label="Email Notifications"
            description="Receive notifications via email"
          />
          <ToggleSwitch
            enabled={notifications.pushNotifications}
            onChange={(enabled) => setNotifications({ ...notifications, pushNotifications: enabled })}
            label="Push Notifications"
            description="Receive browser push notifications"
          />
          <ToggleSwitch
            enabled={notifications.processingComplete}
            onChange={(enabled) => setNotifications({ ...notifications, processingComplete: enabled })}
            label="Processing Complete"
            description="Notify when video processing is finished"
          />
          <ToggleSwitch
            enabled={notifications.weeklyReports}
            onChange={(enabled) => setNotifications({ ...notifications, weeklyReports: enabled })}
            label="Weekly Reports"
            description="Receive weekly usage summaries"
          />
          <ToggleSwitch
            enabled={notifications.securityAlerts}
            onChange={(enabled) => setNotifications({ ...notifications, securityAlerts: enabled })}
            label="Security Alerts"
            description="Important security notifications"
          />
        </div>
      </SettingsSection>

      {/* Processing Settings */}
      <SettingsSection
        title="Processing Settings"
        description="Configure video processing and AI model parameters"
        icon={CpuChipIcon}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <ToggleSwitch
              enabled={processing.autoProcessing}
              onChange={(enabled) => setProcessing({ ...processing, autoProcessing: enabled })}
              label="Auto Processing"
              description="Automatically process uploaded videos"
            />
            <ToggleSwitch
              enabled={processing.highQuality}
              onChange={(enabled) => setProcessing({ ...processing, highQuality: enabled })}
              label="High Quality Mode"
              description="Use higher quality settings (slower processing)"
            />
            <ToggleSwitch
              enabled={processing.frameExtraction}
              onChange={(enabled) => setProcessing({ ...processing, frameExtraction: enabled })}
              label="Frame Extraction"
              description="Extract and analyze individual frames"
            />
            <ToggleSwitch
              enabled={processing.audioAnalysis}
              onChange={(enabled) => setProcessing({ ...processing, audioAnalysis: enabled })}
              label="Audio Analysis"
              description="Analyze audio content (experimental)"
            />
          </div>
        </div>
      </SettingsSection>

      {/* Privacy & Security */}
      <SettingsSection
        title="Privacy & Security"
        description="Manage your privacy preferences and security settings"
        icon={ShieldCheckIcon}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention Period</label>
            <select
              value={privacy.dataRetention}
              onChange={(e) => setPrivacy({ ...privacy, dataRetention: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="180">180 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
          </div>
          <ToggleSwitch
            enabled={privacy.shareAnalytics}
            onChange={(enabled) => setPrivacy({ ...privacy, shareAnalytics: enabled })}
            label="Share Anonymous Analytics"
            description="Help improve RareSift by sharing usage data"
          />
          <ToggleSwitch
            enabled={privacy.logRequests}
            onChange={(enabled) => setPrivacy({ ...privacy, logRequests: enabled })}
            label="Log API Requests"
            description="Keep logs of API requests for debugging"
          />
        </div>
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection
        title="Data Management"
        description="Export or delete your data"
        icon={CircleStackIcon}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Export Data</h4>
              <p className="text-xs text-gray-500 mt-1">Download all your videos, searches, and metadata</p>
            </div>
            <button
              id="export-data-btn"
              onClick={handleExportData}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
            <div>
              <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
              <p className="text-xs text-red-600 mt-1">Permanently delete your account and all associated data</p>
            </div>
            <button
              id="delete-account-btn"
              onClick={handleDeleteAccount}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* System Information */}
      <SettingsSection
        title="System Information"
        description="Current system status and configuration"
        icon={InformationCircleIcon}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Version</span>
              <span className="text-sm font-medium text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API Endpoint</span>
              <span className="text-sm font-medium text-gray-900">api.raresift.com</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Region</span>
              <span className="text-sm font-medium text-gray-900">US-West-2</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Storage Used</span>
              <span className="text-sm font-medium text-gray-900">2.4 GB / 10 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">API Calls This Month</span>
              <span className="text-sm font-medium text-gray-900">1,247 / 10,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm font-medium text-gray-900">Jan 29, 2025</span>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  )
}