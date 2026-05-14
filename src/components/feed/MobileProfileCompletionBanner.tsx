/**
 * Mobile Profile Completion Banner
 * 
 * Shows above feed tabs with:
 * - Auto-fade out animation after 30 seconds
 * - Resets daily and on login
 * - Confetti celebration at 100% completion (one-time only)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileAccess } from '@/hooks/useProfileAccess';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';
import { Sankofa } from '@/components/icons/adinkra';

const STORAGE_KEY_PREFIX = 'dna_profile_banner_shown_';
const CONFETTI_SHOWN_KEY = 'dna_profile_100_confetti_shown';
const AUTO_HIDE_DELAY = 30000; // 30 seconds

interface MobileProfileCompletionBannerProps {
  threshold?: number;
}

const getStorageKey = (userId: string) => `${STORAGE_KEY_PREFIX}${userId}`;

const hasShownThisSession = (userId: string, sessionTimestamp: number): boolean => {
  try {
    const stored = localStorage.getItem(getStorageKey(userId));
    if (!stored) return false;
    
    const data = JSON.parse(stored);
    const today = new Date().toDateString();
    
    if (data.date !== today) return false;
    if (sessionTimestamp > data.sessionTimestamp) return false;
    
    return true;
  } catch {
    return false;
  }
};

const markAsShown = (userId: string, sessionTimestamp: number): void => {
  try {
    const today = new Date().toDateString();
    localStorage.setItem(getStorageKey(userId), JSON.stringify({
      date: today,
      sessionTimestamp,
      shownAt: Date.now()
    }));
  } catch {}
};

const hasShownConfetti = (userId: string): boolean => {
  try {
    return localStorage.getItem(`${CONFETTI_SHOWN_KEY}_${userId}`) === 'true';
  } catch {
    return false;
  }
};

const markConfettiShown = (userId: string): void => {
  try {
    localStorage.setItem(`${CONFETTI_SHOWN_KEY}_${userId}`, 'true');
  } catch {}
};

// Standalone confetti function - completely outside React lifecycle
const fireConfetti = (): void => {
  const duration = 3000; // Reduced from 4000 to minimize DOM stress
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 40 * (timeLeft / duration); // Reduced particle count

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#C49A6C', '#D4AF37', '#2E8B57', '#CD5C5C', '#DAA520'],
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#C49A6C', '#D4AF37', '#2E8B57', '#CD5C5C', '#DAA520'],
    });
  }, 300); // Slower interval to reduce CPU load
};

export const MobileProfileCompletionBanner: React.FC<MobileProfileCompletionBannerProps> = ({
  threshold = 100,
}) => {
  const { user, session } = useAuth();
  const { completenessScore } = useProfileAccess();
  const navigate = useNavigate();
  
  // All state managed with refs to prevent re-render loops
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  // Refs to track initialization state - prevents multiple effect runs
  const confettiTriggeredRef = useRef(false);
  const bannerInitializedRef = useRef(false);
  const mountedRef = useRef(true);
  
  // Capture score at mount to detect 100% transition
  const initialScoreRef = useRef<number | null>(null);
  if (initialScoreRef.current === null && completenessScore !== undefined) {
    initialScoreRef.current = completenessScore;
  }

  // Stable session timestamp - only compute once per mount
  const sessionTimestampRef = useRef<number | null>(null);
  if (sessionTimestampRef.current === null && session?.access_token) {
    sessionTimestampRef.current = session.expires_at 
      ? (session.expires_at * 1000 - 3600000) 
      : Date.now();
  }

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Handle confetti - runs exactly once when hitting 100%
  useEffect(() => {
    if (!user?.id) return;
    if (confettiTriggeredRef.current) return;
    if (completenessScore < 100) return;
    if (hasShownConfetti(user.id)) return;
    
    // Immediately mark as triggered to prevent any re-runs
    confettiTriggeredRef.current = true;
    markConfettiShown(user.id);
    
    // Use requestAnimationFrame for smoother scheduling
    requestAnimationFrame(() => {
      if (mountedRef.current) {
        fireConfetti();
      }
    });
  }, [user?.id, completenessScore]);

  // Handle banner visibility - separate from confetti, runs once
  useEffect(() => {
    if (!user?.id) return;
    if (bannerInitializedRef.current) return;
    
    // Profile complete - hide banner permanently
    if (completenessScore >= 100) {
      bannerInitializedRef.current = true;
      setIsVisible(false);
      return;
    }

    const sessionTs = sessionTimestampRef.current || Date.now();

    // Check if already shown this session
    if (hasShownThisSession(user.id, sessionTs)) {
      bannerInitializedRef.current = true;
      setIsVisible(false);
      return;
    }

    // Show the banner
    bannerInitializedRef.current = true;
    setIsVisible(true);
    markAsShown(user.id, sessionTs);

    // Auto-hide timers
    const exitTimer = setTimeout(() => {
      if (mountedRef.current) {
        setIsExiting(true);
      }
    }, AUTO_HIDE_DELAY);

    const hideTimer = setTimeout(() => {
      if (mountedRef.current) {
        setIsVisible(false);
      }
    }, AUTO_HIDE_DELAY + 500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [user?.id, completenessScore]);

  // Memoized dismiss handler
  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      if (mountedRef.current) {
        setIsVisible(false);
      }
    }, 500);
  }, []);

  // Memoized navigate handler
  const handleNavigate = useCallback(() => {
    navigate('/dna/profile/edit');
  }, [navigate]);

  // Don't render if no user or profile is complete
  if (!user || completenessScore >= 100) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="profile-banner"
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={isExiting 
            ? { opacity: 0, x: -100, height: 0, marginBottom: 0 }
            : { opacity: 1, x: 0, height: 'auto', marginBottom: 8 }
          }
          exit={{ opacity: 0, x: -100, height: 0, marginBottom: 0 }}
          transition={isExiting 
            ? { duration: 0.3, ease: 'easeIn' }
            : { duration: 0.3, ease: 'easeOut' }
          }
          className="overflow-hidden"
        >
          <div className="mx-3 px-3 py-2 bg-gradient-to-r from-dna-copper/10 via-dna-gold/5 to-dna-emerald/10 border border-dna-copper/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Sankofa className="h-3.5 w-3.5 text-dna-copper flex-shrink-0" />
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className="text-xs font-medium whitespace-nowrap">{completenessScore}%</span>
                <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${completenessScore}%`,
                      background: completenessScore > 0 
                        ? 'linear-gradient(90deg, hsl(var(--dna-copper)), hsl(var(--dna-gold)), hsl(var(--dna-emerald)))'
                        : 'transparent'
                    }}
                  />
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-dna-copper hover:text-dna-gold hover:bg-dna-copper/10 flex-shrink-0"
                onClick={handleNavigate}
              >
                Complete
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              <button 
                onClick={handleDismiss} 
                className="text-muted-foreground hover:text-foreground p-0.5 flex-shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
