import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import NotificationContainer from '../components/NotificationContainer'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  useEffect(() => {
    // Handle GitHub Pages SPA redirect from 404 page
    const redirect = sessionStorage.getItem('redirect')
    if (redirect) {
      sessionStorage.removeItem('redirect')
      router.replace(redirect)
      return
    }

    // Also handle redirect query parameter
    const urlParams = new URLSearchParams(window.location.search)
    const redirectParam = urlParams.get('redirect')
    if (redirectParam) {
      router.replace(redirectParam)
    }
  }, [router])

  return (
    <AuthProvider>
      <NotificationProvider>
        <Component {...pageProps} />
        <NotificationContainer />
      </NotificationProvider>
    </AuthProvider>
  )
}