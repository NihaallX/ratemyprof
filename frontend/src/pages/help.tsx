/**
 * Help Center Page
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, HelpCircle, ChevronRight } from 'lucide-react'
import Footer from '../components/Footer'

export default function HelpPage() {
  const router = useRouter()

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click "Sign Up" in the top right corner and register with your university email address. Verify your email to activate your account.'
        },
        {
          q: 'Can I review professors anonymously?',
          a: 'Yes! All reviews are anonymous by default. Your identity will never be publicly displayed on anonymous reviews.'
        }
      ]
    },
    {
      category: 'Writing Reviews',
      questions: [
        {
          q: 'What should I include in my review?',
          a: 'Focus on teaching quality, clarity, helpfulness, and course organization. Mention the course name, semester, and provide specific examples.'
        },
        {
          q: 'Can I edit my review after submitting?',
          a: 'Yes, you can edit or delete your reviews from the "My Reviews" page.'
        }
      ]
    },
    {
      category: 'Content Moderation',
      questions: [
        {
          q: 'Why was my review removed?',
          a: 'Reviews are removed if they violate our Community Guidelines (profanity, personal attacks, fake content, etc.). You can appeal decisions by contacting us.'
        },
        {
          q: 'How do I report inappropriate content?',
          a: 'Click the flag icon on any review to report it. Our moderation team will review it within 24 hours.'
        }
      ]
    }
  ]

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
              <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            </div>
            <Link href="/" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How can we help you?</h2>
          <p className="text-gray-600">Find answers to common questions below</p>
        </div>

        {faqs.map((section, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">{section.category}</h3>
            <div className="space-y-4">
              {section.questions.map((item, qIdx) => (
                <div key={qIdx} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                  <h4 className="font-medium text-gray-900 mb-2">{item.q}</h4>
                  <p className="text-gray-700 text-sm">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">Can't find what you're looking for?</p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Contact Support
            <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
