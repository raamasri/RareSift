'use client'

import Link from 'next/link'
import { ClipboardDocumentCheckIcon, ShieldCheckIcon, DocumentTextIcon, GlobeAltIcon, BuildingOfficeIcon, ScaleIcon } from '@heroicons/react/24/outline'

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Compliance</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Meeting the highest standards for data protection, security, and regulatory compliance in the autonomous vehicle industry
          </p>
        </div>

        {/* Compliance Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <ClipboardDocumentCheckIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Compliance Framework</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            RareSift maintains compliance with international standards and regulations to ensure the highest level of data protection, 
            security, and operational integrity for autonomous vehicle development teams worldwide.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">SOC 2 Type II</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Certified</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">ISO 27001</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Certified</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <GlobeAltIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">GDPR</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Compliant</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ScaleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">CCPA</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">Compliant</p>
              </div>
            </div>
          </div>
        </div>

        {/* International Standards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">SOC 2 Type II</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Trust Service Criteria</h3>
                  <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">Certified</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Our SOC 2 Type II audit validates the effectiveness of our security controls over time.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li><strong>Security:</strong> Protection against unauthorized access</li>
                  <li><strong>Availability:</strong> System operational availability</li>
                  <li><strong>Processing Integrity:</strong> Complete and accurate processing</li>
                  <li><strong>Confidentiality:</strong> Information designated as confidential is protected</li>
                  <li><strong>Privacy:</strong> Personal information collection, use, and disposal</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Audit Details</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div><strong>Last Audit:</strong> December 2024</div>
                  <div><strong>Next Audit:</strong> December 2025</div>
                  <div><strong>Auditor:</strong> Deloitte & Touche LLP</div>
                  <div><strong>Report Period:</strong> 12 months</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">ISO 27001</h2>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Information Security Management</h3>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">Certified</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  ISO 27001 certification demonstrates our commitment to information security management best practices.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Information security policies and procedures</li>
                  <li>Risk assessment and treatment</li>
                  <li>Asset management and classification</li>
                  <li>Access control and user management</li>
                  <li>Incident response and business continuity</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Certification Details</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div><strong>Certification Date:</strong> January 2024</div>
                  <div><strong>Valid Until:</strong> January 2027</div>
                  <div><strong>Certification Body:</strong> BSI Group</div>
                  <div><strong>Certificate Number:</strong> ISO/IEC 27001:2022</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Protection Regulations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <GlobeAltIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Data Protection Regulations</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GDPR (EU)</h3>
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">Compliant</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Full compliance with the European Union's General Data Protection Regulation.
                </p>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Data Subject Rights</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <li>Right to access personal data</li>
                  <li>Right to rectification of inaccurate data</li>
                  <li>Right to erasure ("right to be forgotten")</li>
                  <li>Right to data portability</li>
                  <li>Right to restrict processing</li>
                  <li>Right to object to processing</li>
                </ul>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Compliance Measures</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Appointed Data Protection Officer (DPO)</li>
                  <li>Privacy by design implementation</li>
                  <li>Regular privacy impact assessments</li>
                  <li>72-hour breach notification procedures</li>
                  <li>Consent management systems</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CCPA (California)</h3>
                  <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded-full">Compliant</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Compliance with the California Consumer Privacy Act and CPRA amendments.
                </p>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Consumer Rights</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <li>Right to know what personal information is collected</li>
                  <li>Right to delete personal information</li>
                  <li>Right to opt-out of the sale of personal information</li>
                  <li>Right to non-discrimination for exercising privacy rights</li>
                  <li>Right to correct inaccurate personal information</li>
                </ul>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Implementation</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Consumer request portal</li>
                  <li>Automated data discovery and mapping</li>
                  <li>Vendor assessment program</li>
                  <li>Privacy policy transparency</li>
                  <li>Staff training and awareness programs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Industry Standards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <BuildingOfficeIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Industry-Specific Standards</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Automotive Standards</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>ISO 26262:</strong> Functional Safety for Road Vehicles</li>
                <li><strong>ISO 21448:</strong> Safety of the Intended Functionality (SOTIF)</li>
                <li><strong>SAE J3016:</strong> Taxonomy of Driving Automation</li>
                <li><strong>NHTSA Guidelines:</strong> AV Policy Framework</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">AI/ML Standards</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>ISO/IEC 23053:</strong> AI Risk Management</li>
                <li><strong>IEEE 2857:</strong> AI Engineering Standards</li>
                <li><strong>NIST AI RMF:</strong> AI Risk Management Framework</li>
                <li><strong>Explainable AI:</strong> Model transparency requirements</li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 border border-green-200 dark:border-green-600">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Cloud Security</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>CSA CCM:</strong> Cloud Controls Matrix</li>
                <li><strong>FedRAMP:</strong> Federal Risk Authorization</li>
                <li><strong>NIST CSF:</strong> Cybersecurity Framework</li>
                <li><strong>Cloud Native Security:</strong> Container and K8s security</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Compliance Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Continuous Monitoring</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Automated Compliance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Real-time compliance monitoring and automated reporting for all regulatory requirements.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Continuous control monitoring</li>
                  <li>Automated compliance reporting</li>
                  <li>Policy compliance validation</li>
                  <li>Risk assessment automation</li>
                  <li>Audit trail maintenance</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Regular Assessments</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div><strong>Internal Audits:</strong> Monthly</div>
                  <div><strong>External Audits:</strong> Annually</div>
                  <div><strong>Penetration Testing:</strong> Quarterly</div>
                  <div><strong>Compliance Review:</strong> Bi-annually</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ScaleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Legal & Regulatory</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Global Compliance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Staying current with evolving regulations across all jurisdictions where we operate.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Regulatory change monitoring</li>
                  <li>Legal counsel consultation</li>
                  <li>Cross-border data transfer compliance</li>
                  <li>Local data residency requirements</li>
                  <li>Industry best practice adoption</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Contact Information</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div><strong>Compliance Officer:</strong> compliance@raresift.com</div>
                  <div><strong>DPO (GDPR):</strong> dpo@raresift.com</div>
                  <div><strong>Legal Team:</strong> legal@raresift.com</div>
                  <div><strong>Privacy Requests:</strong> privacy@raresift.com</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificates & Reports */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-700 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">📋 Compliance Documentation</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Access our latest compliance certificates, audit reports, and documentation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/documents/soc2-report-2024.pdf" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow group">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-green-600 dark:text-green-400 group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">SOC 2 Report</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Type II - 2024</p>
                </div>
              </div>
            </a>
            <a href="/documents/iso27001-certificate-2024.pdf" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow group">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">ISO 27001 Certificate</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Valid 2024-2027</p>
                </div>
              </div>
            </a>
            <a href="/documents/gdpr-compliance-2024.pdf" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow group">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">GDPR Assessment</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">2024 Review</p>
                </div>
              </div>
            </a>
            <a href="/documents/pentest-report-2024.pdf" className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow group">
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Penetration Test</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Q4 2024</p>
                </div>
              </div>
            </a>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            * Some documents may require NDA or be available only to enterprise customers
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/security" className="text-blue-600 dark:text-blue-400 hover:underline mr-4">
            ← View Security Information
          </Link>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Back to Home →
          </Link>
        </div>
      </div>
    </div>
  )
}