import React, { forwardRef, SVGProps } from 'react';
import { cn } from '@/lib/utils';

export interface AdinkraIconProps extends Omit<SVGProps<SVGSVGElement>, 'color'> {
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  title?: string;
  /** Render with filled silhouette instead of outline (active state). */
  filled?: boolean;
}

/**
 * AdinkraIcon
 *
 * Base wrapper for the Adinkra icon family. Mirrors the lucide-react
 * component interface so symbols can be used as drop-in replacements.
 *
 * - viewBox 0 0 24 24
 * - currentColor stroke (theme-token aware)
 * - 1.75 default stroke-width, round caps and joins
 * - title prop renders <title> for tooltip + accessibility
 */
export const AdinkraIcon = forwardRef<SVGSVGElement, AdinkraIconProps & { children: React.ReactNode }>(
  ({ size = 24, strokeWidth = 1.75, color = 'currentColor', className, title, children, filled, ...rest }, ref) => {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 0 : strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('transition-colors duration-200', className)}
        aria-hidden={title ? undefined : true}
        role={title ? 'img' : undefined}
        {...rest}
      >
        {title ? <title>{title}</title> : null}
        {children}
      </svg>
    );
  }
);
AdinkraIcon.displayName = 'AdinkraIcon';
