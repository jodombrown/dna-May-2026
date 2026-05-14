import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdinkraIcon, AdinkraIconProps } from './AdinkraIcon';

/**
 * Funtunfunefu Denkyemfunefu
 * Meaning: Siamese crocodiles sharing one stomach - unity in diversity,
 * common destiny despite individual differences.
 * Tradition: Adinkra (Akan people, Ghana / Cote d'Ivoire).
 * DNA usage: COLLABORATE module identity. Shared interest, distinct contributors.
 *
 * Construction (v3): solid silhouette traced from authentic Noun Project artwork
 * by By Spark. Two mirrored crocodile bodies meeting at a shared central core
 * read clearly as "twin creatures sharing one body".
 *
 * Rendering: solid fill via currentColor (filled prop on AdinkraIcon).
 * The strokeWidth prop is a no-op on this variant.
 *
 * License: artwork CC BY 3.0 (By Spark, Noun Project). Attribution surface
 * (footer credit or /about/iconography page) tracked as a follow-up.
 */
export const FuntunfunefuDenkyemfunefu = forwardRef<SVGSVGElement, AdinkraIconProps>((props, ref) => (
  <AdinkraIcon ref={ref} filled fillRule="evenodd" {...props}>
    <path d="M6.99 1C4.71 1.51 2.84 4.39 2.1 8.53 1.69 10.79 1.69 13.56 2.09 15.88 2.64 18.99 3.9 21.56 5.49 22.74L5.83 23 7.57 23C9.57 23 9.34 23.04 9.88 22.59 10.36 22.19 10.85 21.62 11.28 20.94 11.52 20.55 12.1 19.41 12.1 19.32 12.1 19.29 12.12 19.26 12.14 19.26 12.16 19.26 12.18 19.29 12.18 19.32 12.18 19.4 12.75 20.53 12.98 20.9 13.5 21.75 14.16 22.47 14.79 22.89L14.95 23 16.7 23 18.45 23 18.69 22.82C19.06 22.54 19.47 22.16 19.73 21.84 22.28 18.72 23.2 12.6 21.91 7.31 21.53 5.79 20.94 4.36 20.22 3.27 18.07 0.05 15 0.19 12.93 3.62 12.71 3.99 12.18 5.06 12.18 5.14 12.18 5.16 12.16 5.19 12.14 5.19 12.12 5.19 12.1 5.17 12.1 5.15 12.1 5.07 11.6 4.06 11.39 3.71 10.53 2.27 9.47 1.33 8.38 1.04 8.05 0.95 7.31 0.93 6.99 1ZM8.38 2.97C9.21 3.2 10.27 4.46 10.68 5.68 10.92 6.41 10.91 6.41 9.64 6.45 8.7 6.47 8.57 6.5 8.33 6.67 7.75 7.1 8.17 8.19 9.69 10.17 10.39 11.1 10.63 11.47 10.73 11.81 10.92 12.41 10.71 12.97 9.94 13.95 8.4 15.92 7.87 16.99 8.17 17.49 8.33 17.75 8.79 17.82 9.64 17.72 10.86 17.57 10.94 17.62 10.66 18.48 10.26 19.69 9.3 21.04 8.59 21.39 7.3 22.02 5.81 20.81 5.26 18.69 5.01 17.72 4.96 16.41 5.13 15.71 5.33 14.92 5.75 14.27 6.55 13.54 7.45 12.7 7.58 12.53 7.58 12.23 7.58 11.96 7.49 11.85 6.68 11.05 5.66 10.05 5.38 9.62 5.13 8.73 5 8.27 5.01 6.93 5.13 6.29 5.61 3.93 6.94 2.57 8.38 2.97ZM16.96 2.99C18.28 3.43 19.23 5.35 19.23 7.61 19.24 9.12 18.87 9.88 17.56 11.08 16.87 11.72 16.73 11.89 16.71 12.16 16.68 12.51 16.8 12.68 17.62 13.43 18.8 14.5 19.26 15.45 19.26 16.8 19.26 18.99 18.29 20.98 17 21.45 16.27 21.71 15.73 21.56 15.07 20.9 14.42 20.25 13.77 19.12 13.54 18.22 13.38 17.63 13.49 17.58 14.62 17.72 15.93 17.87 16.32 17.66 16.15 16.87 16.04 16.39 15.33 15.21 14.6 14.29 13.7 13.18 13.45 12.67 13.48 12.1 13.52 11.66 13.67 11.38 14.46 10.36 16.22 8.07 16.6 6.96 15.77 6.56 15.59 6.48 15.52 6.47 14.66 6.45 13.57 6.42 13.5 6.4 13.48 6.15 13.44 5.52 14.46 3.87 15.23 3.32 15.84 2.88 16.33 2.79 16.96 2.99Z" />
  </AdinkraIcon>
)) as unknown as LucideIcon;
