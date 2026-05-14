/**
 * NewFeaturePill Component
 * Header navigation element that shows count of new features (last 30 days)
 * with animated pulse effect when new features exist
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useFeaturedCount } from '@/hooks/useReleases';
import { cn } from '@/lib/utils';
import { MateMasie } from '@/components/icons/adinkra';

interface NewFeaturePillProps {
  className?: string;
}

export const NewFeaturePill: React.FC<NewFeaturePillProps> = ({ className }) => {
  const navigate = useNavigate();
  const { data: count = 0, isLoading } = useFeaturedCount();

  // Don't show if no new features or loading
  if (isLoading || count === 0) return null;

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={() => navigate('/releases?filter=featured')}
      className={cn(
        'relative inline-flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-gradient-to-r from-dna-emerald to-dna-forest',
        'text-white text-sm font-semibold',
        'shadow-lg hover:shadow-xl transition-shadow cursor-pointer',
        'group overflow-hidden',
        className
      )}
    >
      {/* Animated pulse background */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-full"
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      <MateMasie className="w-4 h-4 relative z-10" />

      <span className="relative z-10">What's New</span>

      {/* Count badge */}
      <span className="relative z-10 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
        {count}
      </span>

      <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
    </motion.button>
  );
};

/**
 * Compact variant for mobile or space-constrained areas
 */
export const NewFeaturePillCompact: React.FC<NewFeaturePillProps> = ({
  className,
}) => {
  const { data: count = 0, isLoading } = useFeaturedCount();

  if (isLoading || count === 0) {
    return null;
  }

  return (
    <Link
      to="/releases?filter=featured"
      className={cn(
        'relative inline-flex items-center justify-center',
        'w-8 h-8 rounded-full',
        'bg-dna-emerald/20 text-dna-emerald',
        'hover:bg-dna-emerald/30',
        'transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-dna-emerald',
        className
      )}
      aria-label={`${count} new features`}
    >
      <MateMasie className="w-4 h-4" />

      {/* Count indicator */}
      {count > 0 && (
        <span
          className={cn(
            'absolute -top-0.5 -right-0.5',
            'min-w-[16px] h-4 px-1',
            'flex items-center justify-center',
            'text-[10px] font-bold rounded-full',
            'bg-dna-emerald text-white',
            'border-2 border-white'
          )}
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
};

export default NewFeaturePill;
