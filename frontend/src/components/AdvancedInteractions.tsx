/**
 * Advanced Interactive Components
 * Buttery smooth animations and jaw-dropping effects
 */

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useSpring as useReactSpring, animated, config } from '@react-spring/web';
import { useInView } from 'react-intersection-observer';
import useMeasure from 'react-use-measure';

// ==================== MAGNETIC BUTTON ====================
interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({ 
  children, 
  onClick, 
  className = '', 
  variant = 'primary' 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Smooth spring physics for buttery animation
  const springX = useSpring(x, { damping: 20, stiffness: 300 });
  const springY = useSpring(y, { damping: 20, stiffness: 300 });

  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = button.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      const buttonCenterY = rect.top + rect.height / 2;
      
      const distanceX = e.clientX - buttonCenterX;
      const distanceY = e.clientY - buttonCenterY;
      const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
      
      // Magnetic attraction within 150px radius
      const magneticRadius = 150;
      
      if (distance < magneticRadius) {
        const strength = 1 - distance / magneticRadius;
        x.set(distanceX * strength * 0.3);
        y.set(distanceY * strength * 0.3);
      } else {
        x.set(0);
        y.set(0);
      }
    };

    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
      setIsHovered(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    button.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      button.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [x, y]);

  const baseClasses = variant === 'primary' 
    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'
    : 'bg-white/10 text-white border border-white/20 hover:bg-white/20';

  return (
    <motion.button
      ref={buttonRef}
      style={{ x: springX, y: springY }}
      onMouseEnter={() => setIsHovered(true)}
      onClick={onClick}
      className={`
        relative px-8 py-4 rounded-full font-semibold text-lg
        transition-all duration-300 overflow-hidden
        ${baseClasses} ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* Ripple effect container */}
      <RippleEffect />
      <span className="relative z-10">{children}</span>
      
      {/* Magnetic glow */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 opacity-30 blur-xl"
          initial={{ scale: 0 }}
          animate={{ scale: 1.5 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  );
};

// ==================== RIPPLE EFFECT ====================
const RippleEffect: React.FC = () => {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const button = (e.currentTarget as HTMLElement);
      const rect = button.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newRipple = { x, y, id: Date.now() };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    };

    const buttons = document.querySelectorAll('button');
    buttons.forEach(btn => btn.addEventListener('click', handleClick as any));
    
    return () => {
      buttons.forEach(btn => btn.removeEventListener('click', handleClick as any));
    };
  }, []);

  return (
    <AnimatePresence>
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
          }}
          initial={{ width: 0, height: 0, opacity: 1 }}
          animate={{ width: 400, height: 400, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
    </AnimatePresence>
  );
};

// ==================== SCROLL PROGRESS ====================
export const ScrollProgress: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const progressSpring = useReactSpring({
    width: `${scrollProgress}%`,
    config: config.molasses,
  });

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight - windowHeight;
      const scrolled = window.scrollY;
      const progress = (scrolled / documentHeight) * 100;
      
      setScrollProgress(Math.min(100, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 z-50">
        <animated.div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          style={progressSpring}
        />
      </div>
      
      {/* Circular progress indicator */}
      <motion.div 
        className="fixed bottom-8 right-8 z-50 hidden md:block"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: scrollProgress > 5 ? 1 : 0, scale: scrollProgress > 5 ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative w-16 h-16">
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
              fill="none"
            />
            <motion.circle
              cx="32"
              cy="32"
              r="28"
              stroke="url(#gradient)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 28}
              strokeDashoffset={2 * Math.PI * 28 * (1 - scrollProgress / 100)}
              transition={{ duration: 0.1 }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#a855f7" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
            {Math.round(scrollProgress)}%
          </div>
        </div>
      </motion.div>
    </>
  );
};

// ==================== PARALLAX LAYERS ====================
export const ParallaxLayers: React.FC = () => {
  const scrollY = useMotionValue(0);
  
  useEffect(() => {
    const handleScroll = () => {
      scrollY.set(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);
  
  // Different speeds for depth effect
  const y1 = useTransform(scrollY, [0, 1000], [0, -100]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -300]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Layer 1 - Slowest */}
      <motion.div style={{ y: y1 }} className="absolute inset-0">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </motion.div>
      
      {/* Layer 2 - Medium */}
      <motion.div style={{ y: y2 }} className="absolute inset-0">
        <div className="absolute top-60 left-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-2xl" />
        <div className="absolute top-80 right-1/3 w-56 h-56 bg-indigo-500/10 rounded-full blur-2xl" />
      </motion.div>
      
      {/* Layer 3 - Fastest */}
      <motion.div style={{ y: y3 }} className="absolute inset-0">
        <div className="absolute top-96 left-1/2 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl" />
      </motion.div>
    </div>
  );
};

// ==================== HOVER REVEAL CARD ====================
interface HoverRevealCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient?: string;
}

export const HoverRevealCard: React.FC<HoverRevealCardProps> = ({
  title,
  description,
  icon,
  gradient = 'from-blue-500 to-purple-500'
}) => {
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <motion.div
        ref={cardRef}
        className="relative group overflow-hidden rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-8 h-full"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02, y: -5 }}
        transition={{ duration: 0.3 }}
      >
        {/* Gradient spotlight effect */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              style={{
                background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(59, 130, 246, 0.15), transparent 40%)`,
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10">
          {/* Icon with rotation on hover */}
          <motion.div
            className={`w-16 h-16 mb-6 rounded-xl bg-gradient-to-br ${gradient} p-3 text-white`}
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            {icon}
          </motion.div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>

          {/* Description with reveal effect */}
          <motion.p
            className="text-slate-300 leading-relaxed"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
          >
            {description}
          </motion.p>

          {/* Hover arrow */}
          <motion.div
            className="mt-6 text-blue-400 font-semibold flex items-center gap-2"
            initial={{ x: -10, opacity: 0 }}
            animate={isHovered ? { x: 0, opacity: 1 } : { x: -10, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            Learn more →
          </motion.div>
        </div>

        {/* Border glow effect */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)`,
            backgroundSize: '200% 100%',
          }}
          animate={isHovered ? { backgroundPosition: ['0% 0%', '200% 0%'] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </motion.div>
    </motion.div>
  );
};

// ==================== MORPHING BACKGROUND SHAPES ====================
export const MorphingShapes: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full mix-blend-screen filter blur-3xl opacity-20"
          style={{
            width: 400 + i * 100,
            height: 400 + i * 100,
            background: `radial-gradient(circle, ${
              ['#3b82f6', '#a855f7', '#ec4899'][i]
            }, transparent)`,
          }}
          animate={{
            x: [0, 100, 0, -100, 0],
            y: [0, -100, 0, 100, 0],
            scale: [1, 1.2, 1, 0.8, 1],
          }}
          transition={{
            duration: 20 + i * 5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 2,
          }}
          initial={{
            x: Math.random() * 400 - 200,
            y: Math.random() * 400 - 200,
          }}
        />
      ))}
    </div>
  );
};

// ==================== ANIMATED INPUT ====================
interface AnimatedInputProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
  placeholder,
  value,
  onChange,
  icon,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className="relative"
      animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Icon */}
      {icon && (
        <motion.div
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          animate={isFocused ? { scale: 1.1, color: '#3b82f6' } : { scale: 1 }}
        >
          {icon}
        </motion.div>
      )}

      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full ${icon ? 'pl-12' : 'pl-6'} pr-6 py-4 rounded-full
          bg-slate-800/50 backdrop-blur-sm
          border-2 border-white/10
          text-white placeholder-slate-400
          outline-none transition-all duration-300
          ${isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : ''}
        `}
      />

      {/* Focus ring animation */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-blue-500"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 1.1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, repeat: Infinity }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ==================== LOADING SKELETON ====================
export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-slate-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-slate-700 rounded w-1/2"></div>
    </div>
  );
};
