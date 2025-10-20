/**
 * Login Page - User authentication f    try {
      const { error } = await signIn(email, password)
      
      if (error) {
        // Check if it's an email confirmation error
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          setError('Please check your email and click the verification link before signing in.')
          // Optionally redirect to verification page
          setTimeout(() => {
            router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`)
          }, 3000)
        } else {
          setError(error.message)
        }
      } else {
        // Successful login - redirect to intended page
        const redirectUrl = (redirect as string) || '/'
        router.push(redirectUrl)
      }
    } catch (err) {of
 * Allows students to sign in to rate professors
 */

import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAuth } from '../../contexts/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { signIn, user } = useAuth()
  const { showToast } = useNotification()
  const router = useRouter()
  const { redirect } = router.query

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Redirect admin users to admin dashboard, regular users to home or redirect URL
      if (user.email === 'admin@gmail.com' || user.role === 'admin' || user.app_metadata?.role === 'admin' || user.user_metadata?.role === 'admin') {
        router.push('/admin')
      } else {
        const redirectUrl = (redirect as string) || '/'
        router.push(redirectUrl)
      }
    }
  }, [user, router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    try {
      const result = await signIn(email, password)
      
      if (result.error) {
        setError(result.error.message || 'Invalid login credentials')
        setLoading(false)
      } else {
        // Successful login - redirect based on user type
        if (email === 'admin@gmail.com') {
          showToast('Admin login successful! Redirecting...', 'success')
          router.push('/admin')
        } else {
          const redirectUrl = (redirect as string) || '/'
          router.push(redirectUrl)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login - RateMyProf India</title>
        <meta name="description" content="Sign in to rate and review professors at Indian universities" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="text-3xl font-logo text-indigo-600 hover:text-indigo-700 inline-block" style={{ letterSpacing: '0.02em' }}>
              RateMyProf.in
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 font-heading">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Share your professor experiences and help fellow students
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

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

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
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
                    'Sign In'
                  )}
                </button>
              </div>

              {/* Links */}
              <div className="flex items-center justify-between text-sm">
                <Link href="/auth/forgot-password" className="text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
                <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-500">
                  Create account
                </Link>
              </div>

              {/* Email Verification Link */}
              <div className="text-center text-sm">
                <Link href="/auth/verify-email" className="text-gray-500 hover:text-gray-700">
                  Need to verify your email?
                </Link>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500">
            By signing in, you agree to help fellow students with honest reviews
          </div>
        </div>
      </div>
    </>
  )
}