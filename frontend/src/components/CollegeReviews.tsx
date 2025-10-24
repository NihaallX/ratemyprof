import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Clock, CheckCircle, Plus, TrendingUp, Award, Wifi, Coffee, Building, BookOpen, Users as UsersIcon } from 'lucide-react';
import CollegeReviewForm from './CollegeReviewForm';
import { API_BASE_URL } from '../config/api';

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
  const [reviews, setReviews] = useState<CollegeReview[]>([]);
  const [averageRatings, setAverageRatings] = useState<CollegeRatings | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);

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
                    <span>{review.helpful_count} helpful</span>
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
    </div>
  );
}