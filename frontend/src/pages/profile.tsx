/**
 * User Profile Page
 * Shows user profile information and allows editing
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { useRouter } from 'next/router'
import { User, Mail, GraduationCap, Building, Link as LinkIcon, Save, Edit3, ArrowLeft, Trash2, AlertTriangle } from 'lucide-react'

interface ProfileData {
  name: string
  email: string
  college: string
  degree: string
  linkedIn: string
  portfolio: string
}

export default function ProfilePage() {
  const { user, session, loading: authLoading } = useAuth()
  const { showToast } = useNotification()
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    college: '',
    degree: '',
    linkedIn: '',
    portfolio: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    if (user) {
      setProfile({
        name: user.user_metadata?.name || '',
        email: user.email || '',
        college: user.user_metadata?.college || '',
        degree: user.user_metadata?.degree || '',
        linkedIn: user.user_metadata?.linkedIn || '',
        portfolio: user.user_metadata?.portfolio || ''
      })
    }
  }, [user, authLoading, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: Update user metadata via Supabase
      // For now, just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000))
      setIsEditing(false)
      showToast('Profile updated successfully', 'success')
    } catch (error) {
      console.error('Failed to save profile:', error)
      showToast('Failed to save profile. Please try again.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showToast('Please type DELETE to confirm', 'error')
      return
    }

    setIsDeleting(true)
    try {
      // Check if we have a valid session token
      if (!session?.access_token) {
        throw new Error('Authentication required')
      }

      // Call backend API to delete account
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Delete account error response:', errorData)
        console.error('Response status:', response.status)
        throw new Error(errorData.detail || 'Failed to delete account')
      }

      showToast('Account deleted successfully. Goodbye!', 'success')
      
      // Sign out using supabase from lib
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.signOut()
      
      setTimeout(() => router.push('/'), 1000)
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      showToast(
        error.message || 'Failed to delete account. Please contact support at nihalpardeshi12344@gmail.com',
        'error'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Profile - RateMyProf India</title>
        <meta name="description" content="Manage your profile and account settings" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Home
                </Link>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow">
            {/* Profile Header */}
            <div className="px-6 py-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {profile.name || 'Set up your profile'}
                    </h2>
                    <p className="text-gray-600">{profile.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>

            {/* Profile Form */}
            <div className="px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.name || 'Not set'}</p>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <p className="text-gray-600 py-2 text-sm">
                    {profile.email}
                    <span className="ml-2 text-xs text-gray-500">(verified)</span>
                  </p>
                </div>

                {/* College */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />
                    College/University
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.college}
                      onChange={(e) => handleInputChange('college', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., Vishwakarma University"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.college || 'Not set'}</p>
                  )}
                </div>

                {/* Degree */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <GraduationCap className="w-4 h-4 inline mr-2" />
                    Degree/Program
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.degree}
                      onChange={(e) => handleInputChange('degree', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g., B.Tech Computer Science"
                    />
                  ) : (
                    <p className="text-gray-900 py-2">{profile.degree || 'Not set'}</p>
                  )}
                </div>

                {/* LinkedIn */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-2" />
                    LinkedIn Profile
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profile.linkedIn}
                      onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="https://linkedin.com/in/username"
                    />
                  ) : (
                    <div className="py-2">
                      {profile.linkedIn ? (
                        <a
                          href={profile.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          View LinkedIn Profile →
                        </a>
                      ) : (
                        <p className="text-gray-900">Not set</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Portfolio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <LinkIcon className="w-4 h-4 inline mr-2" />
                    Portfolio/Website
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={profile.portfolio}
                      onChange={(e) => handleInputChange('portfolio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="https://yourwebsite.com"
                    />
                  ) : (
                    <div className="py-2">
                      {profile.portfolio ? (
                        <a
                          href={profile.portfolio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          Visit Website →
                        </a>
                      ) : (
                        <p className="text-gray-900">Not set</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Danger Zone - Delete Account */}
          <div className="mt-8 bg-white rounded-lg shadow border-2 border-red-200">
            <div className="px-6 py-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Danger Zone</h3>
              </div>
            </div>
            
            <div className="px-6 py-6">
              {!showDeleteConfirm ? (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Delete Account</h4>
                  <p className="text-gray-600 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <ul className="text-sm text-gray-600 mb-4 space-y-1 list-disc pl-5">
                    <li>All your reviews will be permanently deleted</li>
                    <li>Your profile information will be removed</li>
                    <li>You will be immediately signed out</li>
                    <li>This action is irreversible</li>
                  </ul>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete My Account</span>
                  </button>
                </div>
              ) : (
                <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                  <div className="flex items-start space-x-3 mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="text-lg font-bold text-red-900 mb-2">
                        Are you absolutely sure?
                      </h4>
                      <p className="text-red-800 mb-4">
                        This will permanently delete your account and all your data. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-red-900 mb-2">
                      Type <span className="font-bold">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="Type DELETE"
                      disabled={isDeleting}
                    />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false)
                        setDeleteConfirmText('')
                      }}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{isDeleting ? 'Deleting...' : 'Delete Forever'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
