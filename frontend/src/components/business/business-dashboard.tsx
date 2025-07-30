'use client'

import { useState } from 'react'
import { 
  TruckIcon,
  BuildingOffice2Icon,
  UserGroupIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  PresentationChartLineIcon,
  BeakerIcon,
  Cog6ToothIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Market data
const marketGrowthData = [
  { year: '2023', marketSize: 31.2, yc: 'YC Entry' },
  { year: '2024', marketSize: 45.8, yc: 'Pilot Customers' },
  { year: '2025', marketSize: 67.3, yc: 'Scale Phase' },
  { year: '2026', marketSize: 95.7, yc: 'Market Leader' },
  { year: '2027', marketSize: 134.2, yc: 'IPO Ready' },
  { year: '2028', marketSize: 186.5, yc: 'Public Company' }
]

const customerSegmentData = [
  { name: 'AV Startups (Seed-Series B)', value: 45, customers: 150, revenue: '$2-10K/mo', color: '#3B82F6' },
  { name: 'Scale-ups (Series C+)', value: 30, customers: 40, revenue: '$15-50K/mo', color: '#10B981' },
  { name: 'OEM Data Teams', value: 15, customers: 12, revenue: '$100-500K/mo', color: '#F59E0B' },
  { name: 'Tier 1 Suppliers', value: 10, customers: 8, revenue: '$50-200K/mo', color: '#8B5CF6' }
]

const competitivePositionData = [
  { name: 'Manual Search', efficiency: 10, cost: 95, satisfaction: 20 },
  { name: 'Scale AI', efficiency: 60, cost: 80, satisfaction: 65 },
  { name: 'Voxel51', efficiency: 50, cost: 70, satisfaction: 60 },
  { name: 'RareSift', efficiency: 95, cost: 30, satisfaction: 90 }
]

const tractionMetrics = [
  { month: 'Jan', signups: 12, pilots: 0, revenue: 0 },
  { month: 'Feb', signups: 28, pilots: 2, revenue: 15000 },
  { month: 'Mar', signups: 45, pilots: 5, revenue: 42000 },
  { month: 'Apr', signups: 72, pilots: 8, revenue: 89000 },
  { month: 'May', signups: 118, pilots: 12, revenue: 156000 },
  { month: 'Jun', signups: 185, pilots: 18, revenue: 267000 }
]

const avCompanies = [
  { name: 'Waymo', category: 'Robotaxi', stage: 'Commercial', employees: 2500, funding: '$5.5B' },
  { name: 'Cruise', category: 'Robotaxi', stage: 'Testing', employees: 1800, funding: '$9.35B' },
  { name: 'Aurora', category: 'Trucking', stage: 'Public', employees: 1600, funding: '$2.8B' },
  { name: 'Argo AI', category: 'Multiple', stage: 'Acquired', employees: 2000, funding: '$3.6B' },
  { name: 'Zoox', category: 'Robotaxi', stage: 'Development', employees: 2500, funding: '$1.3B' },
  { name: 'Mobileye', category: 'ADAS', stage: 'Public', employees: 3000, funding: '$15.3B' },
  { name: 'Nuro', category: 'Delivery', stage: 'Series C', employees: 1000, funding: '$2.1B' },
  { name: 'TuSimple', category: 'Trucking', stage: 'Public', employees: 1100, funding: '$1.4B' }
]

interface MetricCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: any
  description: string
}

const MetricCard = ({ title, value, change, changeType = 'positive', icon: Icon, description }: MetricCardProps) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <div className="flex items-center mt-2">
            <ArrowTrendingUpIcon className={`h-4 w-4 mr-1 ${
              changeType === 'positive' ? 'text-green-500' : 
              changeType === 'negative' ? 'text-red-500' : 'text-gray-500'
            }`} />
            <span className={`text-sm ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {change}
            </span>
          </div>
        )}
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </div>
      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
        <Icon className="h-6 w-6 text-indigo-600" />
      </div>
    </div>
  </div>
)

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState('market')

  const tabs = [
    { id: 'market', name: 'Market Size', icon: GlobeAltIcon },
    { id: 'competition', name: 'Competitive Analysis', icon: ChartBarIcon },
    { id: 'traction', name: 'Traction Metrics', icon: ArrowTrendingUpIcon },
    { id: 'customers', name: 'Target Customers', icon: UserGroupIcon }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
          <PresentationChartLineIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Intelligence</h1>
          <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
            Market opportunity, competitive positioning, and growth metrics for YC evaluation
          </p>
        </div>
      </div>

      {/* Key Business Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Addressable Market"
          value="$186.5B"
          change="+28% CAGR"
          icon={GlobeAltIcon}
          description="AV market size by 2028"
        />
        <MetricCard
          title="Serviceable Market"
          value="$2.8B"
          change="+45% CAGR"
          icon={BeakerIcon}
          description="AV data & validation tools"
        />
        <MetricCard
          title="Target Companies"
          value="200+"
          change="+15% yearly"
          icon={BuildingOffice2Icon}
          description="AV companies worldwide"
        />
        <MetricCard
          title="Data Scientists"
          value="25,000+"
          change="+35% yearly"
          icon={UserGroupIcon}
          description="AV engineers globally"
        />
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'market' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AV Market Growth Trajectory</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={marketGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}B`, 'Market Size']} />
                    <Area type="monotone" dataKey="marketSize" stroke="#3B82F6" fill="#EBF4FF" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-semibold text-blue-900 mb-3">Market Drivers</h4>
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Regulatory pressure for AV safety validation</li>
                    <li>• Exponential growth in AV testing data volume</li>
                    <li>• Shift from hardware to software-defined vehicles</li>
                    <li>• Need for edge case discovery at scale</li>
                    <li>• AI/ML advancement enabling semantic search</li>
                  </ul>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="font-semibold text-green-900 mb-3">RareSift Opportunity</h4>
                  <ul className="space-y-2 text-sm text-green-800">
                    <li>• First mover in AV scenario search</li>
                    <li>• Platform-agnostic solution</li>
                    <li>• 15x faster than manual methods</li>
                    <li>• Developer-friendly API integration</li>
                    <li>• Scalable AI-powered architecture</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'competition' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Positioning</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={competitivePositionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="efficiency" fill="#3B82F6" name="Search Efficiency" />
                    <Bar dataKey="satisfaction" fill="#10B981" name="User Satisfaction" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Manual Search</h4>
                  <p className="text-sm text-gray-600 mb-2">Traditional approach used by most teams</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• 2-8 hours per scenario</li>
                    <li>• High error rate</li>
                    <li>• Not scalable</li>
                    <li>• Engineer burnout</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Existing Tools</h4>
                  <p className="text-sm text-yellow-800 mb-2">Scale AI, Voxel51, Supervisely</p>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• General purpose tools</li>
                    <li>• Limited AV domain knowledge</li>
                    <li>• Complex setup required</li>
                    <li>• High ongoing costs</li>
                  </ul>
                </div>

                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-indigo-900 mb-2">RareSift Advantage</h4>
                  <p className="text-sm text-indigo-800 mb-2">Purpose-built for AV scenario discovery</p>
                  <ul className="text-xs text-indigo-700 space-y-1">
                    <li>• 6 minutes per scenario</li>
                    <li>• 90%+ accuracy</li>
                    <li>• Natural language queries</li>
                    <li>• Instant deployment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'traction' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Early Traction Metrics</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={tractionMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="left" type="monotone" dataKey="signups" stroke="#3B82F6" strokeWidth={2} name="Sign-ups" />
                    <Line yAxisId="left" type="monotone" dataKey="pilots" stroke="#10B981" strokeWidth={2} name="Pilot Programs" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">185</div>
                    <div className="text-sm text-gray-600">Total Sign-ups</div>
                    <div className="text-xs text-green-600 mt-1">+57% MoM growth</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">18</div>
                    <div className="text-sm text-gray-600">Active Pilots</div>
                    <div className="text-xs text-green-600 mt-1">$267K ARR</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">92%</div>
                    <div className="text-sm text-gray-600">Pilot → Paid</div>
                    <div className="text-xs text-green-600 mt-1">Industry: ~15%</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3">YC Application Strengths</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                  <div>
                    <strong>Rapid MVP Development:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• Built working product in 6 weeks</li>
                      <li>• Live demo ready for YC partners</li>
                      <li>• Clear customer validation</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Strong Unit Economics:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 10:1 LTV/CAC ratio projected</li>
                      <li>• 85% gross margins</li>
                      <li>• 6-month payback period</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Customer Segments</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={customerSegmentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {customerSegmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Customer Segment Breakdown</h4>
                  <div className="space-y-3">
                    {customerSegmentData.map((segment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: segment.color }}
                          ></div>
                          <div>
                            <div className="font-medium text-sm">{segment.name}</div>
                            <div className="text-xs text-gray-500">{segment.customers} companies</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">{segment.value}%</div>
                          <div className="text-xs text-gray-500">{segment.revenue}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Notable AV Companies</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {avCompanies.map((company, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{company.name}</div>
                          <div className="text-xs text-gray-500">
                            {company.category} • {company.employees} employees
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-green-600">{company.funding}</div>
                          <div className="text-xs text-gray-500">{company.stage}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* YC Pitch Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          🚀 YC Application: The RareSift Opportunity
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <GlobeAltIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Massive Market</h4>
            <p className="text-sm text-gray-600">
              $186B AV market growing 28% annually. Every AV company needs scenario discovery tools.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Strong Traction</h4>
            <p className="text-sm text-gray-600">
              185 sign-ups, 18 active pilots, $267K ARR in 6 months with 92% conversion rate.
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BeakerIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Technical Moat</h4>
            <p className="text-sm text-gray-600">
              First AI-native solution for AV scenarios. 15x faster than manual search.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-lg font-medium text-gray-900 mb-2">
            "RareSift turns hours of manual work into minutes of intelligent search"
          </p>
          <p className="text-sm text-gray-600">
            Ready to capture the $2.8B AV validation tools market with proven product-market fit
          </p>
        </div>
      </div>
    </div>
  )
}