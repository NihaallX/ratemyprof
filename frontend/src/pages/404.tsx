import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Custom404() {
  const router = useRouter();

  useEffect(() => {
    // GitHub Pages SPA redirect handling
    // This handles the redirect from 404.html
    const redirect = sessionStorage.getItem('redirect');
    if (redirect) {
      sessionStorage.removeItem('redirect');
      router.replace(redirect);
    }
  }, [router]);

  return (
    <>
      <Head>
        <title>Page Not Found - RateMyProf India</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // GitHub Pages SPA 404 redirect
              (function() {
                var l = window.location;
                var path = l.pathname;
                
                // Skip if we're already on the homepage
                if (path === '/' || path === '') {
                  return;
                }
                
                // Remove trailing slash if present
                if (path.endsWith('/')) {
                  path = path.slice(0, -1);
                }
                
                // Store the intended path and redirect to homepage with query param
                sessionStorage.setItem('redirect', path + l.search + l.hash);
                window.location.replace('/?redirect=' + encodeURIComponent(path));
              })();
            `,
          }}
        />
      </Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
            <p className="text-gray-600">
              Redirecting you to the correct page...
            </p>
          </div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    </>
  );
}
