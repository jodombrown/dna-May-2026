/**
 * Adinkrahene — "chief of Adinkra symbols"
 * Concentric circles signifying greatness, charisma, leadership.
 * Used as the visual signature for the CONTRIBUTE module.
 */
import React from 'react';
import { cn } from '@/lib/utils';

interface AdinkrahenIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  ariaLabel?: string;
}

export const AdinkrahenIcon: React.FC<AdinkrahenIconProps> = ({
  className,
  size = 24,
  strokeWidth = 1.5,
  ariaLabel = 'Adinkrahene',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    role="img"
    aria-label={ariaLabel}
    className={cn(className)}
  >
    <circle cx="16" cy="16" r="13" />
    <circle cx="16" cy="16" r="9" />
    <circle cx="16" cy="16" r="5" />
    <circle cx="16" cy="16" r="1.5" fill="currentColor" />
  </svg>
);

export default AdinkrahenIcon;
