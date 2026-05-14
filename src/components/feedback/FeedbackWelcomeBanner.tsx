import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { Mpatapo } from '@/components/icons/adinkra';

const WELCOME_DISMISSED_KEY = 'dna_feedback_welcome_dismissed';

export function FeedbackWelcomeBanner() {
  const { data: profile } = useProfile();
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(WELCOME_DISMISSED_KEY) === 'true';
    if (!isDismissed) {
      setIsVisible(true);
      setShowConfetti(true);
      // Stop confetti after a few seconds
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || null;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-lg mx-4 mt-4 bg-gradient-to-r from-dna-copper/90 via-dna-forest/80 to-dna-copper/90 text-white shadow-lg"
      >
        {/* Sparkle decorations */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: Math.random() * 100 + '%',
                  y: Math.random() * 100 + '%'
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 2,
                  delay: Math.random() * 0.5,
                  repeat: 1,
                }}
                className="absolute"
              >
                <Mpatapo className="h-4 w-4 text-dna-gold" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss welcome banner"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Content */}
        <div className="px-6 py-5 text-center">
          <h2 className="text-xl font-bold mb-2">
            {firstName 
              ? `Welcome to the DNA Feedback Hub, ${firstName}! 🎉`
              : 'Welcome to the DNA Feedback Hub! 🎉'
            }
          </h2>
          <p className="text-white/90 text-sm mb-4 max-w-md mx-auto">
            This is your space to help shape DNA's future. Report bugs, suggest features, and share what's working.
          </p>
          <Button
            onClick={handleDismiss}
            variant="secondary"
            className="bg-white text-dna-forest hover:bg-white/90 font-medium"
          >
            Got it, let's go!
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
