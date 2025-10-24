/**
 * Professor Profile Page - [id].tsx
 * Displays detailed information about a specific professor with review submission
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { RateMyProfAPI, Professor } from '../../services/api';
import ReviewSubmissionForm from '../../components/ReviewSubmissionForm';
import FlagReviewButton from '../../components/FlagReviewButton';
import ReviewVoting from '../../components/ReviewVoting';
import CompareProfessors from '../../components/CompareProfessors';
import { API_BASE_URL } from '../../config/api';
import { 
  ArrowLeft, 
  Star, 
  User, 
  Building, 
  BookOpen, 
  MessageSquare,
  Award,
  Lock,
  Calendar
} from 'lucide-react';

interface Review {
  id: string
  overall_rating: number
  difficulty_rating: number
  clarity_rating: number
  helpfulness_rating: number
  course_name?: string
  semester?: string
  academic_year?: string
  review_text?: string
  created_at: string
  anonymous: boolean
  anon_display_name?: string
  would_take_again?: boolean
  assignment_load?: string
  helpful_count?: number
  not_helpful_count?: number
  user_vote?: 'helpful' | 'not_helpful' | null
}

interface SimilarProfessor {
  id: string
  name: string
  department: string
  average_rating: number
  total_reviews: number
  subjects: string[]
}

interface MoreProfessor {
  id: string
  name: string
  department: string
  average_rating: number
  total_reviews: number
  subjects: string[]
}

export default function ProfessorProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProfessors, setSimilarProfessors] = useState<SimilarProfessor[]>([]);
  const [moreProfessors, setMoreProfessors] = useState<MoreProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);


  useEffect(() => {
    if (id && typeof id === 'string') {
      fetchProfessor(id);
      fetchReviews(id);
      fetchSimilarProfessors(id);
      fetchMoreProfessors(id);
    }
  }, [id]);

  const fetchProfessor = async (professorId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await RateMyProfAPI.getProfessor(professorId);
      setProfessor(data);
    } catch (err) {
      console.error('Failed to fetch professor:', err);
      setError('Failed to load professor information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (professorId: string) => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`${API_BASE_URL}/reviews/professor/${professorId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchSimilarProfessors = async (professorId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/professors/similar/${professorId}`);
      if (response.ok) {
        const data = await response.json();
        setSimilarProfessors(data.professors || []);
      }
    } catch (err) {
      console.error('Failed to fetch similar professors:', err);
    }
  };

  const fetchMoreProfessors = async (professorId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/professors/more-professors?exclude_id=${professorId}&limit=6`);
      if (response.ok) {
        const data = await response.json();
        setMoreProfessors(data.professors || []);
      }
    } catch (err) {
      console.error('Failed to fetch more professors:', err);
    }
  };

  const getRatingColorClasses = (rating: number) => {
    if (rating >= 4.0) return 'bg-green-500 text-white';
    if (rating >= 3.0) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 !== 0
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
          if (index < fullStars) {
            return <Star key={index} className="w-5 h-5 text-yellow-400 fill-current" />
          } else if (index === fullStars && hasHalfStar) {
            return <Star key={index} className="w-5 h-5 text-yellow-400 fill-current opacity-50" />
          } else {
            return <Star key={index} className="w-5 h-5 text-gray-300" />
          }
        })}
        <span className="ml-2 text-lg font-semibold text-gray-900">
          {rating > 0 ? rating.toFixed(1) : 'N/A'}
        </span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading professor information...</p>
        </div>
      </div>
    );
  }

  if (error || !professor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Professor Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The professor you are looking for does not exist.'}</p>
          <Link href="/" className="text-indigo-600 hover:text-indigo-700">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{professor.name} - RateMyProf India</title>
        <meta name="description" content={`Rate and review ${professor.name} from ${professor.department}`} />
      </Head>

      {/* Success/Error Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-600 text-white' 
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            {notification.message}
            <button 
              onClick={() => setNotification(null)}
              className="ml-3 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-800 mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Search
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Professor Info - Left Column */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                {/* Professor Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-1">{professor.name}</h1>
                      <div className="flex flex-wrap items-center gap-4 text-gray-600">
                        <div className="flex items-center">
                          <Building className="w-4 h-4 mr-1" />
                          {professor.department}
                        </div>
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          Vishwakarma University
                        </div>
                        <div className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {professor.total_reviews} reviews
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Overall Rating */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Rating</h3>
                  <div className="flex items-center space-x-4">
                    {/* Colored Pill Badge */}
                    <div className={`inline-flex items-center px-4 py-2 rounded-full font-bold text-lg ${
                      (professor.average_rating || 0) >= 4 
                        ? 'bg-green-500 text-white' 
                        : (professor.average_rating || 0) >= 3 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      ★ {(professor.average_rating || 0).toFixed(1)}
                    </div>
                    <p className="text-sm text-gray-600">
                      Based on {professor.total_reviews} review{professor.total_reviews !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Compare and Similar Professors Section */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Compare & Explore</h3>
                      <button
                        onClick={() => setShowCompareModal(true)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                      >
                        Compare Professors
                      </button>
                    </div>
                  </div>

                  {/* Similar Professors - Below Compare Button */}
                  {similarProfessors.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-700 mb-3">Similar Professors from Same Department</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {similarProfessors.map((prof) => (
                          <Link
                            key={prof.id}
                            href={`/professors/${prof.id}`}
                            className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg hover:shadow-md transition-all border border-indigo-100"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-semibold text-gray-900">{prof.name}</h5>
                                <p className="text-sm text-gray-600">{prof.department}</p>
                              </div>
                              <div className="text-right ml-4">
                                <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${getRatingColorClasses(prof.average_rating)}`}>
                                  ★ {prof.average_rating.toFixed(1)}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{prof.total_reviews} reviews</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Subjects Taught */}
                {professor.subjects && professor.subjects.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Subjects Taught
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {professor.subjects.map((subject, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reviews Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Reviews ({reviews.length})</h3>
                
                {reviewsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading reviews...</p>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            {/* Overall rating pill badge */}
                            <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${
                              review.overall_rating >= 4 
                                ? 'bg-green-500 text-white' 
                                : review.overall_rating >= 3 
                                ? 'bg-yellow-500 text-white' 
                                : 'bg-red-500 text-white'
                            }`}>
                              ★ {review.overall_rating.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {review.course_name && <span className="font-medium">{review.course_name}</span>}
                              {review.semester && <span> • {review.semester}</span>}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Detailed ratings with horizontal progress bars */}
                        <div className="space-y-3 mb-3 text-sm">
                          {/* Clarity */}
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700 font-medium w-24">Clarity:</span>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    review.clarity_rating >= 4 ? 'bg-green-500' :
                                    review.clarity_rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(review.clarity_rating / 5) * 100}%` }}
                                />
                              </div>
                              <span className={`font-semibold w-8 ${
                                review.clarity_rating >= 4 ? 'text-green-600' :
                                review.clarity_rating >= 3 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {review.clarity_rating.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          {/* Helpfulness */}
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700 font-medium w-24">Helpfulness:</span>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    review.helpfulness_rating >= 4 ? 'bg-green-500' :
                                    review.helpfulness_rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(review.helpfulness_rating / 5) * 100}%` }}
                                />
                              </div>
                              <span className={`font-semibold w-8 ${
                                review.helpfulness_rating >= 4 ? 'text-green-600' :
                                review.helpfulness_rating >= 3 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {review.helpfulness_rating.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          {/* Overall */}
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700 font-medium w-24">Overall:</span>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    review.overall_rating >= 4 ? 'bg-green-500' :
                                    review.overall_rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(review.overall_rating / 5) * 100}%` }}
                                />
                              </div>
                              <span className={`font-semibold w-8 ${
                                review.overall_rating >= 4 ? 'text-green-600' :
                                review.overall_rating >= 3 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {review.overall_rating.toFixed(1)}
                              </span>
                            </div>
                          </div>

                          {/* Difficulty */}
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700 font-medium w-24">Difficulty:</span>
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all ${
                                    review.difficulty_rating <= 2 ? 'bg-green-500' :
                                    review.difficulty_rating <= 3 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${(review.difficulty_rating / 5) * 100}%` }}
                                />
                              </div>
                              <span className={`font-semibold w-8 ${
                                review.difficulty_rating <= 2 ? 'text-green-600' :
                                review.difficulty_rating <= 3 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {review.difficulty_rating.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {review.review_text && (
                          <div className="text-gray-700 bg-gray-50 p-3 rounded-lg mb-4">
                            <p>"{review.review_text}"</p>
                          </div>
                        )}
                        
                        {/* Review Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <ReviewVoting 
                            reviewId={review.id}
                            initialHelpfulCount={review.helpful_count || 0}
                            initialNotHelpfulCount={review.not_helpful_count || 0}
                            userVote={review.user_vote || null}
                          />
                          <FlagReviewButton 
                            reviewId={review.id}
                            onFlagSubmitted={() => {
                              // Optionally refresh reviews or show a success message
                              console.log('Review flagged successfully');
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No reviews yet. Be the first to review this professor!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Review Submission - Right Column */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate This Professor</h3>
                  
                  {!authLoading && user ? (
                    showReviewForm ? (
                      <ReviewSubmissionForm 
                        professor={professor}
                        onCancel={() => setShowReviewForm(false)}
                        onSubmit={() => {
                          setShowReviewForm(false)
                          // Refresh reviews after submission
                          if (id && typeof id === 'string') {
                            fetchReviews(id)
                            fetchProfessor(id) // Also refresh professor data to update review count
                          }
                          // Show success notification
                          setNotification({ message: '🎉 Your review has been submitted successfully!', type: 'success' })
                          setTimeout(() => setNotification(null), 5000) // Auto hide after 5 seconds
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => setShowReviewForm(true)}
                        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                      >
                        Write a Review
                      </button>
                    )
                  ) : authLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-3">
                        <Lock className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-gray-600">Sign in to review</span>
                      </div>
                      <div className="space-y-2">
                        <Link
                          href="/auth/login"
                          className="block w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 text-center"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/auth/signup"
                          className="block w-full border border-indigo-600 text-indigo-600 py-2 px-4 rounded-lg font-medium hover:bg-indigo-50 text-center"
                        >
                          Create Account
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* More Professors Section - Full Width Below Everything */}
          {moreProfessors.length > 0 && (
            <div className="mt-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">More Professors You Might Like</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {moreProfessors.map((prof) => (
                    <Link
                      key={prof.id}
                      href={`/professors/${prof.id}`}
                      className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg hover:shadow-lg transition-all border border-indigo-100"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{prof.name}</h4>
                          <p className="text-sm text-gray-600">{prof.department}</p>
                        </div>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full font-bold text-sm ${getRatingColorClasses(prof.average_rating)}`}>
                          ★ {prof.average_rating.toFixed(1)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">{prof.total_reviews} reviews</span>
                        <span className="text-indigo-600 font-medium">View Profile →</span>
                      </div>
                      {prof.subjects.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {prof.subjects.slice(0, 2).map((subject, idx) => (
                            <span key={idx} className="px-2 py-1 bg-white text-xs text-gray-600 rounded-full border border-gray-200">
                              {subject}
                            </span>
                          ))}
                          {prof.subjects.length > 2 && (
                            <span className="px-2 py-1 bg-white text-xs text-gray-600 rounded-full border border-gray-200">
                              +{prof.subjects.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compare Modal */}
        {showCompareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Compare Professors</h3>
                <button
                  onClick={() => setShowCompareModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <CompareProfessors 
                  currentProfessorId={id as string} 
                  currentProfessorName={professor?.name || ''}
                  onClose={() => setShowCompareModal(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}