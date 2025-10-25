/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable static export for GitHub Pages
  output: 'export',
  
  // Add trailing slash to URLs for GitHub Pages compatibility
  trailingSlash: true,
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // Base path for GitHub Pages (if using project pages, set to repo name)
  // basePath: '/ratemyprof', // Uncomment if using project pages instead of custom domain
  
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1',
  },
  
  // Note: rewrites() doesn't work with static export
  // You'll need to configure API URL via environment variables
};

module.exports = nextConfig;