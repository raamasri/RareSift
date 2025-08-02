'use client'

import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">1. Information We Collect</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Personal Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We collect information you provide directly to us, such as when you create an account, 
                use our services, or contact us for support. This may include:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Email address and account credentials</li>
                <li>Name and company information</li>
                <li>Payment and billing information</li>
                <li>Communication preferences</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Usage Data</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                We automatically collect information about how you use our service, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Search queries and results</li>
                <li>Video upload and processing data</li>
                <li>Device and browser information</li>
                <li>IP address and location data</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">2. How We Use Your Information</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We use the information we collect to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Provide, maintain, and improve our AI-powered video search services</li>
            <li>Process video uploads and generate search embeddings</li>
            <li>Respond to your requests and provide customer support</li>
            <li>Send administrative and marketing communications</li>
            <li>Ensure security and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">3. Information Sharing and Disclosure</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            We do not sell, trade, or otherwise transfer your personal information to third parties except:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>With your explicit consent</li>
            <li>To service providers who assist in our operations</li>
            <li>When required by law or to protect our rights</li>
            <li>In connection with a business transfer or acquisition</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">4. Data Security</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We implement appropriate security measures to protect your personal information against 
            unauthorized access, alteration, disclosure, or destruction. This includes encryption, 
            secure data storage, and regular security assessments.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">5. Your Rights (GDPR/CCPA)</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Depending on your location, you may have the following rights:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li><strong>Access:</strong> Request access to your personal data</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your personal data</li>
            <li><strong>Portability:</strong> Request export of your data</li>
            <li><strong>Opt-out:</strong> Opt out of the sale of personal information</li>
          </ul>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            To exercise these rights, contact us at privacy@raresift.com or use our <Link href="/api/v1/gdpr/my-data" className="text-blue-600 dark:text-blue-400 underline">GDPR portal</Link>.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">6. Cookies and Tracking</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We use cookies and similar technologies to enhance your experience, analyze usage, 
            and provide personalized content. You can control cookie preferences through your 
            browser settings or our cookie consent banner.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">7. Data Retention</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We retain your personal information for as long as necessary to provide our services 
            and comply with legal obligations. Video data and search history may be retained for 
            service improvement purposes unless you request deletion.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">8. Children's Privacy</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Our services are not intended for children under 13. We do not knowingly collect 
            personal information from children under 13. If you believe we have collected such 
            information, please contact us immediately.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">9. Changes to This Policy</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            We may update this privacy policy from time to time. We will notify you of any 
            material changes by posting the new policy on this page and updating the 
            "Last updated" date.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">10. Contact Us</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            If you have any questions about this privacy policy or our data practices, 
            please contact us at:
          </p>
          <div className="mt-4 text-sm">
            <p className="text-gray-900 dark:text-white"><strong>Email:</strong> privacy@raresift.com</p>
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