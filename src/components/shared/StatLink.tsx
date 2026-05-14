/**
 * StatLink - Shared clickable stat primitive
 * Used across QuickStats, Pulse tiles, hub stats bars, and greeting meta.
 * Ensures every count/label routes somewhere with proper a11y + 44px touch target.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StatLinkProps {
  to?: string;
  onClick?: () => void;
  ariaLabel: string;
  className?: string;
  children: React.ReactNode;
  as?: 'tile' | 'inline' | 'chip';
}

export const StatLink: React.FC<StatLinkProps> = ({
  to,
  onClick,
  ariaLabel,
  className,
  children,
  as = 'tile',
}) => {
  const navigate = useNavigate();
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) onClick();
    else if (to) navigate(to);
  };

  const base =
    as === 'inline'
      ? 'inline-flex items-center gap-1 rounded-md px-1 -mx-1 hover:bg-muted/60 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
      : as === 'chip'
        ? 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/60 hover:bg-muted text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[32px]'
        : 'flex flex-col items-start gap-0.5 rounded-md p-2 text-left bg-muted/50 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer min-h-[44px]';

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={cn(base, className)}
    >
      {children}
    </button>
  );
};

export default StatLink;
