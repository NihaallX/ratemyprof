/**
 * Community Guidelines Page
 * Complete guidelines and legal information for RateMyProf India
 */

import Link from 'next/link'
import { useRouter } from 'next/router'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Shield, 
  FileText, 
  Scale, 
  Lock,
  ChevronRight,
  Home
} from 'lucide-react'
import Footer from '../components/Footer'

export default function GuidelinesPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-2xl font-bold text-gray-900">Community Guidelines</h1>
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <p className="text-gray-700 leading-relaxed">
            Welcome to RateMyProf India! Our platform is built on trust, honesty, and respect. 
            These guidelines help ensure that reviews are helpful, fair, and constructive for all students.
          </p>
        </div>

        {/* Site Guidelines */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Site Guidelines</h2>
          </div>

          <div className="space-y-6">
            {/* What to Do */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ✅ Do's - Write Helpful Reviews
              </h3>
              <ul className="space-y-2 ml-7">
                <li className="text-gray-700">
                  <strong>Be honest and constructive:</strong> Share your genuine experience to help fellow students make informed decisions.
                </li>
                <li className="text-gray-700">
                  <strong>Focus on teaching quality:</strong> Comment on teaching style, clarity, helpfulness, and course organization.
                </li>
                <li className="text-gray-700">
                  <strong>Provide context:</strong> Mention the course, semester, and academic year for relevance.
                </li>
                <li className="text-gray-700">
                  <strong>Be specific:</strong> Use examples to illustrate your points (e.g., "Professor explained complex topics with real-world examples").
                </li>
                <li className="text-gray-700">
                  <strong>Maintain balance:</strong> Mention both strengths and areas for improvement.
                </li>
                <li className="text-gray-700">
                  <strong>Proof-read:</strong> Check your review for clarity and errors before submitting.
                </li>
                <li className="text-gray-700">
                  <strong>Respect anonymity:</strong> Use anonymous posting if you prefer privacy.
                </li>
              </ul>
            </div>

            {/* What Not to Do */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <XCircle className="w-5 h-5 text-red-600 mr-2" />
                ❌ Don'ts - Prohibited Content
              </h3>
              <ul className="space-y-2 ml-7">
                <li className="text-gray-700">
                  <strong>No profanity or vulgar language:</strong> Reviews with offensive language will be removed immediately.
                </li>
                <li className="text-gray-700">
                  <strong>No personal attacks:</strong> Focus on professional teaching abilities, not personal characteristics.
                </li>
                <li className="text-gray-700">
                  <strong>No comments on appearance:</strong> Comments about physical appearance or personal life are strictly prohibited.
                </li>
                <li className="text-gray-700">
                  <strong>No bias claims:</strong> Don't claim the professor shows bias or favoritism based on caste, religion, gender, or any other factor.
                </li>
                <li className="text-gray-700">
                  <strong>No hate speech or discrimination:</strong> Content that discriminates based on caste, religion, gender, region, or any protected characteristic will result in immediate account suspension.
                </li>
                <li className="text-gray-700">
                  <strong>No fake reviews:</strong> Reviews must be based on actual classroom experience. Fake reviews will lead to account termination.
                </li>
                <li className="text-gray-700">
                  <strong>No spam or promotional content:</strong> Don't use reviews for advertising or promoting other services.
                </li>
                <li className="text-gray-700">
                  <strong>No personal information:</strong> Don't share personal contact information (yours or the professor's).
                </li>
                <li className="text-gray-700">
                  <strong>No revenge reviews:</strong> Reviews written out of personal vendetta will be removed.
                </li>
              </ul>
            </div>

            {/* Examples */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Examples</h3>
              
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <p className="text-sm font-medium text-green-800 mb-1">✅ Good Review</p>
                  <p className="text-sm text-gray-700 italic">
                    "Professor taught Data Structures in Fall 2024. Lectures were well-organized and concepts were explained with practical examples. 
                    Always available during office hours to help with doubts. Assignments were challenging but fair. 
                    Tests required understanding, not just memorization. Would recommend for students serious about learning."
                  </p>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <p className="text-sm font-medium text-red-800 mb-1">❌ Bad Review</p>
                  <p className="text-sm text-gray-700 italic">
                    "This prof is so boring and always picks on me. Failed me because they don't like students from my background. 
                    Total waste of time. Don't take this class!"
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    ❌ Contains personal attacks, unsubstantiated bias claims, and lacks constructive feedback
                  </p>
                </div>
              </div>
            </div>

            {/* Content Moderation */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                ⚠️ Content Moderation
              </h3>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• All reviews are checked by AI-powered content filters for profanity, spam, and quality.</li>
                  <li>• Flagged reviews are manually reviewed by our moderation team within 24 hours.</li>
                  <li>• Community members can flag inappropriate reviews.</li>
                  <li>• First violation: Warning and content removal.</li>
                  <li>• Repeated violations: Temporary suspension (7-30 days).</li>
                  <li>• Severe violations: Permanent account ban.</li>
                  <li>• You can appeal moderation decisions within 7 days.</li>
                </ul>
              </div>
            </div>

            {/* Privacy & Anonymity */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Lock className="w-5 h-5 text-blue-600 mr-2" />
                🔒 Privacy & Anonymity
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>• Reviews are anonymous by default to protect your identity.</li>
                  <li>• Your name will never be publicly displayed on anonymous reviews.</li>
                  <li>• Administrators can see review authors for moderation purposes only.</li>
                  <li>• You can choose to post publicly under your account name if you prefer.</li>
                  <li>• Anonymous reviews have the same weight as public reviews.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Legal & Policy Links */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center mb-4">
            <FileText className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Help & Legal</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/help"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
            >
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600">Help Center</h3>
                <p className="text-sm text-gray-500">FAQs and support</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              href="/terms"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
            >
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600">Terms & Conditions</h3>
                <p className="text-sm text-gray-500">User agreement and rules</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              href="/privacy"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
            >
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600">Privacy Policy</h3>
                <p className="text-sm text-gray-500">How we protect your data</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              href="/copyright"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
            >
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600">Copyright Compliance</h3>
                <p className="text-sm text-gray-500">DMCA and copyright policy</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              href="/data-collection"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
            >
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600">Data Collection Notice</h3>
                <p className="text-sm text-gray-500">Information we collect (India)</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
            </Link>

            <Link
              href="/contact"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-all group"
            >
              <div>
                <h3 className="font-medium text-gray-900 group-hover:text-indigo-600">Contact Us</h3>
                <p className="text-sm text-gray-500">Get in touch with support</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-600" />
            </Link>
          </div>
        </section>

        {/* Compliance Notice */}
        <section className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center mb-4">
            <Scale className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Legal Compliance</h2>
          </div>

          <div className="space-y-3 text-sm text-gray-700">
            <p>
              RateMyProf India operates in compliance with Indian laws including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Digital Personal Data Protection Act 2023 (DPDP Act)</li>
              <li>Information Technology Act 2000</li>
              <li>IT Rules 2011 (Intermediary Guidelines and Digital Media Ethics Code)</li>
            </ul>
            <p>
              We are an intermediary under Section 79 of the IT Act 2000. User-generated content 
              does not represent our views. We moderate content in good faith but cannot guarantee 
              the accuracy of all reviews.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-4">
              <p className="font-medium text-gray-900 mb-2">Grievance Officer</p>
              <p className="text-gray-700">
                For any complaints or concerns regarding content on this platform, please contact our Grievance Officer.
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Response Time:</strong> Within 24-48 hours<br />
                <strong>Resolution Time:</strong> Within 15 days
              </p>
              <Link href="/contact" className="text-indigo-600 hover:text-indigo-800 font-medium mt-2 inline-block">
                Contact Grievance Officer →
              </Link>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            By using RateMyProf India, you agree to follow these guidelines and our Terms of Service.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/terms"
              className="px-6 py-3 border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
            >
              Read Terms
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
