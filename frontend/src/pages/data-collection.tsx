/**
 * Data Collection Notice Page (India-specific)
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Database } from 'lucide-react'
import Footer from '../components/Footer'

export default function DataCollectionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
                <Home className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Data Collection Notice</h1>
            </div>
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="flex items-center mb-6">
            <Database className="w-6 h-6 text-indigo-600 mr-3" />
            <p className="text-sm text-gray-600">
              DPDP Act 2023 Compliant | Last Updated: {new Date().toLocaleDateString('en-IN')}
            </p>
          </div>

          <div className="prose prose-gray max-w-none space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Notice to Indian Users</h3>
              <p className="text-sm text-blue-800">
                This notice is provided under the Digital Personal Data Protection Act, 2023 (DPDP Act) 
                to inform you about the personal data we collect and how we use it.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What We Collect</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Email address</li>
                    <li>Name</li>
                    <li>University/College affiliation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Review Data</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>Professor reviews and ratings</li>
                    <li>Course information</li>
                    <li>Votes and flags</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Technical Data</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
                    <li>IP address</li>
                    <li>Browser and device information</li>
                    <li>Usage patterns</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Why We Collect It</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide and improve our platform</li>
                <li>Display reviews to help students</li>
                <li>Moderate content for quality and safety</li>
                <li>Prevent spam and abuse</li>
                <li>Communicate important updates</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-700 mb-3">Under DPDP Act 2023, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Data portability</li>
                <li>Grievance redressal</li>
              </ul>
              <p className="text-gray-700 mt-4">
                To exercise these rights, <Link href="/contact" className="text-indigo-600 hover:underline">contact us</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Storage</h2>
              <p className="text-gray-700">
                Your data is stored securely using Supabase (PostgreSQL database) with servers in India/Singapore. 
                We use encryption and follow industry best practices for data security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Account data: While account is active</li>
                <li>Deleted accounts: Anonymized within 30 days</li>
                <li>Reviews: Kept (anonymized) for platform integrity</li>
                <li>Logs: 90 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-700">
                For questions about data collection or to exercise your rights:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-3">
                <p className="text-sm text-gray-900">
                  <strong>Email:</strong> privacy@ratemyprof.in<br />
                  <strong>Grievance Officer:</strong> grievance@ratemyprof.in<br />
                  <strong>Response Time:</strong> 24-48 hours
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/privacy" className="text-indigo-600 hover:text-indigo-800 font-medium">
              Read Full Privacy Policy →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
