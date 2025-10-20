import React, { useState } from 'react';
import { X, Star, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ColorBarRating from './ColorBarRating';

interface CollegeReviewFormProps {
  collegeId: string;
  collegeName: string;
  onClose: () => void;
  onSubmit: () => void;
}

interface FormData {
  food_rating: number;
  internet_rating: number;
  clubs_rating: number;
  opportunities_rating: number;
  facilities_rating: number;
  teaching_rating: number;
  overall_rating: number;
  course_name: string;
  year_of_study: string;
  graduation_year: string;
  review_text: string;
  // Removed: anonymous (all reviews are anonymous by default)
}

const RATING_CATEGORIES = [
  { key: 'food_rating', label: 'Food Quality', icon: '🍽️', description: 'Quality and variety of food in campus cafeteria' },
  { key: 'internet_rating', label: 'Internet Connectivity', icon: '📶', description: 'WiFi speed and reliability across campus' },
  { key: 'clubs_rating', label: 'Clubs & Activities', icon: '🎭', description: 'Variety and quality of extracurricular activities' },
  { key: 'opportunities_rating', label: 'Career Opportunities', icon: '💼', description: 'Internships, placements, and career support' },
  { key: 'facilities_rating', label: 'Campus Facilities', icon: '🏫', description: 'Libraries, labs, sports facilities, and infrastructure' },
  { key: 'teaching_rating', label: 'Teaching Quality', icon: '👨‍🏫', description: 'Quality of faculty and teaching methods' },
  { key: 'overall_rating', label: 'Overall Experience', icon: '⭐', description: 'Your overall satisfaction with the college' },
];

const YEAR_OPTIONS = [
  '1st Year',
  '2nd Year', 
  '3rd Year',
  '4th Year',
  '5th Year',
  'Graduate',
  'Postgraduate'
];

export default function CollegeReviewForm({ collegeId, collegeName, onClose, onSubmit }: CollegeReviewFormProps) {
  const { user, session } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    food_rating: 0,
    internet_rating: 0,
    clubs_rating: 0,
    opportunities_rating: 0,
    facilities_rating: 0,
    teaching_rating: 0,
    overall_rating: 0,
    course_name: '',
    year_of_study: '',
    graduation_year: '',
    review_text: ''
    // All reviews are anonymous by default
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(!user);

  const handleRatingChange = (category: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      [category]: rating
    }));
    
    // Clear error for this field
    if (errors[category]) {
      setErrors(prev => ({
        ...prev,
        [category]: ''
      }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check required ratings
    RATING_CATEGORIES.forEach(category => {
      if (formData[category.key as keyof FormData] === 0) {
        newErrors[category.key] = `${category.label} rating is required`;
      }
    });

    // Check required fields
    if (!formData.course_name.trim()) {
      newErrors.course_name = 'Course name is required';
    }
    
    if (!formData.year_of_study) {
      newErrors.year_of_study = 'Year of study is required';
    }

    if (!formData.review_text.trim()) {
      newErrors.review_text = 'Review text is required';
    } else if (formData.review_text.trim().length < 50) {
      newErrors.review_text = 'Review must be at least 50 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !session) {
      setShowLoginPrompt(true);
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        college_id: collegeId,
        ratings: {
          food: formData.food_rating,
          internet: formData.internet_rating,
          clubs: formData.clubs_rating,
          opportunities: formData.opportunities_rating,
          facilities: formData.facilities_rating,
          teaching: formData.teaching_rating,
          overall: formData.overall_rating
        },
        course_name: formData.course_name,
        year_of_study: formData.year_of_study,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        review_text: formData.review_text
      };

      const response = await fetch('/api/college-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(reviewData)
      });

      if (response.ok) {
        onSubmit();
        onClose();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.detail || 'Failed to submit review' });
      }
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showLoginPrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-md w-full">
          <div className="p-6 text-center">
            <div className="mb-4">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-600 mb-6">
              You need to be logged in to review colleges. This helps us maintain quality and prevent spam.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Review {collegeName}</h3>
              <p className="text-sm text-gray-600 mt-1">Share your honest experience to help other students</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Rating Categories */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Rate Your Experience</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {RATING_CATEGORIES.map((category) => (
                <div key={category.key}>
                  <ColorBarRating
                    rating={formData[category.key as keyof FormData] as number}
                    onRatingChange={(rating) => handleRatingChange(category.key, rating)}
                    label={`${category.icon} ${category.label}`}
                    description={category.description}
                    error={errors[category.key]}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Course Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course/Program *
                </label>
                <input
                  type="text"
                  value={formData.course_name}
                  onChange={(e) => handleInputChange('course_name', e.target.value)}
                  placeholder="e.g., Computer Science, MBA, B.Tech"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.course_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.course_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Year *
                </label>
                <select
                  value={formData.year_of_study}
                  onChange={(e) => handleInputChange('year_of_study', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select year</option>
                  {YEAR_OPTIONS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                {errors.year_of_study && (
                  <p className="text-red-500 text-xs mt-1">{errors.year_of_study}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Graduation Year
                </label>
                <input
                  type="number"
                  value={formData.graduation_year}
                  onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                  placeholder="e.g., 2024"
                  min="2000"
                  max="2030"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Written Review */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Review *
            </label>
            <textarea
              value={formData.review_text}
              onChange={(e) => handleInputChange('review_text', e.target.value)}
              placeholder="Share your detailed experience about the college. What did you like? What could be improved? Your honest feedback helps other students make informed decisions."
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                Minimum 50 characters required
              </span>
              <span className="text-xs text-gray-500">
                {formData.review_text.length}/1000
              </span>
            </div>
            {errors.review_text && (
              <p className="text-red-500 text-xs mt-1">{errors.review_text}</p>
            )}
          </div>

          {/* Privacy Option */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  🔒 All reviews are anonymous by default
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Your identity will never be publicly displayed. Only administrators can see review authors for moderation purposes.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Submit Review</span>
                </>
              )}
            </button>
          </div>

          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}