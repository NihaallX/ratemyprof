import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { SWRConfig } from 'swr'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import { ThemeProvider } from '../contexts/ThemeContext'
import NotificationContainer from '../components/NotificationContainer'
import MaintenanceBanner from '../components/MaintenanceBanner'
import { swrConfig } from '../lib/swr-config'
import '../styles/globals.css'

// Pages that are publicly accessible WITHOUT being logged in
const PUBLIC_PATHS = [
  '/landing',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/callback',
  '/auth/debug',
  '/admin-login',
  '/privacy',
  '/terms',
  '/guidelines',
  '/about',
  '/contact',
  '/help',
  '/copyright',
  '/data-collection',
]

// Allowed exact redirect destination paths (XSS guard)
const ALLOWED_EXACT_PATHS = [
  '/',
  '/dashboard',
  '/profile',
  '/settings',
  '/login',
  '/signup',
  '/admin-login',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
]

// Allowed dynamic redirect patterns (XSS guard)
const ALLOWED_PATH_PATTERNS = [
  /^\/professors\/[a-f0-9-]{36}$/,
  /^\/colleges\/[a-f0-9-]{36}$/,
  /^\/professors\/[a-f0-9-]{36}\/reviews$/,
  /^\/colleges\/[a-f0-9-]{36}\/professors$/,
]

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(
    p => path === p || path.startsWith(p + '/') || path.startsWith(p + '?')
  )
}

function isValidRedirect(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false
  if (!url.startsWith('/')) return false
  if (url.startsWith('//')) return false
  if (/[<>"'#]/.test(url)) return false
  if (ALLOWED_EXACT_PATHS.includes(url)) return true
  if (ALLOWED_PATH_PATTERNS.some(pattern => pattern.test(url))) return true
  return false
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Global auth guard — runs on every route change
  useEffect(() => {
    const currentPath = router.pathname

    // Public pages are always accessible
    if (isPublicPath(currentPath)) return

    // Check for a valid Supabase session token in localStorage
    const hasSupabaseSession = Object.keys(localStorage).some(
      key => key.startsWith('sb-') && key.includes('-auth-token')
    )

    // Also accept an active admin session
    const hasAdminSession =
      !!sessionStorage.getItem('adminSession') ||
      !!localStorage.getItem('adminSession')

    if (!hasSupabaseSession && !hasAdminSession) {
      // Not authenticated — send to login, preserve intended destination
      const intendedPath = currentPath !== '/' ? encodeURIComponent(currentPath) : ''
      router.replace(`/auth/login${intendedPath ? `?redirect=${intendedPath}` : ''}`)
    }
  }, [router.pathname])

  // Handle GitHub Pages SPA 404-redirect flow
  useEffect(() => {
    const redirect = sessionStorage.getItem('redirect')
    if (redirect) {
      sessionStorage.removeItem('redirect')
      const safe = isValidRedirect(redirect) ? redirect : '/'
      router.push(safe)
      return
    }

    const urlParams = new URLSearchParams(window.location.search)
    const redirectParam = urlParams.get('redirect')
    if (redirectParam) {
      const safe = isValidRedirect(redirectParam) ? redirectParam : '/'
      router.push(safe)
    }
  }, [router])

  return (
    <ThemeProvider>
      <SWRConfig value={swrConfig}>
        <AuthProvider>
          <NotificationProvider>
            <MaintenanceBanner />
            <Component {...pageProps} />
            <NotificationContainer />
          </NotificationProvider>
        </AuthProvider>
      </SWRConfig>
    </ThemeProvider>
  )
}