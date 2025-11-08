/**
 * Landing Page Components
 * Reusable components for the landing page
 */

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useTransform } from 'framer-motion';
import Link from 'next/link';
import {
  Star,
  Quote,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Award,
  Users,
  Zap,
  Heart,
  Target,
  Lock,
  Globe,
  MessageSquare
} from 'lucide-react';

// Animated Button Component
export function AnimatedButton({ 
  children, 
  onClick, 
  className 
}: { 
  children: React.ReactNode; 
  onClick: () => void; 
  className: string;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.button>
  );
}

// Blob Cursor Effect
export function BlobCursor({ mouseX, mouseY }: { mouseX: any; mouseY: any }) {
  return (
    <motion.div
      className="pointer-events-none fixed top-0 left-0 z-50 mix-blend-difference hidden md:block"
      style={{
        x: useTransform(mouseX, (x: number) => x - 10),
        y: useTransform(mouseY, (y: number) => y - 10),
      }}
    >
      <div className="w-5 h-5 bg-white rounded-full opacity-50" />
    </motion.div>
  );
}

// Floating Particles
export function FloatingParticles() {
  const particles = Array.from({ length: 20 });
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
          initial={{
            x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
            y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0,
          }}
          animate={{
            y: typeof window !== 'undefined' ? [null, Math.random() * window.innerHeight] : 0,
            x: typeof window !== 'undefined' ? [null, Math.random() * window.innerWidth] : 0,
          }}
          transition={{
            duration: Math.random() * 10 + 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

// Navigation Component
export function Navigation({ onCTAClick }: { onCTAClick: (path: string) => void }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? 'bg-slate-950/80 backdrop-blur-lg border-b border-white/10' : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-400" />
            <span className="text-xl font-bold text-white">RateMyProf India</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => onCTAClick('/auth/login')}
              className="text-slate-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => onCTAClick('/auth/signup')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

// Trusted By Section
export function TrustedBySection() {
  const logos = [
    { name: 'IIT Delhi', icon: GraduationCap },
    { name: 'Mumbai University', icon: BookOpen },
    { name: 'Delhi University', icon: Award },
    { name: 'Pune University', icon: Users },
    { name: 'VIT', icon: Star },
  ];

  return (
    <section className="relative py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-slate-400 mb-12"
        >
          Trusted by students from top universities across India
        </motion.p>
        
        <div className="flex flex-wrap justify-center items-center gap-12">
          {logos.map((logo, index) => {
            const Icon = logo.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{logo.name}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Testimonial Card
export function TestimonialCard({ testimonial, index }: { testimonial: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="relative p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
    >
      <Quote className="w-10 h-10 text-blue-400/50 mb-4" />
      
      <div className="flex gap-1 mb-4">
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>

      <p className="text-slate-300 mb-6 leading-relaxed">
        "{testimonial.quote}"
      </p>

      <div>
        <p className="text-white font-semibold">{testimonial.author}</p>
        <p className="text-slate-400 text-sm">{testimonial.role}</p>
      </div>
    </motion.div>
  );
}

// Why Card
export function WhyCard({ reason, index }: { reason: any; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer group"
    >
      <motion.div
        animate={{ rotate: isHovered ? 360 : 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4"
      >
        <reason.icon className="w-6 h-6 text-blue-400" />
      </motion.div>

      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
        {reason.title}
      </h3>

      <p className="text-slate-400">
        {reason.description}
      </p>

      <motion.div
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity -z-10 blur-xl"
      />
    </motion.div>
  );
}

// Page Transition Curtain
export function PageTransitionCurtain({ show }: { show: boolean }) {
  return (
    <motion.div
      initial={{ scaleY: 0 }}
      animate={{ scaleY: show ? 1 : 0 }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      className="fixed inset-0 bg-gradient-to-br from-blue-600 to-purple-600 z-50 origin-top"
      style={{ pointerEvents: show ? 'all' : 'none' }}
    >
      <div className="flex items-center justify-center h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.8 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-white text-2xl font-bold"
        >
          Loading...
        </motion.div>
      </div>
    </motion.div>
  );
}

// Footer
export function Footer() {
  return (
    <footer className="relative py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">RateMyProf India</h3>
            <p className="text-slate-400">Making education decisions easier for Indian students.</p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/" className="hover:text-white transition-colors">Search</Link></li>
              <li><Link href="/colleges" className="hover:text-white transition-colors">Colleges</Link></li>
              <li><Link href="/professors" className="hover:text-white transition-colors">Professors</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/guidelines" className="hover:text-white transition-colors">Guidelines</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="/copyright" className="hover:text-white transition-colors">Copyright</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 text-center text-slate-400">
          <p>&copy; 2025 RateMyProf India. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export const WHY_REASONS = [
  {
    icon: Zap,
    title: "Lightning Fast Search",
    description: "Find any professor in seconds with our intelligent search system",
  },
  {
    icon: Heart,
    title: "Student-First Platform",
    description: "Built by students, for students. We understand your needs.",
  },
  {
    icon: Target,
    title: "Accurate Information",
    description: "Verified reviews and ratings you can trust for better decisions",
  },
  {
    icon: Lock,
    title: "100% Anonymous",
    description: "Share honest feedback without revealing your identity",
  },
  {
    icon: Globe,
    title: "Pan-India Coverage",
    description: "Professors and colleges from all major cities in India",
  },
  {
    icon: MessageSquare,
    title: "Community Driven",
    description: "Join thousands of students helping each other succeed",
  },
];

export const TESTIMONIALS = [
  {
    quote: "This platform helped me choose the right professor for Data Structures. The reviews were spot-on!",
    author: "Priya S.",
    role: "Computer Science, IIT Delhi",
    rating: 5
  },
  {
    quote: "Finally, honest reviews from students who've actually taken the courses. Game changer!",
    author: "Rahul M.",
    role: "Engineering, VIT Vellore",
    rating: 5
  },
  {
    quote: "I avoid bad professors thanks to this site. Saved my GPA multiple times!",
    author: "Anjali K.",
    role: "Commerce, Delhi University",
    rating: 5
  }
];
