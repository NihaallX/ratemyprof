import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * Admin Gateway Route
 * This route checks for admin authentication and redirects accordingly.
 * - If admin token exists: load the admin dashboard
 * - Otherwise: redirect to admin login
 * 
 * NOTE: This file redirects immediately. The actual dashboard is at /admin.tsx (parent route)
 * which Next.js serves at /admin. We can't have both /admin/index.tsx and /admin.tsx,
 * so /admin.tsx takes precedence and this file is effectively unused.
 */
export default function AdminGateway() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is already authenticated
    const adminToken = localStorage.getItem('adminToken');
    
    if (!adminToken) {
      // Not logged in, go to login page
      router.replace('/admin/login');
    }
    // If logged in, stay on /admin (admin.tsx will render the dashboard)
  }, [router]);

  return (
    <>
      <Head>
        <title>Admin - RateMyProf</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to admin login...</p>
        </div>
      </div>
    </>
  );
}
