/**
 * Review Submission Form Component
 * Multi-step form for submitting professor reviews
 */

import { useState } from 'react'
import { Professor } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { supabase } from '../lib/supabase'
import Link from 'next/link'
import ColorBarRating from './ColorBarRating'
import { API_BASE_URL } from '../config/api'
import { 
  Star, 
  BookOpen, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ReviewSubmissionFormProps {
  professor: Professor
  onCancel: () => void
  onSubmit: (reviewData: ReviewFormData) => void
}

interface ReviewFormData {
  professor_id: string
  course_name: string
  semester: string
  academic_year: string
  overall_rating: number
  difficulty_rating: number
  clarity_rating: number
  helpfulness_rating: number
  attendance_mandatory: boolean | null
  assignment_load: 'light' | 'moderate' | 'heavy'
  review_text: string
  tags: string[]
  // Removed: anonymous, anon_display_name (all reviews are anonymous by default)
}

const SEMESTERS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Sem 7', 'Sem 8']
const ACADEMIC_YEARS = ['2024-25', '2023-24', '2022-23']
const AVAILABLE_TAGS = [
  'Amazing Lectures',
  'Tough Grader',
  'Caring',
  'Clear Explanations',
  'Helpful',
  'Inspiring',
  'Fair Testing',
  'Good Feedback',
  'Approachable',
  'Expert Knowledge'
]

export default function ReviewSubmissionForm({ professor, onCancel, onSubmit }: ReviewSubmissionFormProps) {
  const { user } = useAuth()
  const { showToast } = useNotification()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [guidelinesExpanded, setGuidelinesExpanded] = useState(false)
  
  const [formData, setFormData] = useState<ReviewFormData>({
    professor_id: professor.id,
    course_name: '',
    semester: '',
    academic_year: ACADEMIC_YEARS[0], // Current year
    overall_rating: 0,
    difficulty_rating: 0,
    clarity_rating: 0,
    helpfulness_rating: 0,
    attendance_mandatory: null,
    assignment_load: 'moderate',
    review_text: '',
    tags: []
    // All reviews are anonymous by default - no need to specify
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: Record<string, string> = {}

    switch (stepNumber) {
      case 1:
        if (!formData.course_name) newErrors.course_name = 'Please enter a course name'
        if (!formData.semester) newErrors.semester = 'Please select semester'
        if (!formData.academic_year) newErrors.academic_year = 'Please select academic year'
        break
      
      case 2:
        if (formData.overall_rating === 0) newErrors.overall_rating = 'Please provide overall rating'
        if (formData.difficulty_rating === 0) newErrors.difficulty_rating = 'Please rate difficulty'
        if (formData.clarity_rating === 0) newErrors.clarity_rating = 'Please rate teaching clarity'
        if (formData.helpfulness_rating === 0) newErrors.helpfulness_rating = 'Please rate helpfulness'
        break

      case 3:
        // Optional step - no required fields
        break

      case 4:
        if (formData.review_text.trim().length < 50) {
          newErrors.review_text = 'Please write at least 50 characters'
        }
        if (formData.review_text.trim().length > 1000) {
          newErrors.review_text = 'Review must be less than 1000 characters'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handlePrevious = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setSubmitting(true)
    try {
      // Prepare API payload (NO anonymous fields - all reviews anonymous by default)
      const reviewPayload = {
        professor_id: professor.id,
        ratings: {
          clarity: formData.clarity_rating || 1,
          helpfulness: formData.helpfulness_rating || 1,
          workload: 6 - (formData.difficulty_rating || 1), // Invert difficulty (1=hard becomes 5=light workload)
          engagement: formData.overall_rating || 1
        },
        review_text: formData.review_text?.trim() || null,
        semester_taken: formData.semester || null,
        course_taken: formData.course_name || null
        // Removed: anonymous, anon_display_name (all reviews are anonymous)
      }

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No authentication session found')
      }

      // Submit to backend API
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(reviewPayload)
      })

      if (!response.ok) {
        const error = await response.json()
        
        // Check if it's a duplicate review error (409 conflict)
        if (response.status === 409) {
          setShowDuplicateModal(true)
          return
        }
        
        throw new Error(error.detail || 'Failed to submit review')
      }

      const reviewResult = await response.json()
      console.log('Review submitted successfully:', reviewResult)
      showToast('Review submitted successfully!', 'success')
      onSubmit(formData)
    } catch (error) {
      console.error('Failed to submit review:', error)
      showToast(
        error instanceof Error ? error.message : 'Failed to submit review. Please try again.',
        'error'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const renderColorBarRating = (
    rating: number, 
    onRatingChange: (rating: number) => void,
    label: string,
    description?: string,
    errorKey?: string
  ) => (
    <ColorBarRating
      rating={rating}
      onRatingChange={onRatingChange}
      label={label}
      description={description}
      error={errorKey ? errors[errorKey] : undefined}
    />
  )

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Settings & Course Information</h3>
            
            {/* Privacy Notice - All Reviews Anonymous */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    🔒 All reviews are anonymous by default
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Your identity will never be publicly displayed. Only administrators can see review authors for moderation purposes. All reviews show as "Verified Student".
                  </p>
                </div>
              </div>
            </div>
            
            {/* Course Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Course/Subject Name
              </label>
              <input
                type="text"
                value={formData.course_name}
                onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                placeholder="Enter course name (e.g., Data Structures, Machine Learning, etc.)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {errors.course_name && <p className="text-red-600 text-xs mt-1">{errors.course_name}</p>}
              
              {/* Optional: Show professor's subjects as suggestions */}
              {professor.subjects && professor.subjects.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Popular subjects for this professor:</p>
                  <div className="flex flex-wrap gap-1">
                    {professor.subjects.map((subject, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData({...formData, course_name: subject})}
                        className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester Taken
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({...formData, semester: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select semester</option>
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
              {errors.semester && <p className="text-red-600 text-xs mt-1">{errors.semester}</p>}
            </div>

            {/* Academic Year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Academic Year
              </label>
              <select
                value={formData.academic_year}
                onChange={(e) => setFormData({...formData, academic_year: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {ACADEMIC_YEARS.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate the Professor</h3>
            
            {renderColorBarRating(
              formData.overall_rating,
              (rating) => setFormData({...formData, overall_rating: rating}),
              'Overall Rating',
              'Your overall experience with this professor',
              'overall_rating'
            )}

            {renderColorBarRating(
              formData.difficulty_rating,
              (rating) => setFormData({...formData, difficulty_rating: rating}),
              'Difficulty Level',
              '1 = Very Easy, 5 = Bohot (Very) Hard',
              'difficulty_rating'
            )}

            {renderColorBarRating(
              formData.clarity_rating,
              (rating) => setFormData({...formData, clarity_rating: rating}),
              'Teaching Clarity',
              'How clear and understandable were the explanations?',
              'clarity_rating'
            )}

            {renderColorBarRating(
              formData.helpfulness_rating,
              (rating) => setFormData({...formData, helpfulness_rating: rating}),
              'Helpfulness',
              'How willing and helpful was the professor outside class?',
              'helpfulness_rating'
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Experience</h3>
            
            {/* Attendance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Was attendance mandatory?
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="true"
                    checked={formData.attendance_mandatory === true}
                    onChange={() => setFormData({...formData, attendance_mandatory: true})}
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="false"
                    checked={formData.attendance_mandatory === false}
                    onChange={() => setFormData({...formData, attendance_mandatory: false})}
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  No
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="null"
                    checked={formData.attendance_mandatory === null}
                    onChange={() => setFormData({...formData, attendance_mandatory: null})}
                    className="mr-2 text-indigo-600 focus:ring-indigo-500"
                  />
                  Optional/Mixed
                </label>
              </div>
            </div>

            {/* Assignment Load */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment/Workload
              </label>
              <div className="flex space-x-4">
                {(['light', 'moderate', 'heavy'] as const).map((load) => (
                  <label key={load} className="flex items-center">
                    <input
                      type="radio"
                      value={load}
                      checked={formData.assignment_load === load}
                      onChange={() => setFormData({...formData, assignment_load: load})}
                      className="mr-2 text-indigo-600 focus:ring-indigo-500"
                    />
                    {load.charAt(0).toUpperCase() + load.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Written Review & Tags</h3>
            
            {/* Guidelines Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setGuidelinesExpanded(!guidelinesExpanded)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center">
                  <Info className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Guidelines</span>
                </div>
                {guidelinesExpanded ? (
                  <ChevronUp className="w-5 h-5 text-blue-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-blue-600" />
                )}
              </button>
              
              {guidelinesExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  <ul className="text-sm text-blue-800 space-y-1.5">
                    <li>• Your rating could be removed if you use profanity or derogatory terms.</li>
                    <li>• Don't claim that the professor shows bias or favoritism for or against students.</li>
                    <li>• Don't forget to proof read!</li>
                  </ul>
                  <Link
                    href="/guidelines"
                    target="_blank"
                    className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 underline"
                  >
                    View all guidelines
                  </Link>
                </div>
              )}
            </div>
            
            {/* Instruction Text */}
            <p className="text-sm text-gray-600">
              Discuss the professor's professional abilities including teaching style and ability to convey the material clearly
            </p>
            
            {/* Review Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review
                <span className="text-gray-500 text-xs block">
                  Share your experience to help fellow students (50-1000 characters)
                </span>
              </label>
              <textarea
                value={formData.review_text}
                onChange={(e) => setFormData({...formData, review_text: e.target.value})}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Describe your experience with this professor. How were the lectures? Was the professor helpful? Any tips for future students?"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>
                  {formData.review_text.length}/1000 characters
                </span>
                <span>
                  {formData.review_text.length < 50 ? `${50 - formData.review_text.length} more needed` : ''}
                </span>
              </div>
              {errors.review_text && <p className="text-red-600 text-xs mt-1">{errors.review_text}</p>}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Tags (Optional)
                <span className="text-gray-500 text-xs block">Select tags that describe this professor</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const newTags = formData.tags.includes(tag)
                        ? formData.tags.filter(t => t !== tag)
                        : [...formData.tags, tag]
                      setFormData({...formData, tags: newTags})
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map((stepNumber) => (
            <div
              key={stepNumber}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                stepNumber === step
                  ? 'bg-indigo-600 text-white'
                  : stepNumber < step
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {stepNumber < step ? <CheckCircle className="w-4 h-4" /> : stepNumber}
            </div>
          ))}
        </div>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200">
        <button
          onClick={handlePrevious}
          disabled={step === 1}
          className="flex items-center px-4 py-2 text-gray-600 disabled:text-gray-400 hover:text-gray-800 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </button>

        {step < 4 ? (
          <button
            onClick={handleNext}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Review
              </>
            )}
          </button>
        )}
      </div>

      {/* Duplicate Review Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-amber-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                Already Reviewed
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              You've already submitted a review for <strong>{professor.name}</strong>. 
              Each user can only review a professor once to maintain authenticity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowDuplicateModal(false)
                  // Navigate to my-reviews page to see their existing review
                  window.location.href = '/my-reviews'
                }}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                View My Reviews
              </button>
              
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}