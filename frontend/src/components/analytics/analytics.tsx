'use client'

import { useState, useEffect } from 'react'
import { 
  ChartBarIcon,
  EyeIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Mock data for analytics
const usageData = [
  { date: '2025-01-01', uploads: 12, searches: 45, exports: 8, processing_time: 120 },
  { date: '2025-01-02', uploads: 19, searches: 52, exports: 12, processing_time: 95 },
  { date: '2025-01-03', uploads: 8, searches: 38, exports: 6, processing_time: 110 },
  { date: '2025-01-04', uploads: 15, searches: 61, exports: 15, processing_time: 88 },
  { date: '2025-01-05', uploads: 22, searches: 73, exports: 18, processing_time: 102 },
  { date: '2025-01-06', uploads: 18, searches: 59, exports: 14, processing_time: 76 },
  { date: '2025-01-07', uploads: 25, searches: 81, exports: 22, processing_time: 91 }
]

const searchTypesData = [
  { name: 'Text Search', value: 65, color: '#3B82F6' },
  { name: 'Image Search', value: 25, color: '#10B981' },
  { name: 'Advanced Filters', value: 10, color: '#F59E0B' }
]

const scenarioTypesData = [
  { scenario: 'Highway Driving', count: 145, percentage: 32 },
  { scenario: 'Urban Traffic', count: 98, percentage: 22 },
  { scenario: 'Parking Scenarios', count: 76, percentage: 17 },
  { scenario: 'Weather Conditions', count: 68, percentage: 15 },
  { scenario: 'Night Driving', count: 45, percentage: 10 },
  { scenario: 'Construction Zones', count: 18, percentage: 4 }
]

interface AnalyticsCardProps {
  title: string
  value: string | number
  change: number
  changeLabel: string
  icon: any
  color: string
}

const AnalyticsCard = ({ title, value, change, changeLabel, icon: Icon, color }: AnalyticsCardProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <div className="flex items-center mt-2">
          {change >= 0 ? (
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '+' : ''}{change}% {changeLabel}
          </span>
        </div>
      </div>
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </div>
  </div>
)

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">Platform usage insights and performance metrics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Platform usage insights and performance metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          <button 
            onClick={() => {
              // Create comprehensive analytics report
              const reportData = {
                report_metadata: {
                  generated_at: new Date().toISOString(),
                  time_range: timeRange,
                  report_type: 'analytics_summary'
                },
                key_metrics: {
                  total_videos_processed: 147,
                  search_queries: 892,
                  data_exports: 156,
                  avg_processing_time: '94s'
                },
                usage_trends: usageData,
                search_types_distribution: searchTypesData,
                scenario_analysis: scenarioTypesData,
                system_status: {
                  health: 'operational',
                  ai_model_status: 'ready',
                  queue_status: '3 jobs processing'
                }
              }

              // Create and download JSON report
              const dataStr = JSON.stringify(reportData, null, 2)
              const dataBlob = new Blob([dataStr], { type: 'application/json' })
              const url = URL.createObjectURL(dataBlob)
              
              const link = document.createElement('a')
              link.href = url
              link.download = `raresift_analytics_report_${new Date().toISOString().split('T')[0]}.json`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)

              alert('✅ Analytics Report Exported!\n\nYour comprehensive analytics report has been downloaded as a JSON file. This includes:\n\n• Key performance metrics\n• Usage trends and patterns\n• Search type distribution\n• Scenario analysis data\n• System status information\n\nThe report covers the selected time range and is formatted for easy analysis.')
            }}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalyticsCard
          title="Total Videos Processed"
          value={147}
          change={12}
          changeLabel="vs last week"
          icon={CloudArrowUpIcon}
          color="bg-gradient-to-r from-blue-500 to-blue-600"
        />
        <AnalyticsCard
          title="Search Queries"
          value={892}
          change={8}
          changeLabel="vs last week"
          icon={MagnifyingGlassIcon}
          color="bg-gradient-to-r from-green-500 to-green-600"
        />
        <AnalyticsCard
          title="Data Exports"
          value={156}
          change={-3}
          changeLabel="vs last week"
          icon={ArrowDownTrayIcon}
          color="bg-gradient-to-r from-purple-500 to-purple-600"
        />
        <AnalyticsCard
          title="Avg Processing Time"
          value="94s"
          change={-15}
          changeLabel="vs last week"
          icon={CpuChipIcon}
          color="bg-gradient-to-r from-amber-500 to-amber-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Usage Trends</h3>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Uploads</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Searches</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-gray-600">Exports</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={usageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="uploads" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="searches" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="exports" stroke="#8B5CF6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Search Types Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Types Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={searchTypesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {searchTypesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Processing Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Performance</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={usageData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="processing_time" 
              stroke="#F59E0B" 
              fill="#FEF3C7" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario Types Analysis */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Common Scenarios</h3>
        <div className="space-y-4">
          {scenarioTypesData.map((scenario, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{scenario.scenario}</span>
                  <span className="text-sm text-gray-600">{scenario.count} occurrences</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${scenario.percentage}%` }}
                  ></div>
                </div>
              </div>
              <span className="ml-4 text-sm font-semibold text-gray-900">{scenario.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">System Health</h4>
              <p className="text-sm text-gray-600">All services operational</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CpuChipIcon className="h-8 w-8 text-blue-500 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">AI Model Status</h4>
              <p className="text-sm text-gray-600">CLIP model loaded & ready</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Queue Status</h4>
              <p className="text-sm text-gray-600">3 jobs processing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}