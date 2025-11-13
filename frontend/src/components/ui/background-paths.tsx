"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function FloatingPaths({ position }: { position: number }) {
    const paths = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
            380 - i * 5 * position
        } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
            152 - i * 5 * position
        } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
            684 - i * 5 * position
        } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
        width: 0.5 + i * 0.04,
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg
                className="w-full h-full"
                viewBox="0 0 696 316"
                fill="none"
                preserveAspectRatio="xMidYMid slice"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke="url(#gradient)"
                        strokeWidth={path.width}
                        strokeOpacity={0.15 + path.id * 0.02}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.6, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 20 + Math.random() * 10,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                            delay: path.id * 0.02,
                        }}
                    />
                ))}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#a5b4fc" stopOpacity="0.4" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}

export function BackgroundPaths({
    title = "Background Paths",
    buttonText = "Discover Excellence",
    onButtonClick,
}: {
    title?: string;
    buttonText?: string;
    onButtonClick?: () => void;
}) {
    const words = title.split(" ");

    return (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-gray-950">
            {/* Purple gradient background to match your theme */}
            <div className="absolute inset-0">
                {/* Main indigo/blue gradient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-br from-indigo-600/30 via-indigo-500/20 to-blue-600/30 rounded-full blur-3xl"></div>
                
                {/* Secondary glow for more depth */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-indigo-500/20 via-indigo-400/15 to-transparent rounded-full blur-2xl"></div>
            </div>

            {/* Animated paths overlay */}
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 2 }}
                    className="max-w-4xl mx-auto"
                >
                    <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-hero mb-8 pb-4">
                        {words.map((word, wordIndex) => (
                            <span
                                key={wordIndex}
                                className="inline-block mr-6 last:mr-0"
                            >
                                {word.split("").map((letter, letterIndex) => (
                                    <motion.span
                                        key={`${wordIndex}-${letterIndex}`}
                                        initial={{ y: 100, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        whileHover={{
                                            color: "#818cf8",
                                            scale: 1.1,
                                            transition: { duration: 0.2 }
                                        }}
                                        transition={{
                                            delay:
                                                wordIndex * 0.1 +
                                                letterIndex * 0.03,
                                            type: "spring",
                                            stiffness: 150,
                                            damping: 25,
                                        }}
                                        className="inline-block text-white cursor-default"
                                        style={{
                                            textShadow: '0 0 60px rgba(99, 102, 241, 0.5), 0 0 30px rgba(129, 140, 248, 0.3)',
                                            WebkitTextStroke: '0px',
                                            paintOrder: 'stroke fill'
                                        }}
                                    >
                                        {letter}
                                    </motion.span>
                                ))}
                            </span>
                        ))}
                    </h1>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                    >
                        <button
                            onClick={onButtonClick}
                            className="group px-8 py-4 text-lg font-semibold backdrop-blur-md 
                            bg-white/10 hover:bg-white/20 text-white transition-all duration-300 
                            border border-white/20 hover:border-white/40 rounded-2xl
                            hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5"
                        >
                            <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                                {buttonText}
                            </span>
                            <span className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                                transition-all duration-300 inline-block">
                                →
                            </span>
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}
