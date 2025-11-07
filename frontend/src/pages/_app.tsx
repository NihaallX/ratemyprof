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

  // Whitelist of allowed redirect paths (exact matches)
  const ALLOWED_EXACT_PATHS = [
    '/',
    '/dashboard',
    '/profile',
    '/settings',
    '/login',
    '/signup',
    '/admin-login',
    '/search',
    '/about',
    '/contact',
    '/privacy',
    '/terms'
  ]

  // Whitelist of allowed path patterns (for dynamic routes)
  const ALLOWED_PATH_PATTERNS = [
    /^\/professors\/[a-f0-9-]{36}$/,           // /professors/:uuid
    /^\/colleges\/[a-f0-9-]{36}$/,             // /colleges/:uuid
    /^\/professors\/[a-f0-9-]{36}\/reviews$/,  // /professors/:uuid/reviews
    /^\/colleges\/[a-f0-9-]{36}\/professors$/, // /colleges/:uuid/professors
    /^\/search\?[a-zA-Z0-9=&%-]+$/             // /search?q=...
  ]

  // Helper function to validate redirect URLs with strict whitelist checking
  const isValidRedirect = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false
    
    // Must start with / (relative path)
    if (!url.startsWith('/')) return false
    
    // Must NOT start with // (protocol-relative URL like //evil.com)
    if (url.startsWith('//')) return false
    
    // Check if it's an exact match in the whitelist
    if (ALLOWED_EXACT_PATHS.includes(url)) return true
    
    // Check if it matches any allowed pattern
    if (ALLOWED_PATH_PATTERNS.some(pattern => pattern.test(url))) return true
    
    // If not in whitelist, default to blocking
    return false
  }

  useEffect(() => {
    // Handle GitHub Pages SPA redirect from 404 page
    const redirect = sessionStorage.getItem('redirect')
    if (redirect) {
      sessionStorage.removeItem('redirect')
      // Only allow redirecting to whitelisted paths
      const validatedRedirect = isValidRedirect(redirect) ? redirect : '/'
      // Use router.push instead of setting location to prevent XSS
      router.push(validatedRedirect)
      return
    }

    // Also handle redirect query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const redirectParam = urlParams.get('redirect')
    if (redirectParam) {
      // Only allow redirecting to whitelisted paths
      const validatedRedirect = isValidRedirect(redirectParam) ? redirectParam : '/'
      // Use router.push instead of setting location to prevent XSS
      router.push(validatedRedirect)
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