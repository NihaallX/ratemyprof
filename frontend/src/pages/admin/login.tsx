import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import AdminLoginModal from '../../components/AdminLoginModal';
import { API_BASE_URL } from '../../config/api';

/**
 * Secure Admin Login Page
 * This is the gateway to the admin dashboard. All admin routes redirect here if not authenticated.
 */
export default function AdminLogin() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if already logged in - redirect to dashboard
  useEffect(() => {
    const checkExistingAuth = async () => {
      const adminToken = localStorage.getItem('adminToken');
      
      if (adminToken) {
        // Verify token is valid by checking if we can access admin endpoint
        try {
          const response = await fetch(`${API_BASE_URL}/moderation/dashboard/stats`, {
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            // Token is valid, redirect to dashboard
            console.log('Already logged in, redirecting to dashboard');
            router.replace('/admin');
            return;
          } else {
            // Token invalid, clear it
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
          }
        } catch (error) {
          console.log('Token validation failed:', error);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
        }
      }
      
      setIsCheckingAuth(false);
    };
    
    checkExistingAuth();
  }, [router]);

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const handleAdminLogin = async (email: string, password: string) => {
    try {
  // Call backend admin login API (NOT Supabase). The moderation router is mounted under /v1/moderation,
  // so use API_BASE_URL (which already includes /v1) and append /moderation/admin/login.
  const response = await fetch(`${API_BASE_URL}/moderation/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,  // Backend expects 'username' field
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.detail || data.error || 'Invalid credentials' };
      }

      // Store admin token in localStorage
      localStorage.setItem('adminToken', data.access_token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      
      // Redirect to admin dashboard (admin.tsx is at /admin route)
      router.push('/admin');
      
      return { success: true };
    } catch (error) {
      console.error('Admin login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    }
  };

  return (
    <>
      <Head>
        <title>Admin Login - RateMyProf</title>
        <meta name="description" content="Admin login for RateMyProf platform" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AdminLoginModal
        isOpen={showModal}
        onClose={() => {
          // Redirect to homepage when closing login modal
          router.push('/');
        }}
        onLogin={handleAdminLogin}
      />
    </>
  );
}
