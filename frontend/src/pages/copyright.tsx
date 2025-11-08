/**
 * Copyright Compliance Page
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { Home, Copyright } from 'lucide-react'
import Footer from '../components/Footer'

export default function CopyrightPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                <Home className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Copyright Compliance</h1>
            </div>
            <Link href="/" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border dark:border-gray-700 p-8">
          <div className="flex items-center mb-6">
            <Copyright className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-3" />
            <p className="text-sm text-gray-600 dark:text-gray-300">Last Updated: {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Intellectual Property</h2>
              <p className="text-gray-700 dark:text-gray-300">
                RateMyProf India respects intellectual property rights. All content on this platform, 
                including code, design, branding, and text, is protected by copyright law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Content</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                When you post reviews on RateMyProf India:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>You retain ownership of your reviews</li>
                <li>You grant us a license to display, distribute, and moderate your content</li>
                <li>You confirm you have the right to post the content</li>
                <li>You agree not to post copyrighted material without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Copyright Infringement</h2>
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                If you believe content on our platform infringes your copyright, please contact us with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                <li>Description of copyrighted work</li>
                <li>URL of infringing content</li>
                <li>Your contact information</li>
                <li>Statement of good faith belief</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                Email: <strong>copyright@ratemyprof.in</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Platform Usage</h2>
              <p className="text-gray-700 dark:text-gray-300">
                You may not scrape, copy, or redistribute content from RateMyProf India without 
                explicit permission. Automated data collection is prohibited.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Link href="/guidelines" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
              ← Back to Guidelines
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
