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
                <li>Professor reviews and ratings (overall, clarity, helpfulness)</li>
                <li>College reviews and ratings (food, internet, clubs, opportunities, facilities, teaching, overall)</li>
                <li>Course information and year of study</li>
                <li>Review text and comments</li>
                <li>Anonymous display preferences</li>
                <li>Review votes (helpful/not helpful)</li>
                <li>Review flags and moderation reports</li>
                <li>Voting history on reviews</li>
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
                <li>Display reviews to help students make informed decisions about professors and colleges</li>
                <li>Moderate content for quality and appropriateness</li>
                <li>Track voting patterns to surface helpful reviews</li>
                <li>Process flags and reports to maintain community standards</li>
                <li>Prevent spam, abuse, and fake reviews</li>
                <li>Improve platform functionality and user experience</li>
                <li>Send important notifications about your account and reviews</li>
                <li>Analytics to understand usage patterns (anonymized)</li>
                <li>Enforce rate limits to prevent abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Anonymity and Privacy</h2>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Review Anonymity</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>All college reviews are anonymous by default</strong> - Your name will never be publicly displayed</li>
                <li><strong>Professor reviews</strong> can be posted anonymously or with your name (your choice)</li>
                <li>We maintain a private mapping between reviews and authors for moderation purposes only</li>
                <li>Only administrators can see review authorship, and only for moderation/security purposes</li>
                <li>Your identity is protected from other users, professors, and colleges</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">Voting Privacy</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Your votes (helpful/not helpful) on reviews are stored privately</li>
                <li>Other users cannot see who voted on a review</li>
                <li>Only aggregated vote counts are displayed publicly</li>
                <li>You can change or remove your vote at any time</li>
                <li>Voting data is used to rank and surface quality reviews</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">Flagging and Moderation</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>When you flag a review, your identity as the reporter is kept confidential</li>
                <li>Flagging data is only visible to administrators</li>
                <li>We track flagging patterns to identify abuse of the flagging system</li>
                <li>Moderation decisions and notes are kept in secure logs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing</h2>
              <p className="text-gray-700 mb-3">
                <strong>We DO NOT sell your data.</strong> We only share data with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Supabase</strong> - Database hosting provider (encrypted storage)</li>
                <li><strong>Railway/Vercel</strong> - Application hosting providers</li>
                <li><strong>Sentry</strong> - Error monitoring (anonymized error logs only)</li>
              </ul>
              
              <p className="text-gray-700 mb-3">
                <strong>What we NEVER share:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Your email or personal contact information with third parties</li>
                <li>Review authorship information (kept private except for moderation)</li>
                <li>Voting patterns or individual vote data</li>
                <li>Any data with professors, colleges, or institutions</li>
                <li>Marketing or advertising companies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access and Moderation</h2>
              <p className="text-gray-700 mb-3">
                To maintain quality and safety, authorized administrators have access to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>Review authorship information (to prevent spam and enforce guidelines)</li>
                <li>Voting patterns (to detect vote manipulation)</li>
                <li>Flagging reports and reporter information (to process moderation requests)</li>
                <li>User account details (to enforce terms of service)</li>
                <li>IP addresses and technical logs (to prevent abuse and security threats)</li>
              </ul>
              
              <p className="text-gray-700">
                <strong>Administrator Confidentiality:</strong> All administrators are bound by confidentiality 
                agreements and are prohibited from sharing user information outside of moderation purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Rights (DPDP Act 2023)</h2>
              <p className="text-gray-700 mb-3">
                Under India's Digital Personal Data Protection Act 2023, you have the following rights:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Right to access:</strong> Request a copy of all your data we hold</li>
                <li><strong>Right to correction:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to erasure:</strong> Request deletion of your account and personal data</li>
                <li><strong>Right to data portability:</strong> Receive your data in a portable format</li>
                <li><strong>Right to grievance redressal:</strong> File complaints about data handling</li>
                <li><strong>Right to appeal:</strong> Contest moderation decisions affecting your reviews</li>
                <li><strong>Right to withdraw consent:</strong> Opt out of optional data processing</li>
                <li><strong>Right to nominate:</strong> Designate someone to exercise your rights in case of death or incapacity</li>
              </ul>
              
              <p className="text-gray-700 mb-3">
                <strong>Special Notes on Data Deletion:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>When you delete your account, your personal information is removed within 30 days</li>
                <li>Reviews you posted will remain visible (anonymously) to preserve the platform's integrity</li>
                <li>Your votes and flags will be retained (anonymized) for platform quality</li>
                <li>We cannot delete reviews if they are subject to ongoing moderation or legal proceedings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Retention</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Active accounts:</strong> Data kept while account is active and for legal compliance</li>
                <li><strong>Deleted accounts:</strong> Personal data anonymized within 30 days</li>
                <li><strong>Reviews:</strong> Kept anonymously even after account deletion (for platform integrity)</li>
                <li><strong>Votes:</strong> Anonymized and retained for review ranking quality</li>
                <li><strong>Flags and reports:</strong> Retained for 1 year for moderation quality and appeals</li>
                <li><strong>Security logs:</strong> IP addresses and access logs kept for 90 days</li>
                <li><strong>Moderation decisions:</strong> Retained for 2 years for appeal purposes</li>
              </ul>
              
              <p className="text-gray-700">
                <strong>Why we retain anonymized reviews:</strong> Reviews form the core value of our platform. 
                Deleting them would harm the community and students relying on authentic feedback. After account 
                deletion, reviews remain but cannot be linked back to you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Cookies and Tracking</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Authentication tokens:</strong> Stored locally to keep you logged in</li>
                <li><strong>Session cookies:</strong> Essential for platform functionality</li>
                <li><strong>Analytics cookies:</strong> Used to understand usage patterns (can be disabled)</li>
                <li><strong>No advertising cookies:</strong> We don't use cookies for ad tracking</li>
                <li><strong>No cross-site tracking:</strong> We don't track you across other websites</li>
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
