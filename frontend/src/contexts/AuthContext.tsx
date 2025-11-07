import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, auth } from '../lib/supabase'
import { API_LEGACY_BASE } from '../config/api'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<{ error: AuthError | null }>
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error: AuthError | null }>  // Added rememberMe
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
    signIn: async (email: string, password: string, rememberMe: boolean = false) => {
      try {
        // Regular Supabase authentication (NOT admin)
        const { data, error } = await auth.signIn(email, password)
        
        if (error) {
          return { error }
        }
        
        // Supabase automatically handles session persistence securely
        // No need to manually store session tokens - this prevents XSS attacks
        // The persistSession: true config in supabase.ts handles this
        if (data.session) {
          console.log(`✅ Session established ${rememberMe ? '(Remember Me enabled)' : '(temporary)'}`)
        }
        
        return { error: null }
      } catch (error) {
        return { error: error as AuthError }
      }
    },
    signOut: async () => {
      try {
        // Clear admin-specific storage (not sensitive tokens)
        localStorage.removeItem('adminSession')
        localStorage.removeItem('adminUser')
        
        // Supabase handles session cleanup automatically
        const { error } = await auth.signOut()
        
        // Force clear state
        setUser(null)
        setSession(null)
        
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}