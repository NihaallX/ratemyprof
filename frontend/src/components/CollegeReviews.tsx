import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Clock, CheckCircle, Plus, TrendingUp, Award, Wifi, Coffee, Building, BookOpen, Users as UsersIcon, Flag, ThumbsUp, ThumbsDown } from 'lucide-react';
import CollegeReviewForm from './CollegeReviewForm';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface CollegeRatings {
  food: number;
  internet: number;
  clubs: number;
  opportunities: number;
  facilities: number;
  teaching: number;
  overall: number;
}

interface CollegeReview {
  id: string;
  college_id: string;
  ratings: CollegeRatings;
  course_name: string;
  year_of_study: string;
  graduation_year?: number;
  review_text?: string;
  anonymous: boolean;
  status: string;
  created_at: string;
  helpful_count: number;
  not_helpful_count: number;
  user_vote?: 'helpful' | 'not_helpful' | null;
}

interface CollegeReviewsProps {
  collegeId: string;
  collegeName: string;
  canReview: boolean;
  onReviewSubmitted?: () => void;
}

const RATING_CATEGORIES = [
  { key: 'overall', label: 'Overall Quality', icon: Award, color: 'bg-purple-500' },
  { key: 'teaching', label: 'Teaching', icon: BookOpen, color: 'bg-blue-500' },
  { key: 'facilities', label: 'Facilities', icon: Building, color: 'bg-green-500' },
  { key: 'opportunities', label: 'Opportunities', icon: TrendingUp, color: 'bg-orange-500' },
  { key: 'clubs', label: 'Clubs', icon: UsersIcon, color: 'bg-pink-500' },
  { key: 'internet', label: 'Internet', icon: Wifi, color: 'bg-cyan-500' },
  { key: 'food', label: 'Food', icon: Coffee, color: 'bg-yellow-500' },
];

export default function CollegeReviews({ collegeId, collegeName, canReview, onReviewSubmitted }: CollegeReviewsProps) {
  const { session, user } = useAuth();
  const [reviews, setReviews] = useState<CollegeReview[]>([]);
  const [averageRatings, setAverageRatings] = useState<CollegeRatings | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [flagType, setFlagType] = useState('spam');
  const [flagReason, setFlagReason] = useState('');
  const [flagSubmitting, setFlagSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [collegeId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/college-reviews/college/${collegeId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews);
        setAverageRatings(data.average_ratings);
        setTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to fetch college reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmitted = () => {
    fetchReviews(); // Refresh reviews
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  const handleFlagReview = async () => {
    if (!selectedReviewId) return;
    
    if (!session?.access_token) {
      alert('Please log in to flag reviews');
      setShowFlagModal(false);
      return;
    }
    
    setFlagSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/college-review-moderation/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          college_review_id: selectedReviewId,
          flag_type: flagType,
          reason: flagReason
        })
      });

      if (response.ok) {
        alert('Review flagged successfully. Our moderators will review it.');
        setShowFlagModal(false);
        setSelectedReviewId(null);
        setFlagType('spam');
        setFlagReason('');
      } else {
        const error = await response.json();
        alert(`Failed to flag review: ${error.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to flag review:', err);
      alert('Failed to flag review. Please try again.');
    } finally {
      setFlagSubmitting(false);
    }
  };

  const openFlagModal = (reviewId: string) => {
    setSelectedReviewId(reviewId);
    setShowFlagModal(true);
  };

  const handleVote = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    try {
      if (!session?.access_token) {
        alert('Please log in to vote on reviews');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/college-reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ vote_type: voteType })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the review in the state
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review.id === reviewId
              ? {
                  ...review,
                  helpful_count: data.helpful_count,
                  not_helpful_count: data.not_helpful_count,
                  user_vote: voteType
                }
              : review
          )
        );
      } else {
        const error = await response.json();
        alert(`Failed to vote: ${error.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to vote:', err);
      alert('Failed to vote. Please try again.');
    }
  };

  const removeVote = async (reviewId: string) => {
    try {
      if (!session?.access_token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/college-reviews/${reviewId}/vote`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the review in the state
        setReviews(prevReviews =>
          prevReviews.map(review =>
            review.id === reviewId
              ? {
                  ...review,
                  helpful_count: data.helpful_count,
                  not_helpful_count: data.not_helpful_count,
                  user_vote: null
                }
              : review
          )
        );
      }
    } catch (err) {
      console.error('Failed to remove vote:', err);
    }
  };

  const toggleVote = async (reviewId: string, voteType: 'helpful' | 'not_helpful') => {
    const review = reviews.find(r => r.id === reviewId);
    if (!review) return;

    if (review.user_vote === voteType) {
      // Same vote - remove it
      await removeVote(reviewId);
    } else {
      // Different vote or no vote - add/update it
      await handleVote(reviewId, voteType);
    }
  };

  // Fetch user votes for all reviews
  useEffect(() => {
    const fetchUserVotes = async () => {
      if (!session?.access_token || reviews.length === 0) return;

      try {
        const votesPromises = reviews.map(review =>
          fetch(`${API_BASE_URL}/college-reviews/${review.id}/user-vote`, {
            headers: { 'Authorization': `Bearer ${session.access_token}` }
          })
            .then(res => res.ok ? res.json() : null)
            .then(data => ({ reviewId: review.id, vote: data?.vote_type || null }))
            .catch(() => ({ reviewId: review.id, vote: null }))
        );

        const votes = await Promise.all(votesPromises);
        
        setReviews(prevReviews =>
          prevReviews.map(review => {
            const userVote = votes.find(v => v.reviewId === review.id);
            return userVote ? { ...review, user_vote: userVote.vote } : review;
          })
        );
      } catch (err) {
        console.error('Failed to fetch user votes:', err);
      }
    };

    fetchUserVotes();
  }, [reviews.length, session?.access_token]);

  const getRatingColor = (rating: number) => {
    if (rating >= 4.0) return 'bg-green-100 text-green-800 border-green-300';
    if (rating >= 3.0) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const formatRating = (rating: number) => {
    return rating.toFixed(1);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="bg-white rounded-xl p-8 shadow-sm border">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="text-center">
                <div className="h-16 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Rating Dashboard */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{collegeName}</h2>
              <div className="flex items-center space-x-4 text-blue-100">
                <span className="text-sm">{total} student reviews</span>
                {averageRatings && (
                  <span className="text-sm">
                    Overall {formatRating(averageRatings.overall)}/5.0
                  </span>
                )}
              </div>
            </div>
            {/* Always show Rate button */}
            <button 
              onClick={() => setShowReviewForm(true)}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center space-x-2 shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Rate</span>
            </button>
          </div>
        </div>

        {/* Rating Categories Grid */}
        {averageRatings && (
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {RATING_CATEGORIES.map((category) => {
                const rating = averageRatings[category.key as keyof CollegeRatings];
                const IconComponent = category.icon;
                
                return (
                  <div key={category.key} className="text-center group hover:scale-105 transition-transform">
                    <div className={`${category.color} text-white p-4 rounded-lg mb-2 mx-auto w-16 h-16 flex items-center justify-center shadow-md`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-1">{category.label}</div>
                    <div className={`inline-block px-3 py-1 rounded-full border text-lg font-bold ${getRatingColor(rating)}`}>
                      {formatRating(rating)}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Based on {total} student review{total !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        )}

        {!averageRatings && (
          <div className="p-8 text-center">
            <div className="mb-4">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No reviews yet</h3>
            <p className="text-gray-500 mb-6">Be the first to review {collegeName}!</p>
            {/* Always show Rate button */}
            <button 
              onClick={() => setShowReviewForm(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto shadow-md"
            >
              <Plus className="w-5 h-5" />
              <span>Write First Review</span>
            </button>
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reviews</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`inline-block px-3 py-1 rounded-full border text-lg font-bold ${getRatingColor(review.ratings.overall)}`}>
                      {formatRating(review.ratings.overall)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{review.course_name}</span>
                      <span className="mx-2">•</span>
                      <span>{review.year_of_study}</span>
                      {review.graduation_year && (
                        <>
                          <span className="mx-2">•</span>
                          <span>Class of {review.graduation_year}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {/* Individual Ratings */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
                  {RATING_CATEGORIES.slice(1).map((category) => {
                    const rating = review.ratings[category.key as keyof CollegeRatings];
                    return (
                      <div key={category.key} className="text-center">
                        <div className="text-xs text-gray-600 mb-1">{category.label}</div>
                        <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${getRatingColor(rating)}`}>
                          {formatRating(rating)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {review.review_text && (
                  <p className="text-gray-700 mb-4 line-clamp-3">{review.review_text}</p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Anonymous Student</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    {/* Helpful/Not Helpful Voting */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleVote(review.id, 'helpful')}
                        className={`flex items-center space-x-1 transition-colors ${
                          review.user_vote === 'helpful'
                            ? 'text-green-600 font-medium'
                            : 'text-gray-400 hover:text-green-600'
                        }`}
                        title="Mark as helpful"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{review.helpful_count}</span>
                      </button>
                      <button
                        onClick={() => toggleVote(review.id, 'not_helpful')}
                        className={`flex items-center space-x-1 transition-colors ${
                          review.user_vote === 'not_helpful'
                            ? 'text-red-600 font-medium'
                            : 'text-gray-400 hover:text-red-600'
                        }`}
                        title="Mark as not helpful"
                      >
                        <ThumbsDown className="w-4 h-4" />
                        <span>{review.not_helpful_count}</span>
                      </button>
                    </div>
                    <button
                      onClick={() => openFlagModal(review.id)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Flag this review"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Flag</span>
                    </button>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {reviews.length > 3 && (
            <div className="px-6 py-4 border-t border-gray-100 text-center">
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                View All {reviews.length} Reviews
              </button>
            </div>
          )}
        </div>
      )}

      {/* Review Form Modal */}
      {showReviewForm && (
        <CollegeReviewForm
          collegeId={collegeId}
          collegeName={collegeName}
          onClose={() => setShowReviewForm(false)}
          onSubmit={handleReviewSubmitted}
        />
      )}

      {/* Flag Review Modal */}
      {showFlagModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Flag Review</h3>
                <button
                  onClick={() => {
                    setShowFlagModal(false);
                    setSelectedReviewId(null);
                    setFlagType('spam');
                    setFlagReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for flagging
                  </label>
                  <select
                    value={flagType}
                    onChange={(e) => setFlagType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="spam">Spam</option>
                    <option value="fake">Fake Review</option>
                    <option value="offensive">Offensive Content</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional details (optional)
                  </label>
                  <textarea
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="Please provide any additional context..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowFlagModal(false);
                      setSelectedReviewId(null);
                      setFlagType('spam');
                      setFlagReason('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={flagSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFlagReview}
                    disabled={flagSubmitting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {flagSubmitting ? 'Submitting...' : 'Flag Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}