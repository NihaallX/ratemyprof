import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-3JJ1NFB65L"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-3JJ1NFB65L');
            `,
          }}
        />
        
        {/* Single Page Apps for GitHub Pages - Redirect handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Single Page Apps for GitHub Pages
              // MIT License
              // https://github.com/rafgraph/spa-github-pages
              // This script checks if a redirect is present in the search query
              // and redirects the browser to the correct location
              (function(l) {
                if (l.search[1] === '/') {
                  var decoded = l.search.slice(1).split('&').map(function(s) { 
                    return s.replace(/~and~/g, '&')
                  }).join('?');
                  var redirectPath = l.pathname.slice(0, -1) + decoded + l.hash;
                  
                  // Store in sessionStorage for _app.tsx to handle
                  sessionStorage.setItem('redirect', redirectPath);
                  
                  // Also update the URL immediately
                  window.history.replaceState(null, null, redirectPath);
                }
              }(window.location))
            `,
          }}
        />
        
        {/* Favicon - Multiple sizes for better compatibility */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon.ico" />
        
        {/* Open Graph / Facebook Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ratemyprof.me/" />
        <meta property="og:title" content="RateMyProf - Rate Your Professors | India" />
        <meta property="og:description" content="Discover and review professors across Indian colleges. Help students make informed decisions with honest professor ratings and reviews." />
        <meta property="og:image" content="https://ratemyprof.me/android-chrome-512x512.png" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:site_name" content="RateMyProf" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content="https://ratemyprof.me/" />
        <meta name="twitter:title" content="RateMyProf - Rate Your Professors | India" />
        <meta name="twitter:description" content="Discover and review professors across Indian colleges. Help students make informed decisions with honest professor ratings and reviews." />
        <meta name="twitter:image" content="https://ratemyprof.me/android-chrome-512x512.png" />
        
        {/* Additional Meta Tags for SEO */}
        <meta name="description" content="RateMyProf - The #1 platform for rating and reviewing professors across Indian colleges and universities. Make informed decisions with student reviews." />
        <meta name="keywords" content="rate professors, professor reviews, college reviews, university reviews, Indian professors, student reviews, academic ratings" />
        <meta name="author" content="RateMyProf" />
        <meta name="theme-color" content="#4F46E5" />
        
        {/* Structured Data for Google Search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "RateMyProf",
              "url": "https://ratemyprof.me",
              "description": "Rate and review professors across Indian colleges and universities",
              "logo": {
                "@type": "ImageObject",
                "url": "https://ratemyprof.me/android-chrome-512x512.png",
                "width": 512,
                "height": 512
              },
              "publisher": {
                "@type": "Organization",
                "name": "RateMyProf",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://ratemyprof.me/android-chrome-512x512.png",
                  "width": 512,
                  "height": 512
                }
              },
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://ratemyprof.me/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        
        {/* Google Fonts - Inter, Poppins & Pacifico */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Poppins:wght@400;500;600;700;800&family=Pacifico&display=swap" 
          rel="stylesheet" 
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
