import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../contexts/AuthContext';
import AdminLoginModal from '../components/AdminLoginModal';

export default function AdminLogin() {
  const router = useRouter();
  const { user, signIn } = useAuth();
  const [showModal, setShowModal] = useState(true);

  // If user is already logged in and is admin, redirect to admin panel
  useEffect(() => {
    if (user) {
      const isAdmin = user.email === 'admin@gmail.com' || user.email?.endsWith('@ratemyprof.in');
      if (isAdmin) {
        router.push('/admin');
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
      const isAdminUser = email === 'admin@gmail.com' || email.endsWith('@ratemyprof.in');
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
      </Head>
      <AdminLoginModal
        isOpen={showModal}
        onClose={() => router.push('/')}
        onLogin={handleAdminLogin}
      />
    </>
  );
}