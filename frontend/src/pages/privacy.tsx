/**
 * Privacy Policy Page
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Shield } from 'lucide-react'
import Footer from '../components/Footer'

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
            <Link
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center mb-2">
              <Shield className="w-6 h-6 text-indigo-600 mr-3" />
              <p className="text-sm text-gray-600">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-900 font-medium">
                📝 <strong>Important Notice:</strong> Privacy Policy is currently being finalized. 
                Use the ChatGPT prompt provided in <code>CHATGPT_LEGAL_PROMPTS.md</code> to generate 
                complete Privacy Policy according to DPDP Act 2023 and Indian law.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700">
                At RateMyProf India, we take your privacy seriously. This Privacy Policy explains how we 
                collect, use, and protect your personal data in compliance with the Digital Personal Data 
                Protection Act 2023 (DPDP Act) and other Indian laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Account Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Email address (required for account creation)</li>
                <li>Full name</li>
                <li>University/college affiliation</li>
                <li>Student verification status</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Professor reviews and ratings</li>
                <li>Course information</li>
                <li>Anonymous display names (if chosen)</li>
                <li>Review votes and flags</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Data</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>IP addresses</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Usage analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Data</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Display reviews to help students make informed decisions</li>
                <li>Moderate content for quality and appropriateness</li>
                <li>Prevent spam and abuse</li>
                <li>Improve platform functionality</li>
                <li>Send important notifications</li>
                <li>Analytics to understand usage patterns</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing</h2>
              <p className="text-gray-700 mb-3">
                <strong>We DO NOT sell your data.</strong> We only share data with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Supabase (database hosting provider)</li>
                <li>Railway/Vercel (hosting providers)</li>
                <li>Sentry (error monitoring, anonymized)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights (DPDP Act 2023)</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Right to access your data</li>
                <li>Right to correction of inaccurate data</li>
                <li>Right to erasure/deletion</li>
                <li>Right to data portability</li>
                <li>Right to grievance redressal</li>
                <li>Right to appeal moderation decisions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Anonymity</h2>
              <p className="text-gray-700">
                Reviews are anonymous by default. Your identity will never be publicly displayed on 
                anonymous reviews. Administrators can see review authors for moderation purposes only.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Active accounts: Data kept while account is active</li>
                <li>Deleted accounts: Data anonymized within 30 days</li>
                <li>Reviews: Kept (anonymized) even after account deletion</li>
                <li>Logs: Kept for 90 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Security</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Encrypted connections (HTTPS/SSL)</li>
                <li>Encrypted database storage</li>
                <li>Row-level security policies</li>
                <li>Regular security audits</li>
                <li>Automated backup systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-700">
                For privacy-related questions or to exercise your rights, please <Link href="/contact" className="text-indigo-600 hover:underline">contact us</Link>.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link
              href="/guidelines"
              className="text-indigo-600 hover:text-indigo-800 font-medium"
            >
              ← Back to Community Guidelines
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
