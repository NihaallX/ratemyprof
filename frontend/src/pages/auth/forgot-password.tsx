/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */

import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabase'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setSuccess(true)
        setLoading(false)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Password reset error:', err)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <Head>
          <title>Check Your Email - RateMyProf India</title>
          <meta name="description" content="Password reset email sent" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center">
              <Link href="/landing" className="text-3xl font-logo text-indigo-600 hover:text-indigo-700 inline-block" style={{ letterSpacing: '0.02em' }}>
                RateMyProf
              </Link>
            </div>

            {/* Success Card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  Check Your Email
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We've sent a password reset link to
                </p>
                <p className="mt-1 text-sm font-medium text-indigo-600">
                  {email}
                </p>
                <p className="mt-4 text-sm text-gray-600">
                  Click the link in the email to reset your password. The link will expire in 1 hour.
                </p>
                
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => router.push('/auth/login')}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Back to Login
                  </button>
                  
                  <button
                    onClick={() => {
                      setSuccess(false)
                      setEmail('')
                    }}
                    className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Send Another Email
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Didn't receive the email? Check your spam folder or try again with a different email address.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Forgot Password - RateMyProf India</title>
        <meta name="description" content="Reset your password for RateMyProf India" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/landing" className="text-3xl font-logo text-indigo-600 hover:text-indigo-700 inline-block" style={{ letterSpacing: '0.02em' }}>
              RateMyProf
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 font-heading">
              Reset Your Password
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email and we'll send you a reset link
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Info Message */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-700">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Password Reset Instructions</p>
                  <p className="mt-1 text-blue-600">
                    We'll send a secure link to your email. Click it to create a new password.
                  </p>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </div>

              {/* Back to Login Link */}
              <div className="text-center">
                <Link 
                  href="/auth/login" 
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
