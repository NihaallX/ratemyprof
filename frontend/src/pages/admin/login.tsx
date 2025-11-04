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

  // Don't auto-redirect - let user explicitly login
  // The admin dashboard will redirect here if token is missing/invalid

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
        onClose={() => router.push('/')}
        onLogin={handleAdminLogin}
      />
    </>
  );
}
