/**
 * Dark Mode Toggle - Because Your Eyes Deserve Better
 * A humorous toggle button that roasts you for your theme choice
 */

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { LeverSwitch } from './ui/lever-switch';

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
  const { theme, isDark } = useTheme();
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

  // Watch for theme changes and show roast
  useEffect(() => {
    if (!mounted) return;
    
    const currentTheme = isDark ? 'dark' : 'light';
    setRoast(getRandomRoast(currentTheme));
    setShowRoast(true);
    
    const timer = setTimeout(() => {
      setShowRoast(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [theme, mounted]);

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return <div className="w-40 h-10" />;
  }

  return (
    <div className="relative flex items-center gap-2 sm:gap-3">
      {/* Lever Switch */}
      <LeverSwitch />

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
              px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-xl whitespace-nowrap
              font-medium text-xs sm:text-sm pointer-events-none z-50
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
