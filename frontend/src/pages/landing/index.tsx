import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import ParallaxHero from '../../components/landing/ParallaxHero';
import AnimatedText, { AnimatedWord } from '../../components/landing/AnimatedText';
import ProfessorCard, { Professor } from '../../components/landing/ProfessorCard';
import { throttle, prefersReducedMotion, isLowPowerMode } from '../../utils/landing/helpers';

// Use Next.js environment variable for API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/v1';

console.log('Landing Page - Using API URL:', API_URL);

export default function EnhancedLandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [gyroData, setGyroData] = useState({ beta: 0, gamma: 0 });
  const [enable3D, setEnable3D] = useState(true);
  const [stats, setStats] = useState({ professors: 0, reviews: 0, colleges: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const [topProfessors, setTopProfessors] = useState<Professor[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  // Check if user is already authenticated - show them a redirect option
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
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
    // Fetch platform stats from the main backend API (parallel requests for speed)
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        console.log('Fetching stats from backend...');
        
        // Fetch all three endpoints in parallel for faster loading
        const [profsResponse, collegesResponse] = await Promise.all([
          fetch(`${API_URL}/professors?limit=1`),
          fetch(`${API_URL}/colleges?limit=1`),
        ]);
        
        if (!profsResponse.ok || !collegesResponse.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const [profsData, collegesData] = await Promise.all([
          profsResponse.json(),
          collegesResponse.json(),
        ]);
        
        console.log('Professors data:', profsData);
        console.log('Colleges data:', collegesData);
        
        const professorsCount = profsData.total || 0;
        const collegesCount = collegesData.total || 0;
        
        // Fetch the first college's details to get accurate total_reviews
        let reviewsCount = 0;
        if (collegesData.colleges && collegesData.colleges.length > 0) {
          const collegeId = collegesData.colleges[0].id;
          const collegeDetailResponse = await fetch(`${API_URL}/colleges/${collegeId}`);
          if (collegeDetailResponse.ok) {
            const collegeDetail = await collegeDetailResponse.json();
            reviewsCount = collegeDetail.total_reviews || 0;
          }
        }

        console.log('Final stats:', { professorsCount, reviewsCount, collegesCount });
        
        setStats({
          professors: professorsCount,
          reviews: reviewsCount,
          colleges: collegesCount,
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

    // Fetch top-rated professors from main backend (using proxy)
    const fetchProfessors = async () => {
      try {
        console.log('Fetching professors from backend...');
        const response = await fetch(`${API_URL}/professors?limit=200`);
        if (!response.ok) {
          throw new Error(`Failed to fetch professors: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched professors data:', data);
        
        // Get all professors
        const allProfessors = data.professors || [];
        console.log('Total professors fetched:', allProfessors.length);
        
        // First, try to get professors WITH ratings
        let professorsToShow = allProfessors
          .filter((prof: any) => prof.average_rating && prof.average_rating > 0)
          .sort((a: any, b: any) => b.average_rating - a.average_rating)
          .slice(0, 6);
        
        console.log('Professors with ratings:', professorsToShow.length);
        
        // If we don't have 6 professors with ratings, fill the rest with any professors
        if (professorsToShow.length < 6) {
          const remaining = 6 - professorsToShow.length;
          const professorsWithoutRatings = allProfessors
            .filter((prof: any) => !prof.average_rating || prof.average_rating === 0)
            .slice(0, remaining);
          professorsToShow = [...professorsToShow, ...professorsWithoutRatings];
        }
        
        // Map to the format we need
        const formattedProfessors = professorsToShow.map((prof: any) => ({
          id: prof.id,
          name: prof.name,
          department: prof.department,
          rating: prof.average_rating || 0,
          reviews: prof.total_reviews || 0,
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
    // Only disable 3D if user explicitly prefers reduced motion
    // Don't auto-disable based on device specs to avoid breaking the landing page
    const shouldDisable3D = prefersReducedMotion();
    setEnable3D(!shouldDisable3D);
    console.log('3D enabled:', !shouldDisable3D);
  }, []);

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
        className="relative h-screen flex items-center justify-center overflow-hidden pt-16"
      >
        {enable3D ? (
          <div className="absolute inset-0">
            <Canvas 
              camera={{ position: [0, 0, 5], fov: 75 }} 
              gl={{ alpha: true, antialias: true }}
              onCreated={() => console.log('✅ Canvas created successfully!')}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <ParallaxHero
                scrollProgress={scrollYProgress.get()}
                mousePosition={mousePosition}
                gyroData={gyroData}
              />
            </Canvas>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full bg-gradient-to-br from-primary via-secondary to-accent opacity-50 blur-3xl" />
          </div>
        )}

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl sm:text-6xl md:text-8xl font-logo mb-6"
          >
            <AnimatedWord>Rate My Prof</AnimatedWord>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-base sm:text-xl md:text-2xl text-gray-300 mb-4"
          >
            <AnimatedText staggerDelay={0.02}>
              India's Premier Platform for Professor Reviews & Ratings
            </AnimatedText>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="text-lg text-gray-400 mb-12"
          >
            Make informed decisions about your education. Read reviews, compare professors, and share your experiences.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sessionStorage.setItem('from_landing', 'true');
                goToApp('/auth/signup');
              }}
              className="px-12 py-5 text-lg bg-gradient-to-r from-primary to-secondary rounded-full font-bold text-white shadow-2xl"
            >
              Get Started Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sessionStorage.setItem('from_landing', 'true');
                goToApp('/auth/login');
              }}
              className="px-12 py-5 text-lg bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-full font-bold text-white hover:bg-white/20 transition-all"
            >
              Already Have an Account?
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.3 }}
            className="mt-16"
          >
            <div className="flex justify-center gap-12 flex-wrap">
              {[
                { label: 'Professors', value: statsLoading ? '...' : `${stats.professors}` },
                { label: 'Reviews', value: statsLoading ? '...' : `${stats.reviews}` },
                { label: 'Colleges', value: statsLoading ? '...' : `${stats.colleges}` },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ scale: 1.1, y: -5 }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold text-gradient">{stat.value}</div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
            <div className="text-center text-sm text-gray-500 mt-4">and counting...</div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="relative py-32 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-heading font-bold text-center mb-4"
          >
            Why RateMyProf?
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-400 text-lg mb-20"
          >
            The most trusted source for professor reviews in India
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎯',
                title: 'Accurate Ratings',
                description: 'Verified student reviews with detailed breakdowns of teaching quality, difficulty level, and more.',
              },
              {
                icon: '🔍',
                title: 'Easy Discovery',
                description: 'Find professors by name, college, department, or subject. Filter by rating and teaching style.',
              },
              {
                icon: '🤝',
                title: 'Community Driven',
                description: 'Join thousands of students helping each other make better academic decisions.',
              },
              {
                icon: '📊',
                title: 'Detailed Analytics',
                description: 'View comprehensive statistics including grade distributions, course difficulty, and student success rates.',
              },
              {
                icon: '🔒',
                title: 'Anonymous Reviews',
                description: 'Share your honest feedback anonymously while maintaining accountability through verified accounts.',
              },
              {
                icon: '⚡',
                title: 'Real-Time Updates',
                description: 'Get instant notifications about new reviews for your professors and stay informed.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)' }}
                className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 transition-all"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-heading font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Professors Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-heading font-bold text-center mb-4"
          >
            <AnimatedWord>Featured Professors</AnimatedWord>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-400 text-lg mb-20"
          >
            Discover educators from your college
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {topProfessors.map((professor, index) => (
              <ProfessorCard key={professor.id} professor={professor} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-32 px-4 bg-gray-900/30">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl font-heading font-bold text-center mb-20"
          >
            How It Works
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                  className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-3xl font-bold text-white"
                >
                  {item.step}
                </motion.div>
                <h3 className="text-2xl font-heading font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-gray-400">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 backdrop-blur-xl border border-white/10 rounded-3xl p-16"
        >
          <h2 className="text-5xl font-heading font-bold mb-6">
            <AnimatedWord>Join the Community</AnimatedWord>
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Help fellow students make informed decisions. Share your experience today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sessionStorage.setItem('from_landing', 'true');
                goToApp('/auth/signup');
              }}
              className="px-10 py-4 bg-primary text-white font-semibold rounded-full text-lg"
            >
              Get Started Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                sessionStorage.setItem('from_landing', 'true');
                goToApp('/auth/signup');
              }}
              className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full text-lg"
            >
              Browse Professors
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
    </div>
  );
}
