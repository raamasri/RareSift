'use client'

import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { XMarkIcon, BuildingOfficeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { contactAPI, type PricingInquiry } from '@/lib/contact-api'

interface ContactSalesFormProps {
  isOpen: boolean
  onClose: () => void
  selectedPlan?: string
}

export default function ContactSalesForm({ isOpen, onClose, selectedPlan = 'Enterprise' }: ContactSalesFormProps) {
  const [formData, setFormData] = useState<PricingInquiry>({
    name: '',
    email: '',
    company: '',
    plan: selectedPlan,
    data_volume: '',
    team_size: '',
    budget: '',
    timeline: '',
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await contactAPI.submitPricingInquiry(formData)
      setIsSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        name: '',
        email: '',
        company: '',
        plan: selectedPlan,
        data_volume: '',
        team_size: '',
        budget: '',
        timeline: '',
      })
      setIsSuccess(false)
      setError('')
      onClose()
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                {isSuccess ? (
                  // Success State
                  <div className="text-center py-8">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      Enterprise Inquiry Received!
                    </Dialog.Title>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Our sales team will contact you with a custom quote within 4 business hours.
                    </p>
                    <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
                      <p>📧 Quote details sent to {formData.email}</p>
                      <p>📊 Custom pricing for {formData.plan} plan</p>
                      <p>🤝 Dedicated customer success manager assigned</p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-medium transition-colors"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  // Form State
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        <Dialog.Title className="text-xl font-semibold text-gray-900 dark:text-white">
                          Contact Sales - {formData.plan} Plan
                        </Dialog.Title>
                      </div>
                      <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      Get a custom quote tailored to your organization's needs. 
                      Our enterprise plans include volume discounts, dedicated support, and custom integrations.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Full Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            placeholder="John Doe"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Work Email *
                          </label>
                          <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                            placeholder="john@company.com"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Company *
                        </label>
                        <input
                          type="text"
                          name="company"
                          required
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          placeholder="Your Company"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Team Size *
                          </label>
                          <select
                            name="team_size"
                            required
                            value={formData.team_size}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">Select team size</option>
                            <option value="10-25">10-25 people</option>
                            <option value="25-50">25-50 people</option>
                            <option value="50-100">50-100 people</option>
                            <option value="100-500">100-500 people</option>
                            <option value="500+">500+ people</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Data Volume *
                          </label>
                          <select
                            name="data_volume"
                            required
                            value={formData.data_volume}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">Select data volume</option>
                            <option value="10-50TB">10-50TB</option>
                            <option value="50-100TB">50-100TB</option>
                            <option value="100-500TB">100-500TB</option>
                            <option value="500TB-1PB">500TB-1PB</option>
                            <option value="1PB+">1PB+</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Budget Range
                          </label>
                          <select
                            name="budget"
                            value={formData.budget}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">Select budget range</option>
                            <option value="$10K-25K">$10K-25K annually</option>
                            <option value="$25K-50K">$25K-50K annually</option>
                            <option value="$50K-100K">$50K-100K annually</option>
                            <option value="$100K+">$100K+ annually</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Implementation Timeline
                          </label>
                          <select
                            name="timeline"
                            value={formData.timeline}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">Select timeline</option>
                            <option value="ASAP">ASAP (within 2 weeks)</option>
                            <option value="1-2 months">1-2 months</option>
                            <option value="3-6 months">3-6 months</option>
                            <option value="6+ months">6+ months</option>
                          </select>
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                      )}

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Enterprise Benefits Include:</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                          <li>• Volume pricing discounts (up to 40% off)</li>
                          <li>• Dedicated customer success manager</li>
                          <li>• Custom integrations and API limits</li>
                          <li>• On-premise deployment options</li>
                          <li>• SLA guarantees and priority support</li>
                        </ul>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? 'Submitting...' : 'Get Custom Quote'}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}