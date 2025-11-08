/**
 * Dark Mode Toggle - Because Your Eyes Deserve Better
 * A humorous toggle button that roasts you for your theme choice
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Zap } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ROASTS = {
  dark: [
    "Welcome to the dark side 🦇",
    "Your eyes say thank you 😌",
    "Finally, some good taste ✨",
    "3 AM coder detected 🌙",
    "Vampire mode: ACTIVATED 🧛",
    "Embrace the void 🖤",
  ],
  light: [
    "My retinas! 😵",
    "Going full flashbang I see 💥",
    "Bold choice, sungazer ☀️",
    "The bugs can see you now 👀",
    "Vitamin D mode: ON 🌞",
    "Daytime warrior detected 🦁",
  ],
};

export default function DarkModeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();
  const [roast, setRoast] = useState('');
  const [showRoast, setShowRoast] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const getRandomRoast = (themeType: 'dark' | 'light') => {
    const roasts = ROASTS[themeType];
    return roasts[Math.floor(Math.random() * roasts.length)];
  };

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    toggleTheme();
    
    // Show humorous message
    setRoast(getRandomRoast(newTheme));
    setShowRoast(true);
    
    // Hide after 2 seconds
    setTimeout(() => {
      setShowRoast(false);
    }, 2000);
  };

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="w-24 h-10"></div> // Placeholder with same dimensions
    );
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <motion.button
        onClick={handleToggle}
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-full font-medium
          transition-all duration-300 overflow-hidden
          ${isDark 
            ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
            : 'bg-yellow-100 text-gray-900 hover:bg-yellow-200'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={isDark ? "Switch to Light Mode (if you dare)" : "Switch to Dark Mode (join us)"}
      >
        {/* Background glow effect */}
        <motion.div
          className={`absolute inset-0 ${isDark ? 'bg-yellow-400/10' : 'bg-gray-900/10'}`}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Icon with rotation animation */}
        <motion.div
          className="relative z-10"
          animate={{ rotate: isDark ? 0 : 180 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          {isDark ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </motion.div>

        {/* Text */}
        <span className="relative z-10 hidden sm:inline">
          {isDark ? 'Dark' : 'Light'}
        </span>

        {/* Sparkle effect on toggle */}
        <AnimatePresence>
          {showRoast && (
            <motion.div
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 1.5, 0], rotate: [0, 180, 360] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 pointer-events-none"
            >
              <Zap className="w-6 h-6 text-yellow-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Humorous Toast Message */}
      <AnimatePresence>
        {showRoast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.8 }}
            transition={{ type: 'spring', damping: 15 }}
            className={`
              absolute top-full mt-2 left-1/2 -translate-x-1/2 
              px-4 py-2 rounded-lg shadow-xl whitespace-nowrap
              font-medium text-sm pointer-events-none z-50
              ${isDark 
                ? 'bg-gray-800 text-yellow-400 border border-yellow-400/20' 
                : 'bg-white text-gray-900 border border-gray-200'
              }
            `}
          >
            {roast}
            {/* Arrow pointer */}
            <div 
              className={`
                absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45
                ${isDark ? 'bg-gray-800 border-l border-t border-yellow-400/20' : 'bg-white border-l border-t border-gray-200'}
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
