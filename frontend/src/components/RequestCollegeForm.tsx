/**
 * Request College Form Component
 * Allows users to request their college/university to be added to the platform
 */

import { useState } from 'react'
import { Building2, X, Mail, MapPin, User, Loader2, CheckCircle, Instagram } from 'lucide-react'

interface RequestCollegeFormProps {
  isOpen: boolean
  onClose: () => void
}

export default function RequestCollegeForm({ isOpen, onClose }: RequestCollegeFormProps) {
  const [formData, setFormData] = useState({
    collegeName: '',
    city: '',
    state: '',
    yourName: '',
    yourEmail: '',
    instagramId: '',
    additionalInfo: ''
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Using Web3Forms - simple and free, no account needed
      // Get your access key from: https://web3forms.com
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          access_key: 'fda969e0-0d39-4aaa-a06a-425e99005ce0', // Replace with your Web3Forms access key
          from_name: formData.yourName,
          email: formData.yourEmail,
          subject: `New College Request: ${formData.collegeName}`,
          message: `
College/University: ${formData.collegeName}
City: ${formData.city}
State: ${formData.state}

Requester: ${formData.yourName}
Email: ${formData.yourEmail}
${formData.instagramId ? `Instagram: @${formData.instagramId}` : ''}

${formData.additionalInfo ? `Additional Information:\n${formData.additionalInfo}` : ''}
          `.trim(),
          to: 'ratemyprofgn@gmail.com'
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit request')
      }

      setSubmitted(true)
      setTimeout(() => {
        handleClose()
      }, 3000)
    } catch (err) {
      setError('Failed to submit request. Please try again or email us directly at ratemyprofgn@gmail.com')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      collegeName: '',
      city: '',
      state: '',
      yourName: '',
      yourEmail: '',
      instagramId: '',
      additionalInfo: ''
    })
    setSubmitted(false)
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6 sm:p-8">
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {submitted ? (
            // Success Message
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
              <p className="text-gray-600">
                Thank you for your request. We'll review it and get back to you soon.
              </p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <Building2 className="w-8 h-8 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Request Your College</h2>
                </div>
                <p className="text-gray-600 text-sm">
                  Don't see your college or university? Let us know and we'll add it to our platform!
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* College Name */}
                <div>
                  <label htmlFor="collegeName" className="block text-sm font-medium text-gray-700 mb-1">
                    College/University Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="collegeName"
                      required
                      value={formData.collegeName}
                      onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Indian Institute of Technology, Delhi"
                    />
                  </div>
                </div>

                {/* City and State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        id="city"
                        required
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., Mumbai"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="state"
                      required
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Maharashtra"
                    />
                  </div>
                </div>

                {/* Your Name */}
                <div>
                  <label htmlFor="yourName" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="yourName"
                      required
                      value={formData.yourName}
                      onChange={(e) => setFormData({ ...formData, yourName: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                {/* Your Email */}
                <div>
                  <label htmlFor="yourEmail" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      id="yourEmail"
                      required
                      value={formData.yourEmail}
                      onChange={(e) => setFormData({ ...formData, yourEmail: e.target.value })}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                {/* Instagram ID */}
                <div>
                  <label htmlFor="instagramId" className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram Handle (Optional)
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <div className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                      @
                    </div>
                    <input
                      type="text"
                      id="instagramId"
                      value={formData.instagramId}
                      onChange={(e) => setFormData({ ...formData, instagramId: e.target.value.replace('@', '') })}
                      className="w-full pl-14 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="your_instagram"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    We'd love to thank you personally when we add your college! 🎉
                  </p>
                </div>

                {/* Additional Info */}
                <div>
                  <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Information (Optional)
                  </label>
                  <textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    placeholder="Any additional details about the college..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Request'
                    )}
                  </button>
                </div>
              </form>

              {/* Direct Email Option */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  You can also email us directly at{' '}
                  <a href="mailto:ratemyprofgn@gmail.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                    ratemyprofgn@gmail.com
                  </a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
