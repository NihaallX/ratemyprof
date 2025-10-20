/**
 * Contact Page
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Mail, MessageSquare, AlertCircle } from 'lucide-react'
import Footer from '../components/Footer'

export default function ContactPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
              <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
            </div>
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center mb-8">
            <Mail className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>
            <p className="text-gray-600">
              Have questions, concerns, or feedback? We'd love to hear from you!
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Grievance Officer (IT Rules 2011)
              </h3>
              <p className="text-sm text-blue-800 mb-3">
                For complaints regarding content moderation, privacy concerns, or legal matters:
              </p>
              <div className="text-sm text-blue-900 space-y-1">
                <p><strong>Email:</strong> gauravguddeti682005@gmail.com</p>
                <p><strong>Response Time:</strong> Within 24-48 hours</p>
                <p><strong>Resolution Time:</strong> Within 15 days</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                General Support
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                For general inquiries, technical support, or feedback:
              </p>
              <div className="text-sm text-gray-900 space-y-1">
                <p><strong>Email:</strong> nihalpardeshi12344@gmail.com</p>
                <p><strong>Response Time:</strong> Within 24-48 hours</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">What You Can Contact Us For:</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✓ Report inappropriate content</li>
                <li>✓ Appeal moderation decisions</li>
                <li>✓ Request account data or deletion</li>
                <li>✓ Technical issues or bugs</li>
                <li>✓ Feature suggestions</li>
                <li>✓ Partnership inquiries</li>
                <li>✓ Legal or compliance matters</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Before contacting us, please check our{' '}
              <Link href="/help" className="text-indigo-600 hover:underline">
                Help Center
              </Link>{' '}
              and{' '}
              <Link href="/guidelines" className="text-indigo-600 hover:underline">
                Community Guidelines
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
