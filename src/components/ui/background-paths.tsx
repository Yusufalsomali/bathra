"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { User } from "@/lib/simple-auth-service";
import { useState, useEffect } from "react";

function FloatingPaths({ position }: { position: number }) {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
  }, []);

  // Reduce number of paths for iOS to prevent crashes
  const pathCount = isIOS ? 8 : 18; // Significantly reduced from 36
  const paths = Array.from({ length: pathCount }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full" viewBox="0 0 696 316" fill="none">
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="url(#rainbow-stroke)"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.02}
            initial={{ pathLength: 0.3, opacity: 0.6 }}
            animate={
              isIOS
                ? {
                    // Simpler animation for iOS
                    opacity: [0.3, 0.5, 0.3],
                  }
                : {
                    // Full animation for other devices
                    pathLength: 1,
                    opacity: [0.3, 0.6, 0.3],
                    pathOffset: [0, 1, 0],
                  }
            }
            transition={{
              duration: isIOS ? 15 : 20 + Math.random() * 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        ))}
        <defs>
          <linearGradient
            id="rainbow-stroke"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#ff0000" offset="0%" />
            <stop stopColor="#ff7f00" offset="14.3%" />
            <stop stopColor="#ffff00" offset="28.6%" />
            <stop stopColor="#00ff00" offset="42.9%" />
            <stop stopColor="#0000ff" offset="57.1%" />
            <stop stopColor="#4b0082" offset="71.4%" />
            <stop stopColor="#9400d3" offset="85.7%" />
            <stop stopColor="#ff0000" offset="100%" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export interface BackgroundPathsProps {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  user?: User | null;
}

// Detect if a string contains Arabic characters
const isArabicText = (text: string) => /[\u0600-\u06FF]/.test(text);

export function BackgroundPaths({
  title = "Transform Your Vision Into Reality",
  subtitle = "Get funded. Invest wisely. Build the future together with strategic partners who believe in your potential.",
  buttonText = "Discover Excellence",
  buttonLink = "/signup",
  user = null,
}: BackgroundPathsProps) {
  const navigate = useNavigate();
  const isArabic = isArabicText(title);
  const words = title.split(" ");
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
  }, []);

  const handleButtonClick = () => {
    navigate(buttonLink);
  };

  return (
    <div className="relative min-h-[90vh] w-full flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        {!isIOS && <FloatingPaths position={-1} />}
      </div>

      <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className={`text-5xl sm:text-7xl md:text-8xl font-bold mb-8 ${isArabic ? "tracking-normal font-arabic" : "tracking-tighter"}`}>
            {isArabic ? (
              // Arabic: animate whole words — never split letters (breaks joining)
              words.map((word, wordIndex) => (
                <motion.span
                  key={wordIndex}
                  initial={{ y: isIOS ? 20 : 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: wordIndex * 0.15,
                    type: isIOS ? "tween" : "spring",
                    stiffness: isIOS ? undefined : 150,
                    damping: isIOS ? undefined : 25,
                    duration: isIOS ? 0.5 : undefined,
                  }}
                  className="inline-block mx-2 rainbow-text"
                >
                  {word}
                </motion.span>
              ))
            ) : (
              // English: animate letter by letter
              words.map((word, wordIndex) => (
                <span key={wordIndex} className="inline-block mr-4 last:mr-0">
                  {word.split("").map((letter, letterIndex) => (
                    <motion.span
                      key={`${wordIndex}-${letterIndex}`}
                      initial={{ y: isIOS ? 20 : 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{
                        delay: wordIndex * 0.1 + letterIndex * 0.03,
                        type: isIOS ? "tween" : "spring",
                        stiffness: isIOS ? undefined : 150,
                        damping: isIOS ? undefined : 25,
                        duration: isIOS ? 0.5 : undefined,
                      }}
                      className="inline-block rainbow-text"
                    >
                      {letter}
                    </motion.span>
                  ))}
                </span>
              ))
            )}
          </h1>

          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.8 }}
              className={`text-lg md:text-xl text-foreground mb-12 max-w-2xl mx-auto ${isArabic ? "font-arabic" : ""}`}
            >
              {subtitle}
            </motion.p>
          )}
          {!user && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2, duration: 0.8 }}
            >
              <div
                className={`inline-block group relative rounded-2xl 
                            overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300
                            rainbow-border rainbow-glow ${
                              isIOS ? "bg-white/95" : "backdrop-blur-lg"
                            }`}
              >
                <Button
                  variant="default"
                  onClick={handleButtonClick}
                  className={`rounded-[1.15rem] px-8 py-6 text-lg font-semibold 
                                transition-all duration-300 group-hover:-translate-y-0.5 
                                bg-black hover:bg-black/90 text-white hover:shadow-black/20
                                hover:shadow-md ${
                                  isIOS ? "bg-black/95" : "backdrop-blur-md"
                                }`}
                >
                  <span className="opacity-90 group-hover:opacity-100 transition-opacity">
                    {buttonText}
                  </span>
                  <span
                    className="ml-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-1.5 
                                    transition-all duration-300"
                  >
                    →
                  </span>
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
