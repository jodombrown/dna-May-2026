import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdinkraIcon, AdinkraIconProps } from './AdinkraIcon';

/**
 * Adinkrahene
 * Meaning: "King of the Adinkra symbols" - greatness, leadership, charisma.
 * Said to be the inspiration for all other Adinkra symbols.
 * Tradition: Adinkra (Akan people, Ghana / Cote d'Ivoire).
 * DNA usage: CONTRIBUTE module identity. Generosity radiates outward.
 *
 * Construction (v3): solid silhouette traced from authentic Noun Project artwork
 * by By Spark. Three concentric rings around a solid center, rendered with
 * even-odd fill so the rings read as rings, not solid disks.
 *
 * Rendering: solid fill via currentColor (filled prop on AdinkraIcon).
 * The strokeWidth prop is a no-op on this variant.
 *
 * License: artwork CC BY 3.0 (By Spark, Noun Project). Attribution surface
 * (footer credit or /about/iconography page) tracked as a follow-up.
 */
export const Adinkrahene = forwardRef<SVGSVGElement, AdinkraIconProps>((props, ref) => (
  <AdinkraIcon ref={ref} filled fillRule="evenodd" {...props}>
    <path d="M11.15 1.03C11.08 1.04 10.78 1.08 10.47 1.13 8.13 1.46 5.97 2.56 4.19 4.33 2.42 6.11 1.35 8.25 1 10.72 0.89 11.49 0.9 13.14 1.02 13.87 1.68 18.01 4.37 21.33 8.26 22.79L8.74 22.97 12.2 22.96 15.65 22.95 16.22 22.72C19.6 21.36 22.08 18.59 23 15.14 24.6 9.18 21.05 3.02 15.06 1.38 14.07 1.12 13.51 1.04 12.32 1.03 11.74 1.02 11.21 1.03 11.15 1.03ZM13.55 2.36C17.91 2.97 21.38 6.45 22.04 10.86 22.13 11.52 22.13 12.99 22.03 13.63 21.29 18.51 17.3 22.07 12.42 22.22 7.69 22.35 3.51 19.14 2.42 14.53 2.08 13.06 2.09 11.22 2.46 9.79 3.5 5.76 6.86 2.83 11.03 2.32 11.57 2.25 12.97 2.27 13.55 2.36ZM11.6 3.95C6.43 4.29 2.82 9.24 4.08 14.28 5.19 18.74 9.77 21.45 14.25 20.29 18.83 19.1 21.5 14.26 20.08 9.74 19.15 6.82 16.62 4.59 13.61 4.06 13.24 3.99 12.28 3.9 12.11 3.91 12.07 3.91 11.84 3.93 11.6 3.95ZM13.58 5.33C16.36 5.92 18.51 8.11 19.08 10.92 19.21 11.57 19.21 12.92 19.08 13.57 18.4 16.96 15.56 19.29 12.13 19.29 8.54 19.29 5.61 16.7 5.13 13.09 5.06 12.52 5.11 11.39 5.23 10.81 5.85 7.86 8.22 5.66 11.22 5.24 11.72 5.17 13.06 5.22 13.58 5.33ZM11.42 7C9.23 7.3 7.44 8.99 6.95 11.23 6.85 11.69 6.85 12.79 6.95 13.26 7.49 15.77 9.64 17.53 12.14 17.53 15.35 17.52 17.84 14.64 17.37 11.48 17.28 10.89 17.18 10.55 16.88 9.95 16.15 8.45 14.88 7.45 13.24 7.07 12.85 6.98 11.84 6.94 11.42 7ZM13.13 8.35C14.56 8.71 15.66 9.81 16.05 11.26 16.2 11.81 16.2 12.68 16.05 13.24 15.48 15.39 13.29 16.69 11.16 16.14 9.15 15.63 7.83 13.64 8.17 11.61 8.55 9.27 10.85 7.76 13.13 8.35Z" />
  </AdinkraIcon>
)) as unknown as LucideIcon;
