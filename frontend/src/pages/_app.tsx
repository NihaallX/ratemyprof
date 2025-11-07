import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { SWRConfig } from 'swr'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import NotificationContainer from '../components/NotificationContainer'
import MaintenanceBanner from '../components/MaintenanceBanner'
import { swrConfig } from '../lib/swr-config'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Helper function to validate redirect URLs
  const isValidRedirect = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false
    
    // Must start with / (relative path)
    if (!url.startsWith('/')) return false
    
    // Must NOT start with // (protocol-relative URL like //evil.com)
    if (url.startsWith('//')) return false
    
    // Block any absolute URLs or dangerous protocols
    const dangerousPatterns = [
      /^https?:\/\//i,      // http:// or https://
      /^javascript:/i,      // javascript:
      /^data:/i,            // data:
      /^file:/i,            // file:
      /^vbscript:/i,        // vbscript:
      /^ftp:/i              // ftp:
    ]
    
    return !dangerousPatterns.some(pattern => pattern.test(url))
  }

  useEffect(() => {
    // Handle GitHub Pages SPA redirect from 404 page
    const redirect = sessionStorage.getItem('redirect')
    if (redirect) {
      sessionStorage.removeItem('redirect')
      // Validate redirect URL to prevent open redirect attacks
      const validatedRedirect = isValidRedirect(redirect) ? redirect : '/'
      router.replace(validatedRedirect)
      return
    }

    // Also handle redirect query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const redirectParam = urlParams.get('redirect')
    if (redirectParam) {
      // Validate redirect URL to prevent open redirect attacks
      const validatedRedirect = isValidRedirect(redirectParam) ? redirectParam : '/'
      router.replace(validatedRedirect)
    }
  }, [router])

  return (
    <SWRConfig value={swrConfig}>
      <AuthProvider>
        <NotificationProvider>
          <MaintenanceBanner />
          <Component {...pageProps} />
          <NotificationContainer />
        </NotificationProvider>
      </AuthProvider>
    </SWRConfig>
  )
}