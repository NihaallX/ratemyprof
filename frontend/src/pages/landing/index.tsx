import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import ParallaxHero from '../../components/landing/ParallaxHero';
import AnimatedText, { AnimatedWord } from '../../components/landing/AnimatedText';
import ProfessorCard, { Professor } from '../../components/landing/ProfessorCard';
import { throttle, prefersReducedMotion, isLowPowerMode } from '../../utils/landing/helpers';
import { BackgroundPaths } from '../../components/ui/background-paths';
import { FeaturesSectionWithHoverEffects } from '../../components/ui/feature-section-with-hover-effects';

// Use Next.js environment variable for API URL
import { API_BASE_URL } from '../../config/api';

const API_URL = API_BASE_URL;

console.log('Landing Page - Using API URL:', API_URL);

export default function EnhancedLandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [gyroData, setGyroData] = useState({ beta: 0, gamma: 0 });
  const [enable3D, setEnable3D] = useState(false); // Start false for SSR
  const [stats, setStats] = useState({ professors: 0, reviews: 0, colleges: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [topProfessors, setTopProfessors] = useState<Professor[]>([]);
  const [mounted, setMounted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  // Check if user is already authenticated - show them a redirect option
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Mount detection for SSR
  useEffect(() => {
    setMounted(true);
  }, []);
  
  useEffect(() => {
    // Check for session in localStorage (Supabase auth)
    const checkAuth = async () => {
      try {
        // Only check if on landing page AND not coming from app (prevent redirect loops)
        const fromApp = sessionStorage.getItem('from_app');
        if (fromApp === 'true') {
          // User just signed out from app, don't redirect back
          sessionStorage.removeItem('from_app');
          return;
        }
        
        // Check for Supabase session in localStorage
        const supabaseAuthKey = Object.keys(localStorage).find(key => 
          key.startsWith('sb-') && key.includes('-auth-token')
        );
        
        if (supabaseAuthKey) {
          const authData = localStorage.getItem(supabaseAuthKey);
          if (authData) {
            try {
              const parsed = JSON.parse(authData);
              // Check if session exists and is valid (not expired)
              if (parsed && parsed.access_token) {
                setIsAuthenticated(true);
              }
            } catch (e) {
              console.log('Error parsing auth data');
            }
          }
        }
      } catch (error) {
        // Not authenticated, stay on landing page
        console.log('User not authenticated, showing landing page');
      }
    };
    
    checkAuth();
  }, []);

  // Fetch real data from your backend
  useEffect(() => {
    // Fetch platform stats from the new stats endpoint
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        console.log('Fetching stats from backend...');
        
        // Use the new stats endpoint
        const statsResponse = await fetch(`${API_URL}/professors/stats`);
        
        if (!statsResponse.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const statsData = await statsResponse.json();
        
        console.log('Stats data:', statsData);
        
        setStats({
          professors: statsData.professors || 0,
          reviews: statsData.reviews || 0,
          colleges: statsData.colleges || 0,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        // Keep stats at 0 if fetch fails
        setStats({ professors: 0, reviews: 0, colleges: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();

    // Fetch top-rated professors from main backend
    const fetchProfessors = async () => {
      try {
        console.log('Fetching professors from backend...');
        const response = await fetch(`${API_URL}/professors/top-rated?limit=6`);
        if (!response.ok) {
          throw new Error(`Failed to fetch professors: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched top professors data:', data);
        
        // The backend now returns professors sorted by review count first, then rating
        // Map to the format we need
        const formattedProfessors = data.map((prof: any) => ({
          id: prof.id,
          name: prof.name,
          department: prof.department,
          rating: prof.rating || 0,
          reviews: prof.reviews || 0,
        }));
        
        console.log('Showing professors:', formattedProfessors);
        setTopProfessors(formattedProfessors);
      } catch (error) {
        console.error('Failed to fetch top professors:', error);
        // Show empty array if fetch fails
        setTopProfessors([]);
      }
    };
    
    fetchProfessors();
  }, []);

  // Check for performance constraints
  useEffect(() => {
    if (!mounted) return;
    
    // Only disable 3D if user explicitly prefers reduced motion
    // Don't auto-disable based on device specs to avoid breaking the landing page
    const shouldDisable3D = prefersReducedMotion();
    setEnable3D(!shouldDisable3D);
    console.log('3D enabled:', !shouldDisable3D);
  }, [mounted]);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = throttle((e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });
    }, 16);

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Gyroscope
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta && e.gamma) {
        setGyroData({ beta: e.beta, gamma: e.gamma });
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
      return () => window.removeEventListener('deviceorientation', handleOrientation);
    }
  }, []);

  // Helper function to handle navigation (since landing is now part of the same app)
  const navigateToApp = (path: string = '/') => {
    return path; // Return the path for use in href or window.location
  };
  
  const goToApp = (path: string = '/') => {
    // Actually navigate to the path
    window.location.href = path;
  };

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    sessionStorage.setItem('from_landing', 'true');
    const path = mode === 'signin' ? '/auth/login' : '/auth/signup';
    window.location.href = path;
  };

  const copyEmailToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('ratemyprofrn@gmail.com');
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 3000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gray-950 overflow-x-hidden">
      {/* Banner for authenticated users */}
      <AnimatePresence>
        {isAuthenticated && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white shadow-2xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl animate-bounce">👋</span>
                <div className="flex flex-col">
                  <p className="text-sm sm:text-base font-semibold">
                    Welcome back!
                  </p>
                  <p className="text-xs text-green-100 hidden sm:block">
                    You're already signed in
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sessionStorage.setItem('from_landing', 'true');
                  goToApp();
                }}
                className="px-4 sm:px-6 py-2 bg-white text-green-600 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors shadow-lg flex items-center gap-2"
              >
                <span>Go to App</span>
                <span className="text-lg">→</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-logo text-gradient"
          >
            RateMyProf
          </motion.div>
          
          <div className="flex gap-4 items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAuthClick('signin')}
              className="px-6 py-2 text-white hover:text-primary transition-colors"
            >
              Sign In
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAuthClick('signup')}
              className="px-6 py-2 bg-gradient-to-r from-primary to-secondary rounded-full text-white font-semibold"
            >
              Sign Up
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative min-h-screen h-screen flex items-center justify-center overflow-hidden pt-20 pb-24 sm:pb-32"
      >
        {/* Animated background paths */}
        <div className="absolute inset-0">
          <BackgroundPaths 
            title="Rate My Prof"
            buttonText="Explore"
            onButtonClick={() => {
              // Set flag to show main app (browse mode) for unauthenticated users
              sessionStorage.setItem('browse_app', 'true');
              window.location.href = '/';
            }}
          />
        </div>

        {/* Overlay content - subtitle and stats */}
        <div className="absolute bottom-16 sm:bottom-24 md:bottom-32 left-0 right-0 z-20 text-center px-4">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 dark:text-gray-400 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto px-4"
          >
            India's Premier Platform for Professor Reviews & Ratings
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 text-white"
          >
            <div className="text-center backdrop-blur-sm bg-indigo-500/10 dark:bg-indigo-900/20 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-indigo-400/20 dark:border-indigo-500/20 min-w-[100px] sm:min-w-[120px]">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-1">
                {statsLoading ? '...' : stats.professors.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-indigo-300 dark:text-indigo-400">Professors</div>
            </div>
            <div className="text-center backdrop-blur-sm bg-indigo-500/10 dark:bg-indigo-900/20 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-indigo-400/20 dark:border-indigo-500/20 min-w-[100px] sm:min-w-[120px]">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-1">
                {statsLoading ? '...' : stats.reviews.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-indigo-300 dark:text-indigo-400">Reviews</div>
            </div>
            <div className="text-center backdrop-blur-sm bg-indigo-500/10 dark:bg-indigo-900/20 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border border-indigo-400/20 dark:border-indigo-500/20 min-w-[100px] sm:min-w-[120px]">
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-gradient mb-1">
                {statsLoading ? '...' : stats.colleges.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm text-indigo-300 dark:text-indigo-400">Colleges</div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* How It Works Section */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center mb-12 sm:mb-16 md:mb-20 text-white"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { step: '1', title: 'Sign Up', description: 'Create your free account with email verification' },
              { step: '2', title: 'Search', description: 'Find your professors or add new ones' },
              { step: '3', title: 'Review', description: 'Share your honest experience anonymously' },
              { step: '4', title: 'Help Others', description: 'Your reviews help students make better choices' },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white"
                >
                  {item.step}
                </motion.div>
                <h3 className="text-xl sm:text-2xl font-heading font-bold mb-2 sm:mb-3 text-white">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-16 sm:py-24 md:py-32 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-center mb-3 sm:mb-4 text-white"
          >
            Why RateMyProf?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-300 text-base sm:text-lg mb-8 sm:mb-10 md:mb-12 px-4"
          >
            The most trusted source for professor reviews in India
          </motion.p>

          <FeaturesSectionWithHoverEffects />
        </div>
      </section>

      {/* Top Professors Section */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-center mb-3 sm:mb-4 text-white"
          >
            <AnimatedWord>Top Rated Professors</AnimatedWord>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-300 text-base sm:text-lg mb-12 sm:mb-16 md:mb-20 px-4"
          >
          
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 md:gap-12">
            {topProfessors.map((professor, index) => (
              <ProfessorCard key={professor.id} professor={professor} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 sm:py-24 md:py-32 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-4 sm:mb-6 text-white">
            <AnimatedWord>Join the Community</AnimatedWord>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8 md:mb-10 px-4">
            Join the community — we disappear, return, and somehow make it work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
            {/* Instagram */}
            <motion.a
              href="https://www.instagram.com/ratemyprof.me/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full text-base sm:text-lg transition-all w-full sm:w-auto max-w-sm"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span>@ratemyprof.me</span>
            </motion.a>

            {/* Gmail */}
            <motion.button
              onClick={copyEmailToClipboard}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-red-500 text-white font-semibold rounded-full text-base sm:text-lg transition-all cursor-pointer w-full sm:w-auto max-w-sm"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
              </svg>
              <span>ratemyprofrn@gmail.com</span>
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-gray-400 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Links Row */}
          <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 text-sm mb-4">
            <a href={navigateToApp('/help')} className="hover:text-white transition-colors">
              Help
            </a>
            <a href={navigateToApp('/guidelines')} className="hover:text-white transition-colors">
              Site Guidelines
            </a>
            <a href={navigateToApp('/terms')} className="hover:text-white transition-colors">
              Terms & Conditions
            </a>
            <a href={navigateToApp('/privacy')} className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href={navigateToApp('/copyright')} className="hover:text-white transition-colors">
              Copyright Compliance
            </a>
            <a href={navigateToApp('/data-collection')} className="hover:text-white transition-colors">
              Data Collection Notice
            </a>
            <a href={navigateToApp('/contact')} className="hover:text-white transition-colors">
              Contact Us
            </a>
            <a href={navigateToApp('/about')} className="hover:text-white transition-colors">
              About Us
            </a>
          </div>

          {/* Copyright Row */}
          <div className="mt-6 flex flex-col items-center space-y-3">
            <div className="flex items-center justify-center space-x-3">
              <span className="font-logo text-lg text-white" style={{ letterSpacing: '0.02em' }}>
                RateMyProf
              </span>
              <span className="text-sm">
                © {new Date().getFullYear()} All Rights Reserved
              </span>
            </div>
            
            {/* Legal Disclaimer */}
            <p className="text-xs text-gray-500 text-center max-w-4xl px-4 leading-relaxed">
              RateMyProf India is an intermediary under Section 79 of the Information Technology Act, 2000. User-generated content does not represent our views.
            </p>
          </div>
        </div>
      </footer>

      {/* Copy Toast Notification */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-8 right-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">Email copied to clipboard!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

