/**
 * Module visual tokens for the right rail.
 * Maps a Five C's module to its HSL token, label, icon, and route.
 */
import { Users, Calendar, Layers, Gift, Megaphone } from 'lucide-react';
import type { CModule } from '@/types/right-rail';

export interface ModuleVisual {
  label: string;
  short: string;
  hsl: string; // raw HSL triplet for inline color()
  route: string;
  Icon: typeof Users;
}

export const MODULE_VISUALS: Record<CModule, ModuleVisual> = {
  connect: { label: 'Connect', short: 'CN', hsl: 'var(--dna-emerald)', route: '/dna/connect', Icon: Users },
  convene: { label: 'Convene', short: 'CV', hsl: 'var(--dna-gold)', route: '/dna/convene', Icon: Calendar },
  collaborate: { label: 'Collaborate', short: 'CL', hsl: 'var(--dna-forest)', route: '/dna/collaborate', Icon: Layers },
  contribute: { label: 'Contribute', short: 'CT', hsl: 'var(--dna-copper)', route: '/dna/contribute', Icon: Gift },
  convey: { label: 'Convey', short: 'CY', hsl: 'var(--module-convey)', route: '/dna/convey', Icon: Megaphone },
};

export const MODULE_ORDER: CModule[] = ['connect', 'convene', 'collaborate', 'contribute', 'convey'];
