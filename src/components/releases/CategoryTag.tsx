/**
 * CategoryTag Component
 * Displays Five C's category tags for releases (CONNECT, CONVENE, etc.)
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Users, Calendar, Handshake, Briefcase, Megaphone, Settings } from 'lucide-react';
import type { ReleaseCategory } from '@/types/releases';

interface CategoryConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: React.ReactNode;
  label: string;
}

const categories: Record<ReleaseCategory, CategoryConfig> = {
  CONNECT: {
    color: 'text-dna-emerald',
    bgColor: 'bg-dna-emerald/15',
    borderColor: 'border-dna-emerald/30',
    icon: <Users className="w-3.5 h-3.5" />,
    label: 'Connect',
  },
  CONVENE: {
    color: 'text-dna-copper',
    bgColor: 'bg-dna-copper/15',
    borderColor: 'border-dna-copper/30',
    icon: <Calendar className="w-3.5 h-3.5" />,
    label: 'Convene',
  },
  COLLABORATE: {
    color: 'text-dna-gold',
    bgColor: 'bg-dna-gold/15',
    borderColor: 'border-dna-gold/30',
    icon: <Handshake className="w-3.5 h-3.5" />,
    label: 'Collaborate',
  },
  CONTRIBUTE: {
    color: 'text-dna-forest',
    bgColor: 'bg-dna-forest/15',
    borderColor: 'border-dna-forest/30',
    icon: <Briefcase className="w-3.5 h-3.5" />,
    label: 'Contribute',
  },
  CONVEY: {
    color: 'text-dna-sunset',
    bgColor: 'bg-dna-sunset/15',
    borderColor: 'border-dna-sunset/30',
    icon: <Megaphone className="w-3.5 h-3.5" />,
    label: 'Convey',
  },
  PLATFORM: {
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
    borderColor: 'border-neutral-300',
    icon: <Settings className="w-3.5 h-3.5" />,
    label: 'Platform',
  },
};

interface CategoryTagProps {
  category: ReleaseCategory;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const CategoryTag: React.FC<CategoryTagProps> = ({
  category,
  className,
  showIcon = true,
  size = 'md'
}) => {
  const config = categories[category];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.color,
        config.bgColor,
        config.borderColor,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && config.icon}
      {config.label}
    </span>
  );
};

/**
 * CategoryButton Component
 * Interactive button variant for filtering by category
 */
export interface CategoryButtonProps {
  category: ReleaseCategory;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CategoryButton: React.FC<CategoryButtonProps> = ({
  category,
  isActive = false,
  onClick,
  className,
}) => {
  const config = categories[category];

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full transition-all',
        'border',
        'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2',
        isActive
          ? cn(config.bgColor, config.color, config.borderColor, 'ring-2 ring-offset-2')
          : cn('bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'),
        className
      )}
    >
      {config.icon}
      <span>{config.label}</span>
    </button>
  );
};

export const getCategoryConfig = (category: ReleaseCategory) => categories[category];

export default CategoryTag;
