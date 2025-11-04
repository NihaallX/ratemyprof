import { useState, useEffect } from 'react'

export default function MaintenanceBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Function to check maintenance mode status from API
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/settings/maintenance`)
        
        if (!response.ok) {
          console.error('Failed to fetch maintenance mode status')
          setIsVisible(false)
          setIsLoading(false)
          return
        }
        
        const data = await response.json()
        const isMaintenanceEnabled = data.maintenance_mode_enabled === true
        
        if (!isMaintenanceEnabled) {
          setIsVisible(false)
          setIsLoading(false)
          return
        }

        // Check if banner was previously dismissed by user
        const isDismissed = localStorage.getItem('maintenanceBannerDismissed')
        if (!isDismissed) {
          setIsVisible(true)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking maintenance mode:', error)
        setIsVisible(false)
        setIsLoading(false)
      }
    }

    // Initial check
    checkMaintenanceMode()

    // Listen for maintenance mode changes (triggered by admin toggle)
    const handleMaintenanceToggle = () => {
      // Clear dismissal when admin toggles
      localStorage.removeItem('maintenanceBannerDismissed')
      checkMaintenanceMode()
    }

    window.addEventListener('maintenanceModeChanged', handleMaintenanceToggle)

    // Poll for changes every 30 seconds (in case other admins toggle it)
    const pollInterval = setInterval(checkMaintenanceMode, 30000)

    return () => {
      window.removeEventListener('maintenanceModeChanged', handleMaintenanceToggle)
      clearInterval(pollInterval)
    }
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('maintenanceBannerDismissed', 'true')
  }

  if (!isVisible) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="maintenance-banner"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF8E1',
        color: '#000',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        fontSize: '14px',
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flex: 1,
          justifyContent: 'center',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <span role="img" aria-label="maintenance">⚙️</span>
        <span>
          <strong>RateMyProf.in</strong> is currently under maintenance — some features may be temporarily unavailable.
        </span>
      </span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss maintenance notification"
        style={{
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          padding: '0 8px',
          marginLeft: '16px',
          lineHeight: 1,
          color: '#666',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#000'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#666'
        }}
      >
        ×
      </button>
    </div>
  )
}
