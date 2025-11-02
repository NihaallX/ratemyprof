/**
 * Admin Notification Sender Component
 * Allows admins to send broadcast notifications to all users
 */

import { useState } from 'react'
import { Send, Bell, AlertCircle, CheckCircle } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

interface NotificationSenderProps {
  onNotificationSent?: () => void
}

export default function NotificationSender({ onNotificationSent }: NotificationSenderProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<'custom' | 'system'>('custom')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    count?: number
  } | null>(null)

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setResult({
        success: false,
        message: 'Please fill in both title and message'
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
          title,
          message,
          type,
          metadata: {
            sent_at: new Date().toISOString(),
            sender: 'admin'
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
        setTitle('')
        setMessage('')
        
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

  const previewNotification = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">
            {type === 'custom' ? '📢' : '🔔'}
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">
              {title || 'Notification Title'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {message || 'Notification message will appear here...'}
            </p>
            <p className="text-xs text-gray-400 mt-1">Just now</p>
          </div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Bell className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">
          Broadcast Notification
        </h2>
      </div>

      <div className="space-y-4">
        {/* Notification Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Type
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="custom"
                checked={type === 'custom'}
                onChange={(e) => setType(e.target.value as 'custom')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">📢 Custom Announcement</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="type"
                value="system"
                checked={type === 'system'}
                onChange={(e) => setType(e.target.value as 'system')}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">🔔 System Notification</span>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="notification-title" className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="notification-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., New Feature Launched! 🎉"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 characters
          </p>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="notification-message" className="block text-sm font-medium text-gray-700 mb-1">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            id="notification-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your message here... Keep it short and engaging!"
            rows={4}
            maxLength={300}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">
            {message.length}/300 characters
          </p>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preview
          </label>
          {previewNotification()}
        </div>

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
          disabled={sending || !title.trim() || !message.trim()}
          className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
            sending || !title.trim() || !message.trim()
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

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ <strong>Warning:</strong> This notification will be sent to <strong>all users</strong> in the system. 
            Make sure your message is clear and relevant. Notifications expire after 4 days.
          </p>
        </div>
      </div>
    </div>
  )
}
