import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * Admin Gateway Route
 * This route redirects to /admin/login to prevent direct access to admin dashboard.
 * Accessing /admin without authentication will always redirect to login page.
 */
export default function AdminGateway() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to admin login page
    // The admin login page will handle authentication and redirect to dashboard
    router.replace('/admin/login');
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
