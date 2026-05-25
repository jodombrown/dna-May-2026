/**
 * PulseBar - Main Pulse Bar Container Component
 *
 * DNA's primary differentiator for desktop - a living, intelligent horizontal
 * bar that shows real-time status across all Five C's.
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { usePulseBar } from '@/hooks/usePulseBar';
import { useMobile } from '@/hooks/useMobile';
import { useSetCSSHeaderHeight } from '@/hooks/useSetCSSHeaderHeight';
import { PulseItem } from './PulseItem';
import { PULSE_CONFIG, type PulseKey } from '@/types/pulse';

const PULSE_KEYS: PulseKey[] = ['connect', 'convene', 'collaborate', 'contribute', 'convey'];

function PulseBarSkeleton() {
  return (
    <div className="w-full bg-background/80 backdrop-blur-md border-b border-border/50 px-4 py-2 fixed z-40 left-0" style={{ top: 'var(--unified-header-height, 56px)' }}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {PULSE_KEYS.map((key) => (
          <div key={key} className="flex-1 animate-pulse">
            <div className="h-14 bg-muted/50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function PulseBar() {
  const { user } = useAuth();
  const { isMobile } = useMobile();
  const { pulseData, isLoading } = usePulseBar();
  const pulseRef = useRef<HTMLDivElement>(null);
  useSetCSSHeaderHeight(pulseRef, '--pulse-bar-height');

  // Force pulse-bar-height to 0 when the bar isn't rendered (mobile or logged out)
  // so the global header spacer in BaseLayout doesn't reserve an empty band.
  React.useEffect(() => {
    if (isMobile || !user) {
      document.documentElement.style.setProperty('--pulse-bar-height', '0px');
      return () => {
        document.documentElement.style.removeProperty('--pulse-bar-height');
      };
    }
  }, [isMobile, user]);


  if (isMobile || !user) return null;

  if (isLoading) {
    return <PulseBarSkeleton />;
  }

  return (
    <motion.div
      ref={pulseRef}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'w-full backdrop-blur-md',
        'bg-gradient-to-r from-background/90 via-background/95 to-background/90',
        'border-b border-border/40',
        'px-2 sm:px-4 py-1.5',
        'fixed z-40 left-0',
        'shadow-sm',
      )}
      style={{ top: 'var(--unified-header-height, 56px)' }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {PULSE_KEYS.map((key, index) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.3 }}
            className="flex-1 min-w-0"
          >
            <PulseItem
              pulseKey={key}
              config={PULSE_CONFIG[key]}
              data={pulseData?.[key]}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export default PulseBar;
