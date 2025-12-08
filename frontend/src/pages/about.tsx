import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us - RateMyProf India</title>
        <meta name="description" content="Learn about RateMyProf.me - a student-built platform for honest professor reviews in India" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Back Button */}
          <Link 
            href="/"
            className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          {/* Main Content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border dark:border-gray-700 p-8 md:p-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-8">
              About RateMyProf.me
            </h1>

            <div className="prose prose-lg max-w-none">
              {/* Origin Story */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">How It Started</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  <strong>RateMyProf.me</strong> was created by two students — <strong>Nihal Pardeshi</strong> and <strong>Gaurav Guddeti</strong> — who got tired of the yearly Google Form feedback circus.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  You know the one: endless questions, zero insight, and by the time it's over, half the class doesn't even remember the course.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We wanted something faster, smarter, and actually useful — especially for new students who just got their timetables and have no clue what kind of professors they're walking into class with.
                </p>
              </section>

              {/* The Platform */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">What We Built</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  So, we built this platform. Inspired by the original Rate My Professors from the US and Canada (back from the early 2000s internet), <strong>RateMyProf.me</strong> is made by students, for students — with an Indian twist.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  It's a place to share real classroom experiences, honest opinions, and help others set expectations (or prepare emotionally) for their upcoming semester.
                </p>
              </section>

              {/* Quality & Safety */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Quality & Safety First</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Every review and professor profile goes through <strong>admin approval</strong> and <strong>AI/ML-based filters</strong> to detect spam, hate speech, and unhelpful content.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  We're all for constructive criticism — not chaos.
                </p>
              </section>

              {/* Future Plans */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">What's Next?</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  We've also started experimenting with <strong>college-wide ratings</strong> based on professor feedback and plan to add:
                </p>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2 ml-4">
                  <li>AI-powered review summaries</li>
                  <li>Smarter insights and analytics</li>
                  <li>Enhanced search and filtering</li>
                  <li>More colleges across India</li>
                  <li>And a lot more soon...</li>
                </ul>
              </section>

              {/* Thank You */}
              <section className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Thank You</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  And of course, big shoutout to my co-founder <strong>Gaurav</strong>, for joining me on this weirdly fun ride.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  This started as a simple idea, but it turned into a project that actually helps people — and that's the best part.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-lg">
                  Happy learning, honest reviewing, and good luck choosing your next professor.
                </p>
              </section>

              {/* Founders */}
              <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-6 text-center">The Founders</h2>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border dark:border-gray-700 transition-all duration-300">
                    <div className="w-24 h-24 mx-auto mb-4 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      N
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nihal Pardeshi</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Co-Founder</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border dark:border-gray-700 transition-all duration-300">
                    <div className="w-24 h-24 mx-auto mb-4 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      G
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Gaurav Guddeti</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Co-Founder</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border dark:border-gray-700 transition-all duration-300">
                    <div className="w-24 h-24 mx-auto mb-4 bg-indigo-600 dark:bg-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                      A
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Aishwarya Zinjurte</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Creative Director</p>
                  </div>
                </div>
              </section>

              {/* Contact CTA */}
              <section className="mt-12 text-center bg-indigo-50 dark:bg-indigo-900/20 border dark:border-indigo-800 p-8 rounded-xl transition-colors duration-200">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Questions or Feedback?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  We'd love to hear from you! Reach out to us anytime.
                </p>
                <Link 
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg"
                >
                  Contact Us
                </Link>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
