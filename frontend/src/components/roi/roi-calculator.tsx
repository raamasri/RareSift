'use client'

import { useState, useMemo } from 'react'
import { 
  CalculatorIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

interface ROIInputs {
  teamSize: number
  avgHourlyRate: number
  hoursPerScenario: number
  scenariosPerMonth: number
  dataVolumeGB: number
}

interface ROIResults {
  monthlyTimeSaved: number
  monthlyCostSavings: number
  annualSavings: number
  productivityGain: number
  raresiftCost: number
  netSavings: number
  roiPercentage: number
  paybackPeriod: number
}

const RARESIFT_PRICING = {
  base: 5000, // Base price for small teams
  perGB: 50,  // Price per GB of data processed
  enterprise: 25000 // Enterprise tier
}

export default function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputs>({
    teamSize: 5,
    avgHourlyRate: 125,
    hoursPerScenario: 2.5,
    scenariosPerMonth: 40,
    dataVolumeGB: 500
  })

  const [selectedPreset, setSelectedPreset] = useState<string>('startup')

  const presets = {
    startup: {
      name: 'AV Startup',
      description: 'Small team, growing dataset',
      teamSize: 3,
      avgHourlyRate: 120,
      hoursPerScenario: 3,
      scenariosPerMonth: 25,
      dataVolumeGB: 200
    },
    scale: {
      name: 'Scale-up',
      description: 'Mid-size team, regular operations',
      teamSize: 8,
      avgHourlyRate: 130,
      hoursPerScenario: 2.5,
      scenariosPerMonth: 60,
      dataVolumeGB: 800
    },
    enterprise: {
      name: 'Enterprise OEM',
      description: 'Large team, massive datasets',
      teamSize: 25,
      avgHourlyRate: 140,
      hoursPerScenario: 2,
      scenariosPerMonth: 200,
      dataVolumeGB: 5000
    }
  }

  const calculateROI = useMemo((): ROIResults => {
    const { teamSize, avgHourlyRate, hoursPerScenario, scenariosPerMonth, dataVolumeGB } = inputs

    // Current manual process
    const monthlyTimeSaved = scenariosPerMonth * (hoursPerScenario - 0.1) // RareSift reduces to ~6 minutes per scenario
    const monthlyCostSavings = monthlyTimeSaved * avgHourlyRate
    const annualSavings = monthlyCostSavings * 12

    // Productivity calculation
    const currentProductivity = scenariosPerMonth
    const raresiftProductivity = scenariosPerMonth * 15 // 15x faster scenario discovery
    const productivityGain = ((raresiftProductivity - currentProductivity) / currentProductivity) * 100

    // RareSift pricing
    let raresiftCost: number
    if (dataVolumeGB < 100) {
      raresiftCost = RARESIFT_PRICING.base
    } else if (dataVolumeGB < 2000) {
      raresiftCost = RARESIFT_PRICING.base + (dataVolumeGB * RARESIFT_PRICING.perGB)
    } else {
      raresiftCost = RARESIFT_PRICING.enterprise
    }

    const annualRaresiftCost = raresiftCost * 12
    const netSavings = annualSavings - annualRaresiftCost
    const roiPercentage = (netSavings / annualRaresiftCost) * 100
    const paybackPeriod = annualRaresiftCost / monthlyCostSavings

    return {
      monthlyTimeSaved,
      monthlyCostSavings,
      annualSavings,
      productivityGain,
      raresiftCost,
      netSavings,
      roiPercentage,
      paybackPeriod
    }
  }, [inputs])

  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey)
    setInputs(presets[presetKey as keyof typeof presets])
  }

  const updateInput = (field: keyof ROIInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }))
    setSelectedPreset('custom')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg animate-float">
          <CalculatorIcon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ROI Calculator</h1>
          <p className="text-lg text-gray-600 mt-2 max-w-2xl mx-auto">
            See how much time and money RareSift can save your AV team
          </p>
        </div>
      </div>

      {/* Company Type Presets */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Company Type</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={clsx(
                'p-4 rounded-lg border-2 text-left transition-all duration-200',
                selectedPreset === key
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <h4 className="font-semibold text-gray-900">{preset.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
              <div className="mt-2 text-xs text-gray-500">
                {preset.teamSize} engineers • {preset.dataVolumeGB}GB data
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Parameters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Team Parameters</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team Size (Engineers)
              </label>
              <input
                type="number"
                value={inputs.teamSize}
                onChange={(e) => updateInput('teamSize', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="1"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Hourly Rate ($)
              </label>
              <input
                type="number"
                value={inputs.avgHourlyRate}
                onChange={(e) => updateInput('avgHourlyRate', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="50"
                max="300"
              />
              <p className="text-xs text-gray-500 mt-1">Including benefits, typically $100-150 for AV engineers</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hours per Scenario (Manual)
              </label>
              <input
                type="number"
                step="0.5"
                value={inputs.hoursPerScenario}
                onChange={(e) => updateInput('hoursPerScenario', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="0.5"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">Time to manually find one specific scenario</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scenarios Needed per Month
              </label>
              <input
                type="number"
                value={inputs.scenariosPerMonth}
                onChange={(e) => updateInput('scenariosPerMonth', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="5"
                max="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Volume (GB per month)
              </label>
              <input
                type="number"
                value={inputs.dataVolumeGB}
                onChange={(e) => updateInput('dataVolumeGB', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                min="10"
                max="10000"
              />
            </div>
          </div>
        </div>

        {/* ROI Results */}
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI Summary</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {calculateROI.roiPercentage.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Annual ROI</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {calculateROI.paybackPeriod.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Months to Payback</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Time Saved</span>
                <span className="font-semibold">{calculateROI.monthlyTimeSaved.toFixed(0)} hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Monthly Cost Savings</span>
                <span className="font-semibold text-green-600">
                  ${calculateROI.monthlyCostSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Annual Savings</span>
                <span className="font-semibold text-green-600">
                  ${calculateROI.annualSavings.toLocaleString()}
                </span>
              </div>
              <div className="border-t border-green-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">RareSift Annual Cost</span>
                  <span className="font-semibold">
                    ${(calculateROI.raresiftCost * 12).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-medium text-gray-900">Net Annual Savings</span>
                  <span className="font-bold text-green-600 text-lg">
                    ${calculateROI.netSavings.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Productivity Gains */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <ArrowTrendingUpIcon className="h-5 w-5 text-indigo-600 mr-2" />
              Productivity Impact
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Current Process</div>
                  <div className="text-sm text-gray-600">Manual scenario discovery</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{inputs.scenariosPerMonth}/month</div>
                  <div className="text-sm text-gray-500">scenarios found</div>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">With RareSift</div>
                  <div className="text-sm text-gray-600">AI-powered discovery</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-indigo-600">
                    {(inputs.scenariosPerMonth * 15).toLocaleString()}/month
                  </div>
                  <div className="text-sm text-indigo-500">scenarios found</div>
                </div>
              </div>

              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-bold text-green-600 text-lg">
                  {calculateROI.productivityGain.toFixed(0)}% Productivity Increase
                </div>
                <div className="text-sm text-gray-600">More scenarios discovered per engineer</div>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Additional Benefits</h4>
            <div className="space-y-3">
              {[
                'Faster model training iteration cycles',
                'Better edge case coverage for safety testing',
                'Reduced manual data scientist workload',
                'Improved simulation scenario quality',
                'Accelerated time-to-market for AV features'
              ].map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-8 text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Ready to Save ${calculateROI.netSavings.toLocaleString()} Annually?
        </h3>
        <p className="text-gray-600 mb-6">
          Start with a free pilot to validate these projections with your actual data
        </p>
        <div className="flex justify-center space-x-4">
          <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Schedule Demo
          </button>
          <button className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
            Start Free Trial
          </button>
        </div>
      </div>
    </div>
  )
}