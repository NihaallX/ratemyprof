/**
 * Development Auth Debug Page
 * Shows current authentication state and provides dev utilities
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { User, Session } from '@supabase/supabase-js'
import { useAuth } from '../../contexts/AuthContext'

export default function AuthDebugPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const { user, session } = useAuth()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        setCurrentUser(user)
        setCurrentSession(session)
        
        console.log('Direct Supabase user:', user)
        console.log('Direct Supabase session:', session)
        console.log('Context user:', user)
        console.log('Context session:', session)
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">This page is only available in development mode.</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700 mt-4 inline-block">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading auth state...</div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Auth Debug - RateMyProf India</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h1 className="text-2xl font-bold mb-4">🔧 Authentication Debug (Dev Only)</h1>
            <Link href="/" className="text-indigo-600 hover:text-indigo-700">← Back to Home</Link>
          </div>

          {/* Context vs Direct Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-green-600">Auth Context State</h2>
              <div className="space-y-3">
                <div>
                  <strong>User:</strong>
                  {user ? (
                    <div className="mt-1 text-sm">
                      <p>Email: {user.email}</p>
                      <p>ID: {user.id}</p>
                      <p>Email Confirmed: {user.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                      <p>Created: {user.created_at}</p>
                    </div>
                  ) : (
                    <span className="text-red-500 ml-2">null</span>
                  )}
                </div>
                <div>
                  <strong>Session:</strong>
                  {session ? (
                    <div className="mt-1 text-sm">
                      <p>Access Token: {session.access_token.substring(0, 20)}...</p>
                      <p>Expires: {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
                    </div>
                  ) : (
                    <span className="text-red-500 ml-2">null</span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-600">Direct Supabase State</h2>
              <div className="space-y-3">
                <div>
                  <strong>User:</strong>
                  {currentUser ? (
                    <div className="mt-1 text-sm">
                      <p>Email: {currentUser.email}</p>
                      <p>ID: {currentUser.id}</p>
                      <p>Email Confirmed: {currentUser.email_confirmed_at ? '✅ Yes' : '❌ No'}</p>
                      <p>Created: {currentUser.created_at}</p>
                    </div>
                  ) : (
                    <span className="text-red-500 ml-2">null</span>
                  )}
                </div>
                <div>
                  <strong>Session:</strong>
                  {currentSession ? (
                    <div className="mt-1 text-sm">
                      <p>Access Token: {currentSession.access_token.substring(0, 20)}...</p>
                      <p>Expires: {currentSession.expires_at ? new Date(currentSession.expires_at * 1000).toLocaleString() : 'N/A'}</p>
                    </div>
                  ) : (
                    <span className="text-red-500 ml-2">null</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Not set'}</p>
              <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Link href="/auth/signup" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Test Signup
                </Link>
                <Link href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Test Login
                </Link>
                <Link href="/auth/verify-email" className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
                  Email Verification
                </Link>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Email Confirmation Issue?</strong><br/>
                  If email confirmation is blocking your testing, you can disable it in your Supabase dashboard:
                  Authentication → Settings → "Enable email confirmations" (uncheck for development)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}