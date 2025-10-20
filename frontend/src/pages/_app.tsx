import type { AppProps } from 'next/app'
import { AuthProvider } from '../contexts/AuthContext'
import { NotificationProvider } from '../contexts/NotificationContext'
import NotificationContainer from '../components/NotificationContainer'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Component {...pageProps} />
        <NotificationContainer />
      </NotificationProvider>
    </AuthProvider>
  )
}