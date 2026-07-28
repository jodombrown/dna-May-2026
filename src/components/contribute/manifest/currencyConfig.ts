import { BookOpen, Users, Package, Coins, type LucideIcon } from 'lucide-react';
import type {
  ContributionCurrency,
  StanceAvailability,
  StanceVisibility,
} from '@/types/contribute';

export interface CurrencyVisual {
  key: ContributionCurrency;
  label: string;
  /** Token color used for the 4px left bar, icons, and other non-text graphical elements. */
  barHex: string;
  /** Token color used wherever the currency name renders as text. AA-compliant on white. */
  labelHex: string;
  icon: LucideIcon;
  placeholderTitle: string;
  shortBlurb: string;
  authorable: boolean;
}

/**
 * Single source of truth for currency presentation. Colors resolve from the
 * DNA design tokens at runtime (rendered as inline style on a 4px bar / icon)
 * so each currency reads with equal visual weight and stays themeable.
 *
 * `barHex` vs `labelHex`: the bar is graphical (no contrast minimum), while
 * label text must clear WCAG AA (4.5:1) on the cream ground. Emerald is
 * 3.8:1 there, so Expertise labels use Forest instead.
 */
export const CURRENCY_VISUALS: Record<ContributionCurrency, CurrencyVisual> = {
  expertise: {
    key: 'expertise',
    label: 'Expertise',
    barHex: 'hsl(var(--dna-emerald))',
    labelHex: 'hsl(var(--dna-forest))', // Darker for AA contrast
    icon: BookOpen,
    placeholderTitle: 'e.g., FDA regulatory strategy for biotech',
    shortBlurb: 'Knowledge depth you offer to others.',
    authorable: true,
  },
  network: {
    key: 'network',
    label: 'Network',
    barHex: 'hsl(var(--dna-forest))',
    labelHex: 'hsl(var(--dna-forest))',
    icon: Users,
    placeholderTitle: 'e.g., Warm intros to East African agritech investors',
    shortBlurb: 'Doors you can open.',
    authorable: true,
  },
  resources: {
    key: 'resources',
    label: 'Resources',
    barHex: 'hsl(var(--dna-copper))',
    labelHex: 'hsl(var(--dna-copper))',
    icon: Package,
    placeholderTitle: 'e.g., Office space in Accra for visiting founders',
    shortBlurb: 'Tangible things you can share.',
    authorable: true,
  },
  capital: {
    key: 'capital',
    label: 'Capital',
    barHex: 'hsl(var(--dna-gold-dark))',
    labelHex: 'hsl(var(--dna-gold-dark))',
    icon: Coins,
    placeholderTitle: '',
    shortBlurb: 'Coming after the trust ladder is built.',
    authorable: false,
  },
};

export const AVAILABILITY_LABELS: Record<StanceAvailability, { short: string; helper: string }> = {
  open_ongoing: {
    short: 'Open ongoing',
    helper: 'Always available, reach out anytime.',
  },
  monthly_hours: {
    short: 'A few hours per month',
    helper: 'Light, recurring availability.',
  },
  quarterly: {
    short: 'A few times per quarter',
    helper: 'Cadenced, not constant.',
  },
  project_based: {
    short: 'Project-based',
    helper: 'Open to specific projects with a clear scope.',
  },
  limited_capacity: {
    short: 'Limited capacity right now',
    helper: 'At capacity, only light availability.',
  },
};

export const VISIBILITY_LABELS: Record<StanceVisibility, { short: string; helper: string }> = {
  public: {
    short: 'Public',
    helper: 'Visible to everyone on DNA.',
  },
  connections_only: {
    short: 'Connections only',
    helper: 'Visible only to your accepted connections.',
  },
  private: {
    short: 'Private',
    helper: 'Only you can see this stance.',
  },
};
