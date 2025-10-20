/**
 * Terms & Conditions Page
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, FileText } from 'lucide-react'
import Footer from '../components/Footer'

export default function TermsPage() {
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
              <h1 className="text-2xl font-bold text-gray-900">Terms & Conditions</h1>
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
              <FileText className="w-6 h-6 text-indigo-600 mr-3" />
              <p className="text-sm text-gray-600">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-sm text-blue-900 font-medium">
                📝 <strong>Important Notice:</strong> Terms & Conditions are currently being finalized. 
                Use the ChatGPT prompt provided in <code>CHATGPT_LEGAL_PROMPTS.md</code> to generate 
                complete Terms of Service according to Indian law.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-700">
                Welcome to RateMyProf India. By accessing and using this platform, you agree to be bound 
                by these Terms & Conditions. Please read them carefully.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceptance of Terms</h2>
              <p className="text-gray-700">
                By creating an account, posting reviews, or using any features of RateMyProf India, 
                you acknowledge that you have read, understood, and agree to these Terms & Conditions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide accurate and honest reviews based on actual educational experience</li>
                <li>Follow our <Link href="/guidelines" className="text-indigo-600 hover:underline">Community Guidelines</Link></li>
                <li>Maintain respectful discourse and academic integrity</li>
                <li>Not engage in harassment, discrimination, or hate speech</li>
                <li>Not post defamatory, false, or misleading content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Conduct</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Posting fake, spam, or promotional content</li>
                <li>Using profanity or vulgar language</li>
                <li>Personal attacks or harassment of professors or users</li>
                <li>Creating multiple accounts</li>
                <li>Automated scraping or data collection</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Intermediary Status</h2>
              <p className="text-gray-700">
                RateMyProf India is an intermediary under Section 79 of the Information Technology Act, 2000. 
                User-generated content does not represent our views. We moderate content in good faith but are 
                not liable for the accuracy or validity of user reviews.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-700">
                These Terms & Conditions are governed by the laws of India. Any disputes will be subject to 
                the jurisdiction of Indian courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact</h2>
              <p className="text-gray-700">
                For questions about these Terms & Conditions, please <Link href="/contact" className="text-indigo-600 hover:underline">contact us</Link>.
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
