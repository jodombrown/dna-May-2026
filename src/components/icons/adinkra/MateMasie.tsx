import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdinkraIcon, AdinkraIconProps } from './AdinkraIcon';

/**
 * Mate Masie
 * Meaning: "What I hear, I keep" - wisdom, prudence, careful listening.
 * Tradition: Adinkra (Akan people, Ghana / Cote d'Ivoire).
 * DNA usage: DIA (Diaspora Intelligence Agent) identity. The agent listens,
 * remembers, and returns wisdom.
 *
 * Construction: an outward-opening spiral, ~1.75 rotations from center,
 * suggesting the curl of an ear and the act of holding sound. Distinct
 * from Adinkrahene (concentric circles) by being a single continuous curve.
 *
 * Source: Public-domain Adinkra symbol tradition. v1 geometric construction
 * by DNA team, to be replaced by commissioned work from an Adinkra-literate
 * African designer.
 * References: adinkrasymbols.org; Mafundikwa (2004) Afrikan Alphabets.
 */
export const MateMasie = forwardRef<SVGSVGElement, AdinkraIconProps>((props, ref) => (
  <AdinkraIcon ref={ref} {...props}>
    {/* Spiral approximated by chained cubic Beziers, opening counter-clockwise */}
    <path d="M12 12
             C 12 11, 13 11, 13 12
             C 13 13.5, 11 13.5, 11 12
             C 11 9.5, 14.5 9.5, 14.5 12
             C 14.5 15.5, 9.5 15.5, 9.5 12
             C 9.5 7.5, 16 7.5, 16 12
             C 16 17.5, 8 17.5, 8 12
             C 8 5.5, 17.5 5.5, 17.5 12
             C 17.5 19.5, 6.5 19.5, 6.5 12
             C 6.5 4, 19 3.5, 20 11" />
  </AdinkraIcon>
)) as unknown as LucideIcon;