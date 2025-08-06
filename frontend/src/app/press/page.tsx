'use client'

import Link from 'next/link'
import { NewspaperIcon, DocumentTextIcon, PhotoIcon } from '@heroicons/react/24/outline'

export default function PressPage() {

  const mediaKit = [
    { name: "Company Logo (PNG)", size: "2.3 MB", type: "Image" },
    { name: "Company Logo (SVG)", size: "45 KB", type: "Vector" },
    { name: "Founder Photos", size: "8.7 MB", type: "Images" },
    { name: "Product Screenshots", size: "12.1 MB", type: "Images" },
    { name: "Company Fact Sheet", size: "156 KB", type: "PDF" },
    { name: "Brand Guidelines", size: "2.8 MB", type: "PDF" }
  ]

  const mediaContact = {
    name: "Raama Srivatsan",
    title: "CEO & Co-founder",
    email: "press@raresift.com",
    phone: "+1 (555) 123-PRESS"
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Press & Media</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Latest news, press releases, and media resources from RareSift
          </p>
        </div>

        {/* Media Contact */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <NewspaperIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Media Contact</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{mediaContact.name}</h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium mb-3">{mediaContact.title}</p>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span>
                  <a href={`mailto:${mediaContact.email}`} className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    {mediaContact.email}
                  </a>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span>
                  <a href={`tel:${mediaContact.phone}`} className="text-blue-600 dark:text-blue-400 hover:underline ml-2">
                    {mediaContact.phone}
                  </a>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Response Times</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <div>• General inquiries: 24 hours</div>
                <div>• Breaking news: 2 hours</div>
                <div>• Interview requests: 48 hours</div>
              </div>
            </div>
          </div>
        </div>


        {/* Media Kit */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <DocumentTextIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Media Kit</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Download logos, photos, and other media assets for press coverage.
            </p>
            <div className="space-y-3">
              {mediaKit.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                      {item.type === 'Image' || item.type === 'Images' ? (
                        <PhotoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <DocumentTextIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{item.size}</div>
                    </div>
                  </div>
                  <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-semibold">
                    Download
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Download Complete Media Kit (ZIP)
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Company Facts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Founded</h3>
                <p className="text-gray-600 dark:text-gray-400">2024</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Headquarters</h3>
                <p className="text-gray-600 dark:text-gray-400">San Francisco, California</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Industry</h3>
                <p className="text-gray-600 dark:text-gray-400">Artificial Intelligence, Autonomous Vehicles</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Mission</h3>
                <p className="text-gray-600 dark:text-gray-400">Transforming autonomous vehicle development through AI-powered scenario discovery</p>
              </div>
            </div>
          </div>
        </div>


        <div className="mt-8 text-center">
          <Link href="/about" className="text-blue-600 dark:text-blue-400 hover:underline mr-4">
            ← Learn More About RareSift
          </Link>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Home →
          </Link>
        </div>
      </div>
    </div>
  )
}