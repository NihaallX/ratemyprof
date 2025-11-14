/**
 * Enhanced Notification Inbox Component
 * Features: Scrollable list, auto-mark as read on view, delete functionality
 */

import { useState, useRef, useEffect } from 'react'
import { Bell, X, Trash2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { API_BASE_URL } from '../config/api'

interface Notification {
  id: string
  title: string
  message: string
  type: 'new_professor' | 'new_college' | 'custom' | 'system'
  is_read: boolean
  created_at: string
}

const HUMOROUS_EMPTY_MESSAGES = [
  "Nah, still the same 🥱",
  "Nothing to see here, move along 👀",
  "Your inbox is emptier than my social life 🦗",
  "Crickets... 🦗🦗🦗",
  "No new drama today ☕",
  "Silence is golden... or boring 😴",
  "404: Notifications not found 🤷",
  "Plot twist: There is no plot 📖",
]

export default function NotificationInbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [visibleNotifications, setVisibleNotifications] = useState<Set<string>>(new Set())

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch notifications when component mounts or opens
  useEffect(() => {
    if (user) {
      fetchNotifications()
      // Poll for new notifications every 2 minutes
      const interval = setInterval(fetchNotifications, 120000)
      return () => clearInterval(interval)
    }
  }, [user])

  // Setup intersection observer to auto-mark notifications as read when visible
  useEffect(() => {
    if (!isOpen) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const notificationId = entry.target.getAttribute('data-notification-id')
          if (entry.isIntersecting && notificationId) {
            // Add to visible set
            setVisibleNotifications(prev => new Set(prev).add(notificationId))
            
            // Find the notification
            const notification = notifications.find(n => n.id === notificationId)
            if (notification && !notification.is_read) {
              // Auto-mark as read after 1 second of being visible
              setTimeout(() => {
                markAsRead(notificationId, true)
              }, 1000)
            }
          }
        })
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.5, // 50% visible
      }
    )

    // Observe all notification elements
    const notificationElements = scrollContainerRef.current?.querySelectorAll('[data-notification-id]')
    notificationElements?.forEach((el) => observerRef.current?.observe(el))

    return () => {
      observerRef.current?.disconnect()
    }
  }, [isOpen, notifications])

  const fetchNotifications = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Get Supabase session token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No session token available')
        setLoading(false)
        return
      }
      
      // Fetch all notifications (remove limit for scrollable view)
      const response = await fetch(`${API_BASE_URL}/notifications?limit=50`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unread_count || 0)
      } else {
        console.error('Failed to fetch notifications:', response.status, await response.text())
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string, auto = false) => {
    try {
      const notification = notifications.find(n => n.id === notificationId)
      if (!notification || notification.is_read) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      
      await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      setDeletingId(notificationId)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('No session token available')
        return
      }
      
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        // Remove from local state immediately for better UX
        const wasUnread = notifications.find(n => n.id === notificationId)?.is_read === false
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to delete notification:', response.status, errorText)
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const scrollUp = () => {
    scrollContainerRef.current?.scrollBy({ top: -200, behavior: 'smooth' })
  }

  const scrollDown = () => {
    scrollContainerRef.current?.scrollBy({ top: 200, behavior: 'smooth' })
  }

  const getRandomEmptyMessage = () => {
    return HUMOROUS_EMPTY_MESSAGES[Math.floor(Math.random() * HUMOROUS_EMPTY_MESSAGES.length)]
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_professor':
        return '👨‍🏫'
      case 'new_college':
        return '🏛️'
      case 'custom':
        return '📢'
      default:
        return '🔔'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 259200) return `${Math.floor(seconds / 86400)}d ago` // Up to 3 days
    return date.toLocaleDateString()
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchNotifications()
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-gray-900 bg-white border-2 border-gray-900 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          </div>

          {/* Scroll Up Button */}
          {notifications.length > 3 && (
            <div className="flex justify-center py-1 border-b border-gray-100">
              <button
                onClick={scrollUp}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Scroll up"
              >
                <ChevronUp className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}

          {/* Notification List - Scrollable */}
          <div 
            ref={scrollContainerRef}
            className="max-h-96 overflow-y-auto scroll-smooth"
            style={{ scrollbarWidth: 'thin' }}
          >
            {loading ? (
              <div className="px-4 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    data-notification-id={notification.id}
                    className={`group px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer relative ${
                      !notification.is_read ? 'bg-indigo-50' : ''
                    }`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => deleteNotification(notification.id, e)}
                          disabled={deletingId === notification.id}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                          aria-label="Delete notification"
                        >
                          {deletingId === notification.id ? (
                            <Loader2 className="w-4 h-4 text-red-600 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4 text-red-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-12 text-center">
                <div className="text-5xl mb-3">😴</div>
                <p className="text-sm font-medium text-gray-600">
                  {getRandomEmptyMessage()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  No notifications yet
                </p>
              </div>
            )}
          </div>

          {/* Scroll Down Button */}
          {notifications.length > 3 && (
            <div className="flex justify-center py-1 border-t border-gray-100">
              <button
                onClick={scrollDown}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Scroll down"
              >
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
