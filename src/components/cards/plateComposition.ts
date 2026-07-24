/**
 * plateComposition — deterministic recipe for the imageless EventPlate (BD191).
 *
 * A plate is composed on three axes from a single seed, `event.id`:
 *   1. field  — the colour ground (curated preset, never a continuous range)
 *   2. mark   — the Adinkra symbol, chosen by event_type (BD113: never by title)
 *   3. size   — the mark's scale (curated preset)
 *
 * Rule 1 (BD191): deterministic, never random. The seed runs through a stable
 * FNV-1a hash. There is no Math.random() in this file, by design — the same
 * event must render the same plate on every render, on every device, forever.
 *
 * Rule 2 (BD191): curated presets, not free combinatorics. Every axis indexes
 * a fixed array. No interpolation, no continuous ranges.
 *
 * Every colour is a semantic token already in the system (see index.css). This
 * file adds no tokens — that is the design-system lane's surface. Values are
 * written as `hsl(var(--token))` strings so the design-system gate passes.
 */

import type { ComponentType } from 'react';
import type { Database } from '@/integrations/supabase/types';
import {
  Nkonsonkonson,
  type AdinkraIconProps,
} from '@/components/icons/adinkra';

type EventType = Database['public']['Enums']['event_type'];

/** The subset of the Adinkra props a plate is allowed to drive (BD: never `filled`, never `title`). */
export type MarkComponent = ComponentType<
  Pick<AdinkraIconProps, 'size' | 'color' | 'className'>
>;

/**
 * A colour ground. Two token stops make the gradient; `accent` colours the
 * mark and the 28px rule; `foreground` colours the serif lockup. `deep` marks
 * the dark grounds that stop a rail reading washed out — roughly a third of
 * the set is deep (BD191).
 */
export interface PlateField {
  from: string;
  to: string;
  accent: string;
  foreground: string;
  deep: boolean;
}

const LIGHT_FG = 'hsl(var(--foreground))';
const DEEP_FG = 'hsl(var(--dna-cream))';

/**
 * Eight grounds: five light, three deep (3/8 ≈ a third, per BD191). Light
 * grounds wash a module tint toward a warm neutral; deep grounds run a module
 * colour into its own dark. All stops are named tokens — nothing invented.
 */
export const PLATE_FIELDS: readonly PlateField[] = [
  // ── light ──────────────────────────────────────────────
  {
    from: 'hsl(var(--module-convene-light))',
    to: 'hsl(var(--dna-sand))',
    accent: 'hsl(var(--module-convene))',
    foreground: LIGHT_FG,
    deep: false,
  },
  {
    from: 'hsl(var(--dna-emerald-subtle))',
    to: 'hsl(var(--dna-stone))',
    accent: 'hsl(var(--module-collaborate))',
    foreground: LIGHT_FG,
    deep: false,
  },
  {
    from: 'hsl(var(--module-contribute-light))',
    to: 'hsl(var(--dna-sand))',
    accent: 'hsl(var(--module-contribute-dark))',
    foreground: LIGHT_FG,
    deep: false,
  },
  {
    from: 'hsl(var(--module-convey-light))',
    to: 'hsl(var(--dna-stone))',
    accent: 'hsl(var(--module-convey))',
    foreground: LIGHT_FG,
    deep: false,
  },
  {
    from: 'hsl(var(--module-collaborate-light))',
    to: 'hsl(var(--dna-sand))',
    accent: 'hsl(var(--module-collaborate))',
    foreground: LIGHT_FG,
    deep: false,
  },
  // ── deep ───────────────────────────────────────────────
  {
    from: 'hsl(var(--module-collaborate))',
    to: 'hsl(var(--module-collaborate-dark))',
    accent: DEEP_FG,
    foreground: DEEP_FG,
    deep: true,
  },
  {
    from: 'hsl(var(--module-convey))',
    to: 'hsl(var(--module-convey-dark))',
    accent: DEEP_FG,
    foreground: DEEP_FG,
    deep: true,
  },
  {
    from: 'hsl(var(--module-contribute-dark))',
    to: 'hsl(var(--dna-black))',
    accent: DEEP_FG,
    foreground: DEEP_FG,
    deep: true,
  },
];

/** Mark sizes in px. A curated set — variety across a rail without randomness. */
export const MARK_SIZES = [56, 64, 72] as const;

/**
 * event_type → mark. Every live enum value maps to Nkonsonkonson (CONVENE):
 * gatherings link people. The enum carries no cultural vocabulary yet and only
 * a few values are in use, so a per-type map would be unreachable branches.
 * The Record is exhaustive against the enum, so enriching the taxonomy later is
 * a compile-checked, one-line change — and never a title-keyword guess (BD113).
 */
const MARK_BY_EVENT_TYPE: Record<EventType, MarkComponent> = {
  conference: Nkonsonkonson,
  workshop: Nkonsonkonson,
  meetup: Nkonsonkonson,
  webinar: Nkonsonkonson,
  networking: Nkonsonkonson,
  social: Nkonsonkonson,
  other: Nkonsonkonson,
};

/** The mark for an event_type. Unknown or absent falls back to Nkonsonkonson. */
export function markForEventType(eventType?: string | null): MarkComponent {
  if (eventType && eventType in MARK_BY_EVENT_TYPE) {
    return MARK_BY_EVENT_TYPE[eventType as EventType];
  }
  return Nkonsonkonson;
}

/**
 * FNV-1a, 32-bit. Stable across engines: integer ops only, no locale, no host
 * state. `>>> 0` keeps the accumulator an unsigned 32-bit int at every step.
 */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // hash * 16777619, kept in 32-bit range without BigInt.
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export interface PlateComposition {
  field: PlateField;
  mark: MarkComponent;
  markSize: number;
}

/**
 * The full recipe for one event. Field and size take independent slices of the
 * seed (re-hashed with an axis salt) so they don't move in lockstep. Given the
 * same id and event_type, the result is byte-for-byte identical, always.
 */
export function composePlate(
  id: string,
  eventType?: string | null,
): PlateComposition {
  const seed = id ?? '';
  const field = PLATE_FIELDS[fnv1a(`${seed}:field`) % PLATE_FIELDS.length];
  const markSize = MARK_SIZES[fnv1a(`${seed}:size`) % MARK_SIZES.length];
  return { field, mark: markForEventType(eventType), markSize };
}
