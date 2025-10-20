/**
 * Email Verification Helper Page
 * Provides instructions and resend functionality for email verification
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

export default function VerifyEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Get email from query params if provided
    if (router.query.email && typeof router.query.email === 'string') {
      setEmail(router.query.email)
    }
  }, [router.query])

  const resendVerification = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage('Verification email sent! Check your inbox and spam folder.')
      }
    } catch (err) {
      setError('Failed to resend verification email')
      console.error('Resend error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Verify Your Email - RateMyProf India</title>
        <meta name="description" content="Verify your email address to complete registration" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <Mail className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Verify Your Email</h2>
              <p className="text-gray-600 mt-2">
                We sent a verification link to your email address
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-4 mb-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> You need to verify your email before you can sign in.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>Steps:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Check your email inbox</li>
                  <li>Look for an email from Supabase</li>
                  <li>Click the "Confirm your email" link</li>
                  <li>Return here to sign in</li>
                </ol>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Didn't receive the email?</strong> Check your spam folder or request a new one below.
                </p>
              </div>
            </div>

            {/* Resend Section */}
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email to resend verification"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={resendVerification}
                disabled={loading || !email}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Sending...' : 'Resend Verification Email'}
              </button>

              {/* Success/Error Messages */}
              {message && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex">
                    <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                    <p className="text-sm text-green-800">{message}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Links */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <Link 
                  href="/auth/login"
                  className="text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Already verified? Sign in
                </Link>
                <Link 
                  href="/"
                  className="text-gray-500 hover:text-gray-700"
                >
                  Back to home
                </Link>
              </div>
            </div>
          </div>

          {/* Development Helper */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mt-4">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Development Mode:</strong>
              </p>
              <p className="text-xs text-gray-600">
                If you're testing and don't want email verification, you can disable it in your 
                Supabase Dashboard → Authentication → Settings → "Enable email confirmations"
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}