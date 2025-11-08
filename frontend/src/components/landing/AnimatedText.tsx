import { useEffect, useRef, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface AnimatedTextProps {
  children: string;
  className?: string;
  staggerDelay?: number;
  animationDelay?: number;
}

export default function AnimatedText({
  children,
  className = '',
  staggerDelay = 0.03,
  animationDelay = 0,
}: AnimatedTextProps) {
  const letters = children.split('');

  return (
    <span className={className}>
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: animationDelay + index * staggerDelay,
            ease: [0.6, 0.01, 0.05, 0.95],
          }}
          whileHover={{
            scale: 1.2,
            color: '#6366f1',
            transition: { duration: 0.2 },
          }}
          style={{ display: 'inline-block' }}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
    </span>
  );
}

interface AnimatedWordProps {
  children: string;
  className?: string;
  wordDelay?: number;
}

export function AnimatedWord({
  children,
  className = '',
  wordDelay = 0.05,
}: AnimatedWordProps) {
  const words = children.split(' ');

  return (
    <span className={className}>
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', marginRight: '0.3em' }}>
          {word.split('').map((letter, letterIndex) => (
            <motion.span
              key={letterIndex}
              initial={{ opacity: 0, y: 50, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 0.6,
                delay: wordIndex * wordDelay + letterIndex * 0.03,
                ease: [0.6, 0.01, 0.05, 0.95],
              }}
              whileHover={{
                scale: 1.3,
                color: '#ec4899',
                rotateZ: [0, -10, 10, 0],
                transition: { duration: 0.3 },
              }}
              style={{
                display: 'inline-block',
                transformOrigin: 'bottom',
              }}
            >
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
}
