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

  // Helper function to validate redirect URLs with strict URL-safe character checking
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
    
    if (dangerousPatterns.some(pattern => pattern.test(url))) return false
    
    // Block encoded slashes and other suspicious encoded characters
    // %2f = /, %5c = \, %00 = null byte
    const suspiciousEncoded = /%2f|%5c|%00|%0d|%0a/i
    if (suspiciousEncoded.test(url)) return false
    
    // Only allow URL-safe path characters: alphanumeric, dash, underscore, slash, 
    // question mark (for query params), hash (for fragments), equals, ampersand, dot, percent (for safe encoding)
    // This regex ensures only safe characters are present
    const safePathRegex = /^\/[a-zA-Z0-9\-_\/.?#=&%]*$/
    if (!safePathRegex.test(url)) return false
    
    return true
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