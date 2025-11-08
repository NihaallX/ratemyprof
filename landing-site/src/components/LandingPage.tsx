import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { motion, useScroll, useTransform } from 'framer-motion';
import ParallaxHero from './ParallaxHero';
import BlobMask from './BlobMask';
import AnimatedText, { AnimatedWord } from './AnimatedText';
import ProfessorCard, { Professor } from './ProfessorCard';
import { throttle, prefersReducedMotion, isLowPowerMode } from '../utils/helpers';

const mockProfessors: Professor[] = [
  { id: 1, name: 'Dr. Amit Kumar', department: 'Computer Science', rating: 4.8, reviews: 234 },
  { id: 2, name: 'Prof. Priya Sharma', department: 'Mathematics', rating: 4.6, reviews: 189 },
  { id: 3, name: 'Dr. Rajesh Patel', department: 'Physics', rating: 4.9, reviews: 312 },
  { id: 4, name: 'Prof. Sneha Reddy', department: 'Chemistry', rating: 4.7, reviews: 276 },
  { id: 5, name: 'Dr. Vikram Singh', department: 'Engineering', rating: 4.5, reviews: 198 },
  { id: 6, name: 'Prof. Ananya Gupta', department: 'Economics', rating: 4.8, reviews: 245 },
];

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [gyroData, setGyroData] = useState({ beta: 0, gamma: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [enable3D, setEnable3D] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);

  // Check for performance constraints
  useEffect(() => {
    const shouldDisable3D = prefersReducedMotion() || isLowPowerMode();
    setEnable3D(!shouldDisable3D);
  }, []);

  // Mouse tracking for parallax and blob
  useEffect(() => {
    const handleMouseMove = throttle((e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setMousePosition({ x, y });
    }, 16); // ~60fps

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Gyroscope for mobile parallax
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Track search
    fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'search_query',
        data: { query: searchQuery },
      }),
    }).catch(() => {});
  };

  return (
    <div ref={containerRef} className="relative min-h-screen bg-gray-950 overflow-x-hidden">
      {/* Hero Section with 3D Parallax */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative h-screen flex items-center justify-center overflow-hidden"
      >
        {/* 3D Canvas for parallax hero and blob mask */}
        {enable3D ? (
          <div className="absolute inset-0">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 75 }}
              gl={{ alpha: true, antialias: true }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <ParallaxHero
                scrollProgress={scrollYProgress.get()}
                mousePosition={mousePosition}
                gyroData={gyroData}
              />
              <BlobMask mousePosition={mousePosition} />
            </Canvas>
          </div>
        ) : (
          // Fallback static image
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full bg-gradient-to-br from-primary via-secondary to-accent opacity-50 blur-3xl" />
          </div>
        )}

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-7xl md:text-8xl font-bold mb-6"
          >
            <AnimatedWord>Rate My Prof</AnimatedWord>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl text-gray-300 mb-12"
          >
            <AnimatedText staggerDelay={0.02}>
              India's Premier Platform for Professor Reviews & Ratings
            </AnimatedText>
          </motion.p>

          {/* Search Bar */}
          <motion.form
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            onSubmit={handleSearch}
            className="relative max-w-2xl mx-auto"
          >
            <input
              type="text"
              placeholder="Search for professors, colleges, or departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-8 py-6 text-lg bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/50 transition-all"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 px-8 py-3 bg-gradient-to-r from-primary to-secondary rounded-full font-semibold text-white shadow-lg"
            >
              Search
            </motion.button>
          </motion.form>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="flex justify-center gap-12 mt-16"
          >
            {[
              { label: 'Professors', value: '10K+' },
              { label: 'Reviews', value: '250K+' },
              { label: 'Colleges', value: '500+' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.1, y: -5 }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-gradient">{stat.value}</div>
                <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Professors Section */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-bold text-center mb-4"
          >
            <AnimatedWord>Top Rated Professors</AnimatedWord>
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-400 text-lg mb-20"
          >
            Discover the best educators across India
          </motion.p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {mockProfessors.map((professor, index) => (
              <ProfessorCard key={professor.id} professor={professor} index={index} />
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
          <h2 className="text-5xl font-bold mb-6">
            <AnimatedWord>Join the Community</AnimatedWord>
          </h2>
          <p className="text-xl text-gray-300 mb-10">
            Help fellow students make informed decisions. Share your experience today.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-primary text-white font-semibold rounded-full text-lg"
            >
              Write a Review
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-full text-lg"
            >
              Learn More
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 RateMyProf. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
