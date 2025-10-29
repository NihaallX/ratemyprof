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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-sm text-blue-900 font-medium mb-2">
                📝 <strong>Important Notice:</strong> By using RateMyProf.me, you agree to these Terms & Conditions.
              </p>
              <p className="text-sm text-blue-800">
                These terms are designed to protect both users and professors while maintaining a constructive review platform.
              </p>
            </div>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-3">
                By accessing, browsing, or using RateMyProf.me ("the Platform", "we", "us", or "our"), you ("User" or "you") agree to be bound by these Terms & Conditions and all applicable laws and regulations.
              </p>
              <p className="text-gray-700 mb-3">
                If you do not agree with any part of these terms, you must not use the Platform.
              </p>
              <p className="text-gray-700">
                These terms constitute a legally binding agreement between you and RateMyProf.me.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You must be at least 18 years of age or have parental/guardian consent to use this Platform</li>
                <li>You must be a current or former student of an Indian college/university to submit reviews</li>
                <li>You must provide accurate information during registration</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-700 mb-3"><strong>Account Creation:</strong></p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>You must provide a valid email address for account verification</li>
                <li>One account per person - multiple accounts are prohibited</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
              
              <p className="text-gray-700 mb-3"><strong>Account Termination:</strong></p>
              <p className="text-gray-700">
                We reserve the right to suspend or terminate accounts that violate these Terms, engage in prohibited conduct, or pose a risk to the Platform or other users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content & Reviews</h2>
              <p className="text-gray-700 mb-3"><strong>Content Guidelines:</strong></p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li><strong>Honesty:</strong> Reviews must be based on genuine personal experience with the professor/college</li>
                <li><strong>Accuracy:</strong> Information provided must be truthful and not misleading</li>
                <li><strong>Constructiveness:</strong> Criticism must be constructive and educational in nature</li>
                <li><strong>Relevance:</strong> Reviews should focus on teaching quality, course content, and academic experience</li>
                <li><strong>Anonymity:</strong> While reviews are anonymous, abusing this feature is prohibited</li>
              </ul>

              <p className="text-gray-700 mb-3"><strong>Prohibited Content:</strong></p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                <li>False, defamatory, or malicious statements</li>
                <li>Hate speech, discriminatory, or offensive language</li>
                <li>Personal attacks on appearance, gender, religion, caste, or personal life</li>
                <li>Profanity, vulgar, or sexually explicit content</li>
                <li>Spam, promotional content, or commercial solicitations</li>
                <li>Content that violates any law or third-party rights</li>
                <li>Impersonation or misrepresentation</li>
                <li>Threats, harassment, or intimidation</li>
              </ul>

              <p className="text-gray-700 mb-3"><strong>Content License:</strong></p>
              <p className="text-gray-700">
                By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the Platform. You retain ownership but allow us to moderate, edit for clarity, or remove content that violates these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Moderation & Content Review</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Pre-publication Review:</strong> All reviews and professor submissions undergo admin approval before publication</li>
                <li><strong>AI Filtering:</strong> We use automated systems to detect spam, hate speech, and inappropriate content</li>
                <li><strong>User Reporting:</strong> Users can flag reviews for moderation. Flagged content will be reviewed by our team</li>
                <li><strong>Right to Remove:</strong> We reserve the right to remove any content that violates these Terms without prior notice</li>
                <li><strong>No Guarantee:</strong> While we moderate content, we cannot guarantee that all content is accurate or appropriate</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intermediary Status (IT Act, 2000)</h2>
              <p className="text-gray-700 mb-3">
                <strong>Legal Status:</strong> RateMyProf.me operates as an intermediary under Section 79 of the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021.
              </p>
              
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We provide a platform for user-generated content but do not create, endorse, or verify the content</li>
                <li>User-generated reviews represent individual opinions and do not reflect our views</li>
                <li>We exercise due diligence in moderating content but are not liable for user-posted content</li>
                <li>We comply with lawful takedown requests from appropriate authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Grievance Redressal</h2>
              <p className="text-gray-700 mb-3">
                In compliance with the Information Technology (Intermediary Guidelines) Rules, 2021:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-700 mb-2"><strong>Grievance Officer:</strong></p>
                <p className="text-gray-700">Name: To be appointed</p>
                <p className="text-gray-700">Email: <a href="mailto:nihalpardeshi12344@gmail.com" className="text-indigo-600 hover:underline">nihalpardeshi12344@gmail.com</a></p>
                <p className="text-gray-700 mt-2"><strong>Response Time:</strong> Within 24 hours of receiving a complaint</p>
                <p className="text-gray-700"><strong>Resolution Time:</strong> Within 15 days of acknowledgment</p>
              </div>

              <p className="text-gray-700">
                If you believe content violates these Terms or your rights, please contact us at the above email with details of the complaint.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>The Platform design, logo, code, and original content are owned by RateMyProf.me</li>
                <li>Users retain ownership of their submitted content but grant us a license to display it</li>
                <li>You may not copy, reproduce, or distribute Platform content without permission</li>
                <li>Unauthorized scraping, data mining, or automated access is prohibited</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimer of Warranties</h2>
              <p className="text-gray-700 mb-3">
                THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We do not guarantee the accuracy, completeness, or reliability of user-generated content</li>
                <li>We are not responsible for decisions made based on reviews posted on the Platform</li>
                <li>We do not warrant uninterrupted or error-free service</li>
                <li>We are not liable for any damage to your device or data loss from using the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-700 mb-3">
                To the maximum extent permitted by Indian law:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We are not liable for any indirect, incidental, or consequential damages</li>
                <li>Our total liability shall not exceed ₹1,000 (One Thousand Rupees)</li>
                <li>We are not responsible for disputes between users and professors</li>
                <li>We are not liable for third-party content or external links</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold RateMyProf.me, its founders, and affiliates harmless from any claims, damages, or expenses arising from:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700 mt-2">
                <li>Your violation of these Terms</li>
                <li>Your violation of any law or third-party rights</li>
                <li>Content you submit to the Platform</li>
                <li>Your use or misuse of the Platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Privacy & Data Protection</h2>
              <p className="text-gray-700">
                Your use of the Platform is also governed by our <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link>, which explains how we collect, use, and protect your personal information in compliance with Indian data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Modifications to Terms</h2>
              <p className="text-gray-700 mb-3">
                We reserve the right to modify these Terms at any time. Changes will be effective upon posting to the Platform.
              </p>
              <p className="text-gray-700">
                Continued use of the Platform after changes constitutes acceptance of the modified Terms. We encourage you to review these Terms periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Termination</h2>
              <p className="text-gray-700 mb-3"><strong>Your Rights:</strong></p>
              <p className="text-gray-700 mb-4">You may delete your account at any time through your profile settings.</p>

              <p className="text-gray-700 mb-3"><strong>Our Rights:</strong></p>
              <p className="text-gray-700">
                We may suspend or terminate your account immediately without notice if you violate these Terms, engage in fraudulent activity, or pose a risk to the Platform or other users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Governing Law & Jurisdiction</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Governing Law:</strong> These Terms are governed by the laws of India</li>
                <li><strong>Jurisdiction:</strong> Any disputes shall be subject to the exclusive jurisdiction of courts in Pune, Maharashtra, India</li>
                <li><strong>Dispute Resolution:</strong> We encourage resolving disputes through good-faith negotiation before legal action</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Severability</h2>
              <p className="text-gray-700">
                If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the rest of these Terms remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Entire Agreement</h2>
              <p className="text-gray-700">
                These Terms, together with our Privacy Policy and Community Guidelines, constitute the entire agreement between you and RateMyProf.me regarding the use of the Platform.
              </p>
            </section>

            <section className="bg-indigo-50 p-6 rounded-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Contact Information</h2>
              <p className="text-gray-700 mb-3">
                For questions, concerns, or complaints regarding these Terms & Conditions:
              </p>
              <div className="space-y-2 text-gray-700">
                <p><strong>Email:</strong> <a href="mailto:nihalpardeshi12344@gmail.com" className="text-indigo-600 hover:underline">nihalpardeshi12344@gmail.com</a></p>
                <p><strong>Grievance Officer:</strong> To be appointed</p>
                <p><strong>Contact Page:</strong> <Link href="/contact" className="text-indigo-600 hover:underline">ratemyprof.me/contact</Link></p>
              </div>
            </section>

            <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 italic">
                By clicking "I Agree" during signup or by using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms & Conditions.
              </p>
              <p className="text-sm text-gray-600 italic mt-2">
                Last Updated: October 29, 2025
              </p>
            </div>
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
