'use client'

import Link from 'next/link'

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            By accessing and using RareSift's AI-powered video search platform ("Service"), 
            you accept and agree to be bound by the terms and provision of this agreement. 
            If you do not agree to abide by the above, please do not use this service.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">2. Description of Service</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            RareSift provides an AI-powered platform for autonomous vehicle teams to search 
            driving scenarios using natural language queries. Our services include:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Video upload and processing capabilities</li>
            <li>AI-powered semantic search of video content</li>
            <li>Frame extraction and embedding generation</li>
            <li>Export and analysis tools</li>
            <li>API access for integration</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">3. User Accounts and Registration</h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              To access certain features of the Service, you must register for an account. 
              You agree to provide accurate, current, and complete information during registration.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account.
            </p>
            <p>
              You must notify us immediately of any unauthorized use of your account or any 
              other breach of security.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">4. Acceptable Use Policy</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            You agree not to use the Service to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Upload content that violates any laws or regulations</li>
            <li>Infringe upon the rights of others, including privacy and intellectual property</li>
            <li>Upload malicious software or attempt to compromise system security</li>
            <li>Use the Service for any illegal or unauthorized purpose</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Attempt to gain unauthorized access to other accounts or systems</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">5. Content and Data</h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Your Content</h3>
              <p>
                You retain ownership of all content you upload to the Service. By uploading content, 
                you grant us a limited license to process, analyze, and store your content to provide 
                the Service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Data Processing</h3>
              <p>
                We may process your video content using AI and machine learning technologies to 
                generate embeddings, extract frames, and enable search functionality.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Data Security</h3>
              <p>
                We implement industry-standard security measures to protect your data. However, 
                no system is completely secure, and we cannot guarantee absolute security.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">6. Payment and Billing</h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Certain features of the Service require payment. By subscribing to a paid plan, 
              you agree to pay all charges associated with your account.
            </p>
            <p>
              Payments are processed securely through third-party payment processors. 
              We do not store your payment information.
            </p>
            <p>
              Subscription fees are billed in advance and are non-refundable except as 
              required by law or as otherwise specified in our refund policy.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">7. Service Availability</h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              We strive to maintain high service availability but do not guarantee uninterrupted access. 
              The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
            </p>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service 
              at any time with or without notice.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">8. Intellectual Property</h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              The Service and its original content, features, and functionality are owned by 
              RareSift and are protected by international copyright, trademark, and other 
              intellectual property laws.
            </p>
            <p>
              You may not reproduce, distribute, modify, or create derivative works of our 
              intellectual property without explicit written permission.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">9. Limitation of Liability</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, RARESIFT SHALL NOT BE LIABLE FOR ANY 
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING 
            BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, 
            RESULTING FROM YOUR USE OF THE SERVICE.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">10. Termination</h2>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
            <p>
              Either party may terminate this agreement at any time. We may suspend or 
              terminate your account if you violate these terms.
            </p>
            <p>
              Upon termination, your right to use the Service will cease immediately. 
              We may retain certain data as required by law or for legitimate business purposes.
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">11. Governing Law</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            These terms shall be governed by and construed in accordance with the laws of 
            the State of California, United States, without regard to its conflict of law provisions.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">12. Changes to Terms</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We reserve the right to modify these terms at any time. We will notify users of 
            any material changes by posting the updated terms on this page and updating the 
            "Last updated" date.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">13. Contact Information</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <div className="mt-4 text-sm">
            <p className="text-gray-900 dark:text-white"><strong>Email:</strong> legal@raresift.com</p>
            <p className="text-gray-900 dark:text-white"><strong>Address:</strong> RareSift Inc., 123 AI Street, San Francisco, CA 94105</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/app" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Application
          </Link>
        </div>
      </div>
    </div>
  )
}