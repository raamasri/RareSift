'use client'

import { useState, useMemo } from 'react'
import { 
  CurrencyDollarIcon,
  UserGroupIcon,
  CloudIcon,
  ChartBarIcon,
  CheckIcon,
  StarIcon,
  BuildingOffice2Icon,
  BeakerIcon,
  TruckIcon,
  GlobeAltIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface PricingTier {
  id: string
  name: string
  description: string
  basePrice: number
  features: string[]
  limits: {
    users: number
    storage: string
    searches: string
    support: string
  }
  popular?: boolean
  enterprise?: boolean
}

interface CompanyProfile {
  id: string
  name: string
  description: string
  teamSize: number
  dataVolume: number
  tier: string
  icon: any
  color: string
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for early-stage AV teams and research projects',
    basePrice: 299,
    features: [
      'Natural language search',
      'Basic video processing',
      'Up to 100GB storage',
      'Email support',
      'Standard search speed',
      'Export to common formats',
      'Basic analytics'
    ],
    limits: {
      users: 3,
      storage: '100GB',
      searches: '1K/month',
      support: 'Email'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing AV companies with active development teams',
    basePrice: 899,
    features: [
      'Everything in Starter',
      'Advanced CLIP models',
      'Batch processing',
      'API access',
      'Priority support',
      'Custom integrations',
      'Advanced analytics',
      'Team collaboration tools',
      'Webhook notifications'
    ],
    limits: {
      users: 15,
      storage: '1TB',
      searches: '10K/month',
      support: 'Priority'
    },
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large-scale AV operations and OEMs',
    basePrice: 2999,
    features: [
      'Everything in Professional',
      'Unlimited searches',
      'Custom model training',
      'On-premise deployment',
      'SLA guarantees',
      'Dedicated support',
      'Custom reporting',
      'SSO integration',
      'White-label options',
      'Advanced security features'
    ],
    limits: {
      users: 100,
      storage: 'Unlimited',
      searches: 'Unlimited',
      support: 'Dedicated'
    },
    enterprise: true
  }
]

const companyProfiles: CompanyProfile[] = [
  {
    id: 'startup',
    name: 'AV Startup',
    description: 'Seed to Series B companies',
    teamSize: 8,
    dataVolume: 500,
    tier: 'starter',
    icon: BeakerIcon,
    color: 'blue'
  },
  {
    id: 'scaleup',
    name: 'Scale-up',
    description: 'Series C+ with active testing',
    teamSize: 25,
    dataVolume: 5000,
    tier: 'professional',
    icon: TruckIcon,
    color: 'green'
  },
  {
    id: 'oem',
    name: 'OEM/Tier 1',
    description: 'Large automotive manufacturers',
    teamSize: 80,
    dataVolume: 50000,
    tier: 'enterprise',
    icon: BuildingOffice2Icon,
    color: 'purple'
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Define your own parameters',
    teamSize: 10,
    dataVolume: 1000,
    tier: 'professional',
    icon: GlobeAltIcon,
    color: 'indigo'
  }
]

export default function PricingCalculator() {
  const [selectedProfile, setSelectedProfile] = useState('scaleup')
  const [selectedTier, setSelectedTier] = useState('professional')
  const [customTeamSize, setCustomTeamSize] = useState(10)
  const [customDataVolume, setCustomDataVolume] = useState(1000)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual')

  const currentProfile = companyProfiles.find(p => p.id === selectedProfile)
  const currentTier = pricingTiers.find(t => t.id === selectedTier)

  const calculatedPricing = useMemo(() => {
    if (!currentTier) return { monthlyPrice: 0, annualPrice: 0, savings: 0 }

    const teamSize = selectedProfile === 'custom' ? customTeamSize : currentProfile?.teamSize || 10
    const dataVolume = selectedProfile === 'custom' ? customDataVolume : currentProfile?.dataVolume || 1000

    // Base price calculation
    let monthlyPrice = currentTier.basePrice

    // Team size multiplier (additional users beyond base tier limits)
    const baseUsers = currentTier.id === 'starter' ? 3 : currentTier.id === 'professional' ? 15 : 100
    if (teamSize > baseUsers && currentTier.id !== 'enterprise') {
      const additionalUsers = teamSize - baseUsers
      const userPrice = currentTier.id === 'starter' ? 49 : 89
      monthlyPrice += additionalUsers * userPrice
    }

    // Data volume multiplier
    const baseDataGB = currentTier.id === 'starter' ? 100 : currentTier.id === 'professional' ? 1000 : 999999
    if (dataVolume > baseDataGB && currentTier.id !== 'enterprise') {
      const additionalData = Math.max(0, dataVolume - baseDataGB)
      const dataPrice = Math.ceil(additionalData / 100) * 29 // $29 per 100GB
      monthlyPrice += dataPrice
    }

    // Annual discount
    const annualPrice = monthlyPrice * 12 * 0.83 // 17% annual discount
    const savings = (monthlyPrice * 12) - annualPrice

    return {
      monthlyPrice,
      annualPrice,
      savings,
      effectiveMonthly: annualPrice / 12
    }
  }, [selectedProfile, selectedTier, customTeamSize, customDataVolume, currentProfile, currentTier])

  const finalPrice = billingCycle === 'annual' ? calculatedPricing.annualPrice : calculatedPricing.monthlyPrice * 12

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
          <CurrencyDollarIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pricing Calculator</h1>
          <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
            Calculate your investment in RareSift based on your team size and data needs
          </p>
        </div>
      </div>

      {/* Company Profile Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Select Your Company Profile</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {companyProfiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfile(profile.id)}
              className={clsx(
                'p-4 rounded-lg border transition-all duration-200 text-left',
                selectedProfile === profile.id
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={clsx(
                  'w-10 h-10 rounded-lg flex items-center justify-center',
                  profile.color === 'blue' ? 'bg-blue-100' :
                  profile.color === 'green' ? 'bg-green-100' :
                  profile.color === 'purple' ? 'bg-purple-100' : 'bg-indigo-100'
                )}>
                  <profile.icon className={clsx(
                    'h-5 w-5',
                    profile.color === 'blue' ? 'text-blue-600' :
                    profile.color === 'green' ? 'text-green-600' :
                    profile.color === 'purple' ? 'text-purple-600' : 'text-indigo-600'
                  )} />
                </div>
                <div>
                  <div className="font-semibold text-sm">{profile.name}</div>
                  <div className="text-xs text-gray-500">{profile.description}</div>
                </div>
              </div>
              
              {profile.id !== 'custom' ? (
                <div className="space-y-1 text-xs text-gray-600">
                  <div>👥 {profile.teamSize} team members</div>
                  <div>💾 {profile.dataVolume}GB data/month</div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Team Size</label>
                    <input
                      type="number"
                      value={customTeamSize}
                      onChange={(e) => setCustomTeamSize(parseInt(e.target.value) || 1)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      min="1"
                      max="200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-gray-700">Data Volume (GB/month)</label>
                    <input
                      type="number"
                      value={customDataVolume}
                      onChange={(e) => setCustomDataVolume(parseInt(e.target.value) || 100)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                      min="100"
                      max="100000"
                    />
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing Tiers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">2. Choose Your Plan</h3>
          
          <div className="flex items-center space-x-3">
            <span className={clsx('text-sm', billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500')}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className={clsx(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                billingCycle === 'annual' ? 'bg-indigo-600' : 'bg-gray-200'
              )}
            >
              <span
                className={clsx(
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                )}
              />
            </button>
            <span className={clsx('text-sm', billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500')}>
              Annual
            </span>
            {billingCycle === 'annual' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                Save 17%
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={clsx(
                'relative rounded-xl border p-6 transition-all duration-200',
                selectedTier === tier.id
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 transform scale-105'
                  : 'border-gray-200 hover:border-gray-300',
                tier.popular ? 'ring-2 ring-indigo-300' : ''
              )}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <StarIcon className="h-3 w-3" />
                    <span>Most Popular</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-gray-900">{tier.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
                
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-900">
                    ${tier.basePrice}
                    <span className="text-lg text-gray-500">/mo</span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="text-sm text-green-600">
                      ${Math.round(tier.basePrice * 12 * 0.83)} billed annually
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-4 w-4 text-gray-400" />
                    <span>{tier.limits.users} users</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CloudIcon className="h-4 w-4 text-gray-400" />
                    <span>{tier.limits.storage}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ChartBarIcon className="h-4 w-4 text-gray-400" />
                    <span>{tier.limits.searches}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="h-4 w-4 text-gray-400" />
                    <span>{tier.limits.support}</span>
                  </div>
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <CheckIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setSelectedTier(tier.id)}
                className={clsx(
                  'w-full py-3 px-4 rounded-lg font-semibold transition-colors',
                  selectedTier === tier.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {selectedTier === tier.id ? 'Selected' : 'Select Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <CurrencyDollarIcon className="h-5 w-5 text-green-600 mr-2" />
          Your Pricing Summary
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Configuration</span>
                <span className="text-sm text-gray-500">
                  {currentProfile?.name} • {currentTier?.name}
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Team Size:</span>
                  <span>{selectedProfile === 'custom' ? customTeamSize : currentProfile?.teamSize} members</span>
                </div>
                <div className="flex justify-between">
                  <span>Data Volume:</span>
                  <span>{selectedProfile === 'custom' ? customDataVolume : currentProfile?.dataVolume}GB/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Billing:</span>
                  <span className="capitalize">{billingCycle}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Base Plan ({currentTier?.name}):</span>
                  <span>${currentTier?.basePrice}/mo</span>
                </div>
                
                {calculatedPricing.monthlyPrice > (currentTier?.basePrice || 0) && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Additional Usage:</span>
                    <span>+${calculatedPricing.monthlyPrice - (currentTier?.basePrice || 0)}/mo</span>
                  </div>
                )}
                
                {billingCycle === 'annual' && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Annual Discount (17%):</span>
                    <span>-${Math.round(calculatedPricing.savings)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 text-center">
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-900">
                ${billingCycle === 'annual' ? Math.round(calculatedPricing.annualPrice) : Math.round(calculatedPricing.monthlyPrice * 12)}
              </div>
              <div className="text-lg text-gray-600">
                {billingCycle === 'annual' ? 'per year' : 'per year (billed monthly)'}
              </div>
              {billingCycle === 'annual' && (
                <div className="text-sm text-green-600 mt-1">
                  ${Math.round(calculatedPricing.effectiveMonthly)}/mo effective
                </div>
              )}
            </div>

            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <div className="flex items-center justify-center space-x-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckIcon className="h-4 w-4 text-green-500" />
                <span>Setup & migration support</span>
              </div>
            </div>

            <button className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-2">
              <span>Start Free Trial</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Why Teams Choose RareSift
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">15x Faster</h4>
            <p className="text-sm text-gray-600">
              Reduce scenario discovery from hours to minutes with AI-powered search
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">85% Cost Savings</h4>
            <p className="text-sm text-gray-600">
              Lower operational costs compared to manual search and general tools
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <SparklesIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">AV-Native</h4>
            <p className="text-sm text-gray-600">
              Purpose-built for autonomous vehicle scenario discovery and validation
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}