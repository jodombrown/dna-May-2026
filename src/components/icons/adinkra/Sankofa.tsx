import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdinkraIcon, AdinkraIconProps } from './AdinkraIcon';

/**
 * Sankofa
 * Meaning: "Go back and get it" - learn from the past to build the future.
 * Tradition: Adinkra (Akan people, Ghana / Cote d'Ivoire).
 * DNA usage: CONNECT module identity. The diaspora's symbol of returning to roots.
 *
 * Construction (v3): solid silhouette traced from authentic Noun Project artwork
 * by By Spark. Bird with body curving forward, head turned backward, eye dot,
 * and the classic Sankofa beak detail.
 *
 * Rendering: solid fill via currentColor (filled prop on AdinkraIcon).
 * The strokeWidth prop is a no-op on this variant.
 *
 * License: artwork CC BY 3.0 (By Spark, Noun Project). Attribution surface
 * (footer credit or /about/iconography page) tracked as a follow-up.
 */
export const Sankofa = forwardRef<SVGSVGElement, AdinkraIconProps>((props, ref) => (
  <AdinkraIcon ref={ref} filled fillRule="evenodd" {...props}>
    <path d="M9.36 1C7.78 1.35 5.83 3.2 4.72 5.42 4.17 6.54 3.73 7.87 3.51 9.12 3.29 10.41 3.26 11.87 3.44 12.72 3.91 14.93 5.32 16.46 7.62 17.25 8.11 17.41 9.18 17.66 9.41 17.66 9.5 17.66 9.52 17.67 9.5 17.75 9.29 18.69 8.85 21.24 8.89 21.28 8.92 21.31 9.09 21.42 9.27 21.53L9.59 21.73 9.62 21.62C9.63 21.56 9.8 20.68 9.99 19.65 10.18 18.62 10.35 17.77 10.35 17.76 10.36 17.75 10.59 17.74 10.85 17.73L11.34 17.72 11.35 17.88C11.37 17.97 11.39 19.12 11.42 20.45 11.47 23.27 11.41 23 11.97 23L12.31 23 12.3 22.71C12.29 22.56 12.27 21.53 12.25 20.43 12.23 19.33 12.2 18.26 12.2 18.04L12.19 17.64 12.64 17.55C15.06 17.07 17.1 15.46 19.13 12.44 19.51 11.88 19.99 11.04 20.41 10.18 21.03 8.94 21.02 8.97 20.56 9.38 19.81 10.03 19.15 10.47 18.91 10.47 18.62 10.47 18.86 9.91 19.57 8.92 19.81 8.59 20.08 8.22 20.17 8.11 20.36 7.88 20.36 7.88 19.69 8.38 18.83 9.01 18.16 9.44 18 9.44 17.79 9.44 18.19 8.63 18.74 7.92 18.88 7.75 18.86 7.74 18.64 7.89 18.02 8.31 16.55 9.13 15.47 9.66 13.12 10.8 11.4 11.31 9.87 11.31 8.01 11.31 6.99 10.51 6.63 8.76 6.26 6.96 7.11 5.36 8.63 4.97 10.04 4.61 11.36 5.42 11.99 7.05 12.13 7.4 12.18 7.46 12.16 7.22 11.93 5.48 12.36 5.11 12.88 6.6L13 6.93 12.97 6.57C12.74 2.74 11.33 0.57 9.36 1ZM10.7 2.15C10.94 2.45 10.56 2.85 10.29 2.59 10.1 2.39 10.22 2.04 10.49 2.04 10.58 2.04 10.64 2.07 10.7 2.15ZM12.54 6.9C12.26 7.02 12.12 7.56 12.27 7.99 12.41 8.41 12.86 8.56 13.11 8.27 13.52 7.81 13.05 6.7 12.54 6.9Z" />
  </AdinkraIcon>
)) as unknown as LucideIcon;
