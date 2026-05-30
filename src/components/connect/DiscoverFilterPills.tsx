import React from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterState {
  primary_origin_country?: string;
  current_country?: string;
  focus_areas?: string[];
  regional_expertise?: string[];
  industries?: string[];
  skills?: string[];
}

interface DiscoverFilterPillsProps {
  filters: FilterState;
  onOpenSheet: () => void;
  activeCount: number;
}

export const DiscoverFilterPills: React.FC<DiscoverFilterPillsProps> = ({
  filters,
  onOpenSheet,
  activeCount,
}) => {
  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.button
      initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, scale: 1 }}
      transition={{ type: 'spring' as const, stiffness: 400, damping: 25 }}
      onClick={onOpenSheet}
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 rounded-full',
        'text-xs font-medium whitespace-nowrap',
        'border transition-all duration-200',
        'active:scale-95',
        activeCount > 0
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted/50 text-muted-foreground border-border/50 hover:bg-muted'
      )}
      aria-label={`Open filters${activeCount > 0 ? `, ${activeCount} active` : ''}`}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary-foreground/20 text-[10px] font-semibold">
          {activeCount}
        </span>
      )}
    </motion.button>
  );
};
