'use client'

import Link from 'next/link'
import { ShieldCheckIcon, LockClosedIcon, KeyIcon, ServerIcon, ExclamationTriangleIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Security</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Enterprise-grade security measures protecting your data and ensuring platform integrity
          </p>
        </div>

        {/* Security Overview */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl border border-green-200 dark:border-green-700 p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Security First Approach</h2>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            RareSift implements industry-leading security practices to protect sensitive autonomous vehicle data. 
            Our platform is designed with security at its core, ensuring your video data and AI models remain secure.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <LockClosedIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">End-to-End Encryption</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <KeyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">API Key Management</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ServerIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Secure Infrastructure</h3>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mx-auto mb-2">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Compliance Standards</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Data Security */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <LockClosedIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Data Protection</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Encryption at Rest</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  All video files and extracted frames are encrypted using AES-256 encryption when stored in our secure cloud infrastructure.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>AES-256 encryption for all stored data</li>
                  <li>Separate encryption keys per customer</li>
                  <li>Automated key rotation every 90 days</li>
                  <li>Hardware Security Module (HSM) key storage</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Encryption in Transit</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  All data transmission is secured using TLS 1.3 with perfect forward secrecy.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>TLS 1.3 for all API communications</li>
                  <li>Certificate pinning for mobile apps</li>
                  <li>End-to-end encryption for file uploads</li>
                  <li>Perfect forward secrecy</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <KeyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Access Control</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Authentication</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Multi-layered authentication system with API keys, JWT tokens, and optional multi-factor authentication.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>API key authentication for programmatic access</li>
                  <li>JWT tokens with configurable expiration</li>
                  <li>Optional multi-factor authentication (MFA)</li>
                  <li>SSO integration (SAML, OIDC)</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Authorization</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Role-based access control with granular permissions and team management.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Role-based access control (RBAC)</li>
                  <li>Granular permission system</li>
                  <li>Team-based data isolation</li>
                  <li>Admin audit trails</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure Security */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <ServerIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Infrastructure Security</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Cloud Security</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>AWS/GCP enterprise security controls</li>
                <li>VPC isolation with private subnets</li>
                <li>Network access control lists (ACLs)</li>
                <li>Web application firewall (WAF)</li>
                <li>DDoS protection and rate limiting</li>
                <li>Intrusion detection systems (IDS)</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Container Security</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Docker containers with minimal attack surface</li>
                <li>Non-root container execution</li>
                <li>Read-only file systems</li>
                <li>Security policy enforcement</li>
                <li>Continuous vulnerability scanning</li>
                <li>Image signing and verification</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Database Security</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Encrypted PostgreSQL instances</li>
                <li>Database connection encryption</li>
                <li>Automated security patching</li>
                <li>Regular security assessments</li>
                <li>Backup encryption and integrity checks</li>
                <li>Point-in-time recovery capabilities</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Monitoring */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security Monitoring</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-time Monitoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  24/7 security operations center (SOC) monitoring all platform activities and potential threats.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Real-time threat detection</li>
                  <li>Anomaly detection using machine learning</li>
                  <li>Automated incident response</li>
                  <li>Security event correlation</li>
                  <li>24/7 SOC monitoring</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Audit Logging</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Comprehensive audit trail logging</li>
                  <li>Tamper-proof log storage</li>
                  <li>Log retention for compliance</li>
                  <li>SIEM integration capabilities</li>
                  <li>Regular security reviews</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Security Testing</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Continuous Testing</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Regular security assessments and penetration testing to identify and address vulnerabilities.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Automated security scanning</li>
                  <li>Third-party penetration testing</li>
                  <li>Code security analysis (SAST/DAST)</li>
                  <li>Dependency vulnerability scanning</li>
                  <li>Regular security assessments</li>
                </ul>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Security Audits</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li>Annual third-party security audits</li>
                  <li>SOC 2 Type II compliance audits</li>
                  <li>ISO 27001 certification maintenance</li>
                  <li>Continuous compliance monitoring</li>
                  <li>Security control effectiveness testing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Incident Response */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">🚨 Security Incident Response</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Response Process</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li><strong>Detection:</strong> Automated monitoring identifies potential incidents</li>
                <li><strong>Analysis:</strong> Security team evaluates severity and impact</li>
                <li><strong>Containment:</strong> Immediate actions to prevent further damage</li>
                <li><strong>Communication:</strong> Customer notification within 24 hours</li>
                <li><strong>Resolution:</strong> Full remediation and security enhancement</li>
                <li><strong>Post-Incident:</strong> Detailed report and lessons learned</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Contact Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-white">Security Team:</span>
                  <a href="mailto:security@raresift.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                    security@raresift.com
                  </a>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-white">Emergency:</span>
                  <a href="tel:+1-555-SECURITY" className="text-blue-600 dark:text-blue-400 hover:underline">
                    +1 (555) SECURITY
                  </a>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-3">
                  We maintain a 4-hour response time for critical security incidents and provide regular updates throughout the resolution process.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Certifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🏆 Security Certifications & Compliance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-700">
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-2">SOC 2 Type II</h3>
              <p className="text-xs text-blue-700 dark:text-blue-400">Security, Availability & Confidentiality</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 text-center border border-green-200 dark:border-green-700">
              <h3 className="font-bold text-green-900 dark:text-green-300 mb-2">ISO 27001</h3>
              <p className="text-xs text-green-700 dark:text-green-400">Information Security Management</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 text-center border border-purple-200 dark:border-purple-700">
              <h3 className="font-bold text-purple-900 dark:text-purple-300 mb-2">GDPR</h3>
              <p className="text-xs text-purple-700 dark:text-purple-400">General Data Protection Regulation</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 text-center border border-orange-200 dark:border-orange-700">
              <h3 className="font-bold text-orange-900 dark:text-orange-300 mb-2">CCPA</h3>
              <p className="text-xs text-orange-700 dark:text-orange-400">California Consumer Privacy Act</p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">💡 Security Best Practices for Users</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">API Key Management</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Store API keys securely (never in code repositories)</li>
                <li>Use environment variables or secure key management systems</li>
                <li>Rotate API keys regularly (recommended: every 90 days)</li>
                <li>Use different keys for different environments</li>
                <li>Monitor API key usage and revoke unused keys</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Data Security</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Use HTTPS for all API communications</li>
                <li>Validate and sanitize all input data</li>
                <li>Implement proper error handling</li>
                <li>Log security-relevant events</li>
                <li>Keep client applications updated</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/compliance" className="text-blue-600 dark:text-blue-400 hover:underline mr-4">
            View Compliance Information →
          </Link>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}