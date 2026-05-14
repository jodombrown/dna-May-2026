/**
 * Adinkra icon set for the Five C's.
 *
 * Mapping (per project Iconography Rules):
 *   Connect      -> Sankofa                         (return and fetch it)
 *   Convene      -> Nkonsonkonson                   (chain link, human relations)
 *   Collaborate  -> Funtunfunefu Denkyemfunefu      (siamese crocodiles, unity in diversity)
 *   Contribute   -> Adinkrahene                     (chief of Adinkra, leadership)
 *   Convey       -> Mpatapo                         (knot of reconciliation, peacemaking)
 *
 * MateMasie is reserved for DIA surfaces, not the Five C's.
 *
 * All icons use `currentColor` so they inherit text color, and accept the
 * same props as a Lucide icon (`size`, `strokeWidth`, `className`).
 */
import React from 'react';
import { cn } from '@/lib/utils';

export interface AdinkraIconProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
  ariaLabel?: string;
}

interface BaseSvgProps extends AdinkraIconProps {
  label: string;
  children: React.ReactNode;
}

const BaseSvg: React.FC<BaseSvgProps> = ({
  className,
  size = 24,
  strokeWidth = 1.6,
  ariaLabel,
  label,
  children,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    role="img"
    aria-label={ariaLabel ?? label}
    className={cn(className)}
  >
    {children}
  </svg>
);

/** Sankofa - Connect. Stylized bird turning back to take an egg. */
export const SankofaIcon: React.FC<AdinkraIconProps> = (props) => (
  <BaseSvg {...props} label="Sankofa">
    {/* Body loop */}
    <path d="M8 22 C 8 12, 24 12, 24 20 C 24 25, 18 26, 14 24" />
    {/* Neck turning back */}
    <path d="M14 24 C 12 22, 12 18, 15 17" />
    {/* Head */}
    <circle cx="16.5" cy="15.5" r="1.6" fill="currentColor" stroke="none" />
    {/* Egg / seed */}
    <circle cx="19" cy="20.5" r="1.4" />
  </BaseSvg>
);

/** Nkonsonkonson - Convene. Chain links: two interlocked ovals. */
export const NkonsonkonsonIcon: React.FC<AdinkraIconProps> = (props) => (
  <BaseSvg {...props} label="Nkonsonkonson">
    <ellipse cx="11" cy="16" rx="6" ry="4" />
    <ellipse cx="21" cy="16" rx="6" ry="4" />
    <line x1="14.5" y1="16" x2="17.5" y2="16" />
  </BaseSvg>
);

/** Funtunfunefu Denkyemfunefu - Collaborate. Siamese crocodiles, shared center. */
export const FuntunfunefuIcon: React.FC<AdinkraIconProps> = (props) => (
  <BaseSvg {...props} label="Funtunfunefu Denkyemfunefu">
    {/* Two diamonds sharing a stomach */}
    <path d="M16 4 L 6 16 L 16 28 L 26 16 Z" />
    <path d="M6 16 L 16 12 L 26 16 L 16 20 Z" />
    {/* Shared center */}
    <circle cx="16" cy="16" r="1.4" fill="currentColor" stroke="none" />
  </BaseSvg>
);

/** Adinkrahene - Contribute. Concentric circles. */
export const AdinkrahenIcon: React.FC<AdinkraIconProps> = (props) => (
  <BaseSvg {...props} label="Adinkrahene">
    <circle cx="16" cy="16" r="12" />
    <circle cx="16" cy="16" r="8" />
    <circle cx="16" cy="16" r="4" />
    <circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none" />
  </BaseSvg>
);

/** Mpatapo - Convey. Knot of reconciliation: woven figure-of-eight loops. */
export const MpatapoIcon: React.FC<AdinkraIconProps> = (props) => (
  <BaseSvg {...props} label="Mpatapo">
    {/* Four overlapping loops forming a woven knot */}
    <path d="M16 5 C 22 9, 22 15, 16 16 C 10 15, 10 9, 16 5 Z" />
    <path d="M16 27 C 22 23, 22 17, 16 16 C 10 17, 10 23, 16 27 Z" />
    <path d="M5 16 C 9 10, 15 10, 16 16 C 15 22, 9 22, 5 16 Z" />
    <path d="M27 16 C 23 10, 17 10, 16 16 C 17 22, 23 22, 27 16 Z" />
  </BaseSvg>
);

/** MateMasie - DIA only (not for Five C's). Two concentric ears / "what I hear, I keep". */
export const MateMasieIcon: React.FC<AdinkraIconProps> = (props) => (
  <BaseSvg {...props} label="MateMasie">
    <path d="M10 8 C 6 8, 6 14, 10 14 C 12 14, 12 18, 10 18 C 6 18, 6 24, 10 24" />
    <path d="M22 8 C 26 8, 26 14, 22 14 C 20 14, 20 18, 22 18 C 26 18, 26 24, 22 24" />
  </BaseSvg>
);

export type AdinkraIconComponent = React.FC<AdinkraIconProps>;
