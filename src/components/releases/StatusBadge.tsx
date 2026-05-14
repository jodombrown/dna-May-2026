/**
 * StatusBadge Component
 * Displays lifecycle stage badges for releases (NEW, RECENT, ARCHIVED)
 * Uses DNA brand colors with icons
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Clock, Archive } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

type BadgeStatus = 'new' | 'recent' | 'archived' | 'featured';

export interface StatusBadgeProps {
  status?: BadgeStatus;
  stage?: BadgeStatus;  // Alias for status (for backward compatibility)
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<BadgeStatus, { label: string; className: string; icon: React.ReactNode }> = {
  new: {
    label: 'NEW',
    className: 'bg-dna-gold text-dna-charcoal',
    icon: <MateMasie className="w-3 h-3" />,
  },
  featured: {
    label: 'FEATURED',
    className: 'bg-dna-gold text-dna-charcoal',
    icon: <MateMasie className="w-3 h-3" />,
  },
  recent: {
    label: 'RECENT',
    className: 'bg-dna-emerald text-white',
    icon: <Clock className="w-3 h-3" />,
  },
  archived: {
    label: 'ARCHIVED',
    className: 'bg-neutral-500 text-white',
    icon: <Archive className="w-3 h-3" />,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  stage,
  size = 'md',
  className
}) => {
  // Support both 'status' and 'stage' props
  const badgeStatus = status || stage || 'recent';
  const config = statusConfig[badgeStatus];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-0.5',
    md: 'px-2 py-0.5 text-[10px] gap-1',
    lg: 'px-2.5 py-1 text-xs gap-1.5',
  };

  // Adjust icon size based on badge size
  const iconSize = size === 'sm' ? 'w-2.5 h-2.5' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
  const IconWithSize = React.cloneElement(config.icon as React.ReactElement, {
    className: iconSize
  });

  return (
    <span
      className={cn(
        'inline-flex items-center font-bold tracking-wider rounded-md uppercase',
        config.className,
        sizeClasses[size],
        className
      )}
    >
      {IconWithSize}
      {config.label}
    </span>
  );
};

export default StatusBadge;
