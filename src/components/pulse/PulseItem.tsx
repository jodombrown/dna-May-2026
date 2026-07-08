/**
 * PulseItem - Individual Pulse Bar Item Component
 *
 * Displays a single C item with animated indicator, activity dots, micro-text,
 * and hover preview card. Features living pulse animations and click feedback.
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PulseSection, PulseConfig, PulseStatus } from '@/types/pulse';
import { PulsePreviewCard } from './PulsePreviewCard';
import {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
} from '@/components/icons/adinkra';

const ICONS: Record<string, LucideIcon> = {
  Sankofa,
  Nkonsonkonson,
  FuntunfunefuDenkyemfunefu,
  Adinkrahene,
  Mpatapo,
};

// Warm-import the destination hub chunk on hover/touch so navigation is
// instant. React lazy() caches the module promise, so the actual <Link>
// click resolves synchronously if the chunk is already fetched.
const ROUTE_PREFETCH: Record<string, () => Promise<unknown>> = {
  '/dna/connect': () => import('@/pages/dna/connect/Connect'),
  '/dna/convene': () => import('@/pages/dna/convene/ConveneHub'),
  '/dna/collaborate': () => import('@/pages/dna/collaborate/CollaborateHub'),
  '/dna/contribute': () => import('@/pages/dna/contribute/ContributeHub'),
  '/dna/convey': () => import('@/pages/dna/convey/ConveyHub'),
};
const prefetchedRoutes = new Set<string>();
function prefetchRoute(href: string) {
  if (prefetchedRoutes.has(href)) return;
  const loader = ROUTE_PREFETCH[href];
  if (!loader) return;
  prefetchedRoutes.add(href);
  loader().catch(() => prefetchedRoutes.delete(href));
}

interface PulseItemProps {
  config: PulseConfig;
  data?: PulseSection;
  pulseKey: string;
}

const STATUS_COLORS: Record<PulseStatus, { bg: string; glow: string; text: string; indicator: string }> = {
  active: {
    bg: 'bg-primary/8 hover:bg-primary/14',
    glow: 'shadow-[0_0_12px_-2px_hsl(var(--primary)/0.3)]',
    text: 'text-primary',
    indicator: 'bg-primary',
  },
  attention: {
    bg: 'bg-amber-500/8 hover:bg-amber-500/14',
    glow: 'shadow-[0_0_12px_-2px_hsl(36,90%,50%,0.3)]',
    text: 'text-amber-600',
    indicator: 'bg-amber-500',
  },
  dormant: {
    bg: 'bg-muted/40 hover:bg-muted/60',
    glow: '',
    text: 'text-muted-foreground',
    indicator: 'bg-muted-foreground/30',
  },
  urgent: {
    bg: 'bg-destructive/8 hover:bg-destructive/14',
    glow: 'shadow-[0_0_16px_-2px_hsl(var(--destructive)/0.4)]',
    text: 'text-destructive',
    indicator: 'bg-destructive',
  },
};

export function PulseItem({ config, data, pulseKey }: PulseItemProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const Icon = ICONS[config.icon] || Sankofa;
  const status: PulseStatus = data?.status || 'dormant';
  const count = data?.count || 0;
  const microText = data?.micro_text || '';
  const hasItems = data?.top_items && data.top_items.length > 0;
  const colors = STATUS_COLORS[status];

  // Calculate activity dots (1-5 based on count)
  const activityLevel = Math.min(Math.max(count, 0), 5);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setShowPreview(true);
    prefetchRoute(config.href);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowPreview(false);
    }, 150);
  };

  React.useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative flex-1 min-w-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        transition={{ duration: 0.12 }}
      >
        <Link
          to={config.href}
          className={cn(
            'flex flex-col items-center p-2.5 rounded-xl transition-all duration-200',
            'border border-transparent',
            colors.bg,
            colors.text,
            status !== 'dormant' && colors.glow,
            status !== 'dormant' && 'border-current/10',
          )}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
        >
          {/* Icon + Label Row */}
          <div className="flex items-center gap-1.5">
            {/* Animated Status Indicator */}
            <span className="relative flex h-2 w-2">
              {(status === 'active' || status === 'urgent') && (
                <motion.span
                  className={cn(
                    'absolute inset-0 rounded-full opacity-40',
                    colors.indicator,
                  )}
                  animate={{
                    scale: [1, 1.8, 1],
                    opacity: [0.4, 0, 0.4],
                  }}
                  transition={{
                    duration: status === 'urgent' ? 1.2 : 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
              {status === 'attention' && (
                <motion.span
                  className={cn(
                    'absolute inset-0 rounded-full opacity-30',
                    colors.indicator,
                  )}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}
              <span
                className={cn(
                  'relative inline-flex rounded-full h-2 w-2',
                  colors.indicator,
                )}
              />
            </span>

            <Icon className="w-[18px] h-[18px]" />

            <span className="text-xs font-semibold tracking-wide hidden sm:inline">
              {config.label}
            </span>

            {/* Count badge when active */}
            {count > 0 && (
              <span className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                'bg-current/10',
              )}>
                {count}
              </span>
            )}
          </div>

          {/* Micro-text */}
          <span className="text-[11px] text-center truncate max-w-full px-1 opacity-70 mt-0.5">
            {microText}
          </span>
        </Link>
      </motion.div>

      {/* Hover Preview Card */}
      {showPreview && hasItems && (
        <PulsePreviewCard
          label={config.label}
          items={data!.top_items}
          href={config.href}
        />
      )}
    </div>
  );
}

export default PulseItem;
