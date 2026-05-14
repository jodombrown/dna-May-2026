import { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AdinkraIcon, AdinkraIconProps } from './AdinkraIcon';

/**
 * Mpatapo - "knot of pacification / reconciliation."
 * Tradition: Adinkra (Akan people, Ghana / Cote d'Ivoire).
 * DNA usage: CONVEY module identity. Stories convey reconciliation, shared meaning,
 * and the binding together of voices. Distinct from MateMasie (DIA) so the two
 * never read as the same symbol when rendered side-by-side.
 *
 * Construction (v4): a stylized two-strand knot drawn as two interlocking
 * rounded squares rotated 45deg. Even-odd fill so the over/under reads cleanly.
 * Single continuous outline keeps it legible at 12px through 64px.
 */
export const Mpatapo = forwardRef<SVGSVGElement, AdinkraIconProps>((props, ref) => (
  <AdinkraIcon ref={ref} fillRule="evenodd" {...props}>
    {/* Outer interlocking knot - two rotated rounded rectangles */}
    <path
      d="M12 2.5 L19.5 10 L12 17.5 L4.5 10 Z M12 6.5 L16 10 L12 13.5 L8 10 Z"
      strokeLinejoin="round"
    />
    <path
      d="M12 6.5 L21.5 12 L12 21.5 L2.5 12 Z M12 10.5 L18 12 L12 17.5 L6 12 Z"
      strokeLinejoin="round"
    />
  </AdinkraIcon>
)) as unknown as LucideIcon;
