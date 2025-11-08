import { useState } from 'react';
import { motion } from 'framer-motion';

export interface Professor {
  id: number;
  name: string;
  department: string;
  rating: number;
  reviews: number;
  imageUrl?: string;
}

interface ProfessorCardProps {
  professor: Professor;
  index: number;
}

export default function ProfessorCard({ professor, index }: ProfessorCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = () => {
    setIsHovered(true);
    // Removed trackEvent - metrics endpoint doesn't exist
    // Just track hover state visually
  };

  const handleLeave = () => {
    setIsHovered(false);
  };

  // Alternating shapes for visual interest
  // Default to circle, change to rounded square on hover
  const getClipPathStyle = () => {
    if (isHovered) {
      // Rounded square when hovered
      return 'none'; // Will use border-radius for rounded square
    } else {
      // Perfect circle when not hovered
      return 'circle(45% at 50% 50%)';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative w-full max-w-sm mx-auto"
      onMouseEnter={handleHover}
      onMouseLeave={handleLeave}
    >
      {/* Main card with custom clip-path */}
      <div
        className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden transition-all duration-500"
        style={{
          clipPath: getClipPathStyle(),
          borderRadius: isHovered ? '16px' : '0', // Rounded square when hovered
          transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Professor image placeholder - removed initials */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold">
            {/* Empty - no initials shown */}
          </div>
        </div>

        {/* Glow effect on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent blur-xl pointer-events-none" />
        )}

        {/* Detail reveal on hover - uses animated clip-path */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center p-8 z-10"
          initial={{ clipPath: 'circle(0% at 50% 50%)' }}
          animate={{
            clipPath: isHovered ? 'circle(150% at 50% 50%)' : 'circle(0% at 50% 50%)',
          }}
          transition={{ duration: 0.6, ease: [0.6, 0.01, 0.05, 0.95] }}
          style={{ pointerEvents: isHovered ? 'auto' : 'none' }}
        >
          <div className="text-center text-white">
            <div className="text-5xl font-bold mb-4">{professor.rating.toFixed(1)}</div>
            <div className="text-lg mb-2">Average Rating</div>
            <div className="text-sm opacity-80">{professor.reviews} reviews</div>
            <a
              href={`http://localhost:3000/professors/${professor.id}`}
              className="inline-block mt-6 px-6 py-2 bg-white text-primary font-semibold rounded-full hover:scale-110 active:scale-95 transition-transform no-underline"
              style={{ cursor: 'pointer' }}
              onClick={() => {
                console.log('View Profile clicked for professor:', professor.id);
                console.log('Target URL:', `http://localhost:3000/professors/${professor.id}`);
              }}
            >
              View Profile
            </a>
          </div>
        </motion.div>
      </div>

      {/* Info below card */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-xl font-bold text-white mb-1">{professor.name}</h3>
        <p className="text-sm text-gray-400">{professor.department}</p>
        
        {/* Rating stars */}
        <div className="flex justify-center items-center gap-1 mt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.svg
              key={i}
              whileHover={{ scale: 1.3, rotate: 360 }}
              transition={{ duration: 0.3 }}
              className={`w-5 h-5 ${
                i < Math.floor(professor.rating) ? 'text-yellow-400' : 'text-gray-600'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </motion.svg>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
