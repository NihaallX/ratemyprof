/**
 * My Reviews Page
 * Shows user's submitted reviews with editing capabilities
 */

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { useRouter } from 'next/router'
import { MessageSquare, Edit3, Trash2, Star, ArrowLeft, Calendar, User } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

interface ReviewData {
  id: string
  professorName: string
  professorDepartment: string
  courseName: string
  semester: string
  academicYear: string
  overallRating: number
  difficultyRating: number
  clarityRating: number
  helpfulnessRating: number
  reviewText: string
  attendanceMandatory: boolean | null
  assignmentLoad: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function MyReviewsPage() {
  const { user, session, loading: authLoading } = useAuth()
  const { showToast, showConfirm } = useNotification()
  const router = useRouter()
  const [reviews, setReviews] = useState<ReviewData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }

    const fetchUserReviews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/reviews/my-reviews`, {
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setReviews(data.reviews || []);
        } else {
          console.error('Failed to fetch reviews');
          setReviews([]);
        }
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      }
      setLoading(false);
    };

    if (user && session) {
      fetchUserReviews();
    }
  }, [user, session, authLoading, router])

  const handleDeleteReview = async (reviewId: string) => {
    showConfirm(
      'Are you sure you want to delete this review? This action cannot be undone.',
      async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${session?.access_token}`,
            },
          })

          if (response.ok) {
            // Remove from local state
            setReviews(prev => prev.filter(review => review.id !== reviewId))
            showToast('Review deleted successfully', 'success')
          } else {
            const error = await response.json()
            throw new Error(error.detail || 'Failed to delete review')
          }
        } catch (error) {
          console.error('Failed to delete review:', error)
          showToast(
            error instanceof Error ? error.message : 'Failed to delete review. Please try again.',
            'error'
          )
        }
      },
      'Delete Review'
    )
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${colors[status as keyof typeof colors]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>My Reviews - RateMyProf India</title>
        <meta name="description" content="View and manage your professor reviews" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Home
                </Link>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">My Reviews</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {reviews.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't submitted any reviews yet. Start by rating your professors!
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Find Professors to Review
              </Link>
            </div>
          ) : (
            /* Reviews List */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Reviews ({reviews.length})
                </h2>
              </div>

              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow border border-gray-200">
                  <div className="p-6">
                    {/* Review Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {review.professorName}
                        </h3>
                        <p className="text-sm text-gray-600">{review.professorDepartment}</p>
                        <p className="text-sm text-indigo-600 font-medium">
                          {review.courseName} • {review.semester} {review.academicYear}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(review.status)}
                        <div className="flex space-x-2">
                          <button
                            className="p-1 text-gray-400 hover:text-indigo-600"
                            title="Edit Review"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReview(review.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Delete Review"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Ratings Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Overall</p>
                        {renderStars(review.overallRating)}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Difficulty</p>
                        {renderStars(review.difficultyRating)}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Clarity</p>
                        {renderStars(review.clarityRating)}
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Helpfulness</p>
                        {renderStars(review.helpfulnessRating)}
                      </div>
                    </div>

                    {/* Review Text */}
                    {review.reviewText && (
                      <div className="mb-4">
                        <p className="text-gray-800 leading-relaxed">"{review.reviewText}"</p>
                      </div>
                    )}

                    {/* Additional Info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      {review.attendanceMandatory !== null && (
                        <span>
                          Attendance: {review.attendanceMandatory ? 'Mandatory' : 'Optional'}
                        </span>
                      )}
                      {review.assignmentLoad && (
                        <span>
                          Workload: {review.assignmentLoad.charAt(0).toUpperCase() + review.assignmentLoad.slice(1)}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
