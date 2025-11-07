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

  useEffect(() => {
    // Handle GitHub Pages SPA redirect from 404 page
    const redirect = sessionStorage.getItem('redirect')
    if (redirect) {
      sessionStorage.removeItem('redirect')
      // Validate redirect URL to prevent open redirect attacks
      // Only allow relative paths starting with '/' but not '//' (protocol-relative URLs)
      const validatedRedirect = (typeof redirect === "string" && redirect.startsWith('/') && !redirect.startsWith('//')) ? redirect : '/'
      router.replace(validatedRedirect)
      return
    }

    // Also handle redirect query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const redirectParam = urlParams.get('redirect')
    if (redirectParam) {
      // Validate redirect URL to prevent open redirect attacks
      // Only allow relative paths starting with '/' but not '//' (protocol-relative URLs)
      const validatedRedirect = (typeof redirectParam === "string" && redirectParam.startsWith('/') && !redirectParam.startsWith('//')) ? redirectParam : '/'
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