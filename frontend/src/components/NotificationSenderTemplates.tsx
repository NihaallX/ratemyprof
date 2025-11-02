/**
 * Template-Based Admin Notification Sender Component
 * Allows admins to send notifications using pre-built professional templates
 */

import { useState, useEffect } from 'react'
import { Send, Bell, AlertCircle, CheckCircle, Sparkles } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

interface Template {
  id: string
  title: string
  message: string
  icon: string
  type: string
  required_fields: string[]
}

interface NotificationSenderProps {
  onNotificationSent?: () => void
}

export default function NotificationSenderTemplates({ onNotificationSent }: NotificationSenderProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templateData, setTemplateData] = useState<Record<string, string>>({})
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    count?: number
  } | null>(null)

  // Fetch available templates on mount
  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/notifications/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    // Initialize template data with empty strings for all required fields
    const initialData: Record<string, string> = {}
    template.required_fields.forEach(field => {
      initialData[field] = ''
    })
    setTemplateData(initialData)
    setResult(null)
  }

  const handleDataChange = (field: string, value: string) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const renderPreview = () => {
    if (!selectedTemplate) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-500 text-sm">
          Select a template to see preview
        </div>
      )
    }

    // Replace placeholders in title and message with actual data
    let previewTitle = selectedTemplate.title
    let previewMessage = selectedTemplate.message

    Object.keys(templateData).forEach(field => {
      const value = templateData[field] || `{${field}}`
      previewTitle = previewTitle.replace(`{${field}}`, value)
      previewMessage = previewMessage.replace(`{${field}}`, value)
    })

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">{selectedTemplate.icon}</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {previewTitle}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {previewMessage}
            </p>
            <p className="text-xs text-gray-400 mt-1">Just now</p>
          </div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
        </div>
      </div>
    )
  }

  const handleSend = async () => {
    if (!selectedTemplate) {
      setResult({
        success: false,
        message: 'Please select a template'
      })
      return
    }

    // Check if all required fields are filled
    const missingFields = selectedTemplate.required_fields.filter(
      field => !templateData[field]?.trim()
    )

    if (missingFields.length > 0) {
      setResult({
        success: false,
        message: `Please fill in: ${missingFields.join(', ')}`
      })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`${API_BASE_URL}/notifications/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          template_id: selectedTemplate.id,
          template_data: templateData,
          metadata: {
            sent_at: new Date().toISOString(),
            sender: 'admin',
            template: selectedTemplate.id
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          count: data.notification_count
        })
        
        // Clear form
        setSelectedTemplate(null)
        setTemplateData({})
        
        // Callback
        if (onNotificationSent) {
          onNotificationSent()
        }
      } else {
        setResult({
          success: false,
          message: data.detail || 'Failed to send notification'
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error. Please try again.'
      })
    } finally {
      setSending(false)
    }
  }

  const formatFieldName = (field: string) => {
    // Convert snake_case to Title Case
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getFieldPlaceholder = (field: string) => {
    const placeholders: Record<string, string> = {
      'professor_name': 'e.g., Dr. Sharma',
      'review_count': 'e.g., 25',
      'department': 'e.g., Computer Science',
      'college_name': 'e.g., VIT University',
      'city': 'e.g., Pune',
      'state': 'e.g., Maharashtra',
      'milestone': 'e.g., 100',
      'total_reviews': 'e.g., 500',
      'new_professors': 'e.g., 10',
      'active_users': 'e.g., 150',
      'subject_name': 'e.g., Data Structures',
      'top_professor_1': 'e.g., Dr. Kumar (4.8★)',
      'top_professor_2': 'e.g., Dr. Patel (4.7★)',
      'top_professor_3': 'e.g., Dr. Singh (4.6★)',
      'celebration_title': 'e.g., 1000 Users!',
      'celebration_message': 'e.g., Thanks for making this journey amazing!',
      'announcement_title': 'e.g., New Feature',
      'announcement_message': 'e.g., Check out our new comparison tool!'
    }
    return placeholders[field] || `Enter ${formatFieldName(field)}`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600">Loading templates...</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">
          Template-Based Notifications
        </h2>
      </div>

      <div className="space-y-4">
        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Template <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedTemplate?.id || ''}
            onChange={(e) => {
              const template = templates.find(t => t.id === e.target.value)
              if (template) handleTemplateSelect(template)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- Choose a notification template --</option>
            {templates.map(template => (
              <option key={template.id} value={template.id}>
                {template.icon} {template.title.split('{')[0].trim()}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {templates.length} professional templates available
          </p>
        </div>

        {/* Dynamic Fields for Selected Template */}
        {selectedTemplate && selectedTemplate.required_fields.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">
              📝 Fill Template Data
            </h3>
            <div className="space-y-3">
              {selectedTemplate.required_fields.map(field => (
                <div key={field}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {formatFieldName(field)} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={templateData[field] || ''}
                    onChange={(e) => handleDataChange(field, e.target.value)}
                    placeholder={getFieldPlaceholder(field)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Fields Message */}
        {selectedTemplate && selectedTemplate.required_fields.length === 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✅ This template is ready to send - no additional data needed!
            </p>
          </div>
        )}

        {/* Preview */}
        {selectedTemplate && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            {renderPreview()}
          </div>
        )}

        {/* Result Message */}
        {result && (
          <div className={`flex items-start space-x-2 p-3 rounded-lg ${
            result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
          }`}>
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.message}
              </p>
              {result.success && result.count && (
                <p className="text-xs text-green-600 mt-1">
                  📨 Sent to {result.count} user{result.count !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Send Button */}
        <button
          onClick={handleSend}
          disabled={sending || !selectedTemplate}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            sending || !selectedTemplate
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {sending ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Sending to all users...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Send to All Users</span>
            </>
          )}
        </button>

        {/* Info */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
          <p className="text-xs text-indigo-800">
            💡 <strong>Professional Templates:</strong> Pre-written messages for consistency and quality. 
            Just fill in the data and send! All templates follow best practices for user engagement.
          </p>
        </div>
      </div>
    </div>
  )
}
