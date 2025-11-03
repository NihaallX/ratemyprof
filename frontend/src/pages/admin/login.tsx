import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import AdminLoginModal from '../../components/AdminLoginModal';

/**
 * Secure Admin Login Page
 * This is the gateway to the admin dashboard. All admin routes redirect here if not authenticated.
 */
export default function AdminLogin() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [showModal, setShowModal] = useState(true);

  // If user is already logged in and is admin, redirect to admin dashboard
  useEffect(() => {
    if (user) {
      const isAdmin = user.email === 'admin@ratemyprof.in' || user.email?.endsWith('@ratemyprof.in');
      if (isAdmin) {
        router.push('/admin/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleAdminLogin = async (email: string, password: string) => {
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Check if the logged in user is admin
      const isAdminUser = email === 'admin@ratemyprof.in' || email.endsWith('@ratemyprof.in');
      if (!isAdminUser) {
        return { success: false, error: 'Access denied. Admin credentials required.' };
      }
      
      // Success - the useEffect will handle the redirect
      return { success: true };
    } catch (error) {
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
