/**
 * Authentication context for RateMyProf
 * Provides user state and auth    signIn: async (email: string, password: string) => {
      try {
        // Use our backend API for all authentication
        const response = await fetch('http://localhost:8000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Create a mock session for admin or regular user
          const mockUser = {
            id: data.user.id,
            email: data.user.email,
            user_metadata: data.user,
            app_metadata: {},
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            role: 'authenticated',
            updated_at: new Date().toISOString()
          }
          
          const mockSession = {
            access_token: data.access_token,
            token_type: data.token_type,
            expires_in: data.expires_in,
            expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
            refresh_token: data.access_token, // Use same token
            user: mockUser
          }
          
          // Update state immediately
          setSession(mockSession as any)
          setUser(mockUser as any)
          
          return { error: null }
        } else {
          const errorData = await response.json()
          return { error: { message: errorData.error || errorData.detail || 'Login failed' } as AuthError }
        }
      } catch (fetchError) {
        return { error: { message: 'Network error - please check if the backend server is running' } as AuthError }
      }
    }, throughout the app
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, auth } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored admin session first
    const checkStoredAdminSession = () => {
      const storedAdminSession = localStorage.getItem('adminSession')
      const storedAdminUser = localStorage.getItem('adminUser')
      
      if (storedAdminSession && storedAdminUser) {
        try {
          const adminSession = JSON.parse(storedAdminSession)
          const adminUser = JSON.parse(storedAdminUser)
          
          // Check if session is still valid (not expired)
          const now = Date.now() / 1000
          if (adminSession.expires_at > now) {
            setUser(adminUser)
            setSession(adminSession)
            setLoading(false)
            return true
          } else {
            // Clear expired admin session
            localStorage.removeItem('adminSession')
            localStorage.removeItem('adminUser')
          }
        } catch (error) {
          console.error('Error parsing stored admin session:', error)
          localStorage.removeItem('adminSession')
          localStorage.removeItem('adminUser')
        }
      }
      return false
    }

    // Get initial session
    const getInitialSession = async () => {
      // First check for stored admin session
      if (checkStoredAdminSession()) {
        return
      }

      // Then check regular Supabase session
      const { data: { session }, error } = await auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        // Don't override admin sessions with Supabase auth changes
        const storedAdminUser = localStorage.getItem('adminUser')
        if (storedAdminUser && event === 'SIGNED_OUT') {
          // This might be a regular user signing out, don't affect admin session
          return
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          // Clear admin session on explicit sign out
          localStorage.removeItem('adminSession')
          localStorage.removeItem('adminUser')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])
        
        // Handle specific auth events
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email)
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp: async (email: string, password: string, name?: string) => {
      try {
        const { error } = await auth.signUp(email, password, { name })
        return { error }
      } catch (error) {
        return { error: error as AuthError }
      }
    },
    signIn: async (email: string, password: string) => {
      try {
        // Check for admin login first
        if (email === 'admin@gmail.com') {
          const response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          
          if (response.ok) {
            const data = await response.json()
            // Create a mock admin user object
            const adminUser = {
              id: 'admin-123',
              email: 'admin@gmail.com',
              role: 'admin',
              aud: 'authenticated',
              app_metadata: { role: 'admin' },
              user_metadata: { role: 'admin', name: 'Admin' },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              confirmed_at: new Date().toISOString(),
              email_confirmed_at: new Date().toISOString(),
              last_sign_in_at: new Date().toISOString()
            } as User
            
            // Create a mock session
            const adminSession = {
              access_token: data.access_token,
              refresh_token: '',
              expires_in: 3600,
              expires_at: Date.now() / 1000 + 3600,
              token_type: 'bearer',
              user: adminUser
            } as Session
            
            // Set the admin user and session
            setUser(adminUser)
            setSession(adminSession)
            
            return { error: null }
          } else {
            const errorData = await response.json()
            return { error: { message: errorData.error || 'Admin login failed' } as AuthError }
          }
        }
        
        // Regular user login with Supabase
        const { error } = await auth.signIn(email, password)
        return { error }
      } catch (error) {
        return { error: error as AuthError }
      }
    },
    signOut: async () => {
      try {
        const { error } = await auth.signOut()
        return { error }
      } catch (error) {
        return { error: error as AuthError }
      }
    },
    resetPassword: async (email: string) => {
      try {
        const { error } = await auth.resetPassword(email)
        return { error }
      } catch (error) {
        return { error: error as AuthError }
      }
    }
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext