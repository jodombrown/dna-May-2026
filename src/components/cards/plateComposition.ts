/**
 * plateComposition — deterministic recipe for the imageless EventPlate (BD191).
 *
 * A plate is composed on three axes from a single seed, `event.id`:
 *   1. field  — the colour ground (curated preset, never a continuous range)
 *   2. mark   — the Adinkra symbol, chosen by event_type (BD113: never by title)
 *   3. crop   — how the mark is placed: scale, offset, rotation and opacity
 *              (curated preset). The mark is deliberately constant across every
 *              event_type, so crop — not the symbol — is what makes one plate
 *              read differently from the next.
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

/**
 * A crop — how the single, constant mark is placed on the plate. This is the
 * differentiation axis (BD191): the symbol never changes, so scale + offset +
 * rotation + opacity are what stop a rail reading as one repeated tile.
 *
 * The mark renders in an absolutely positioned layer that the plate root clips
 * with `overflow-hidden`; a wide `scale` and an off-edge `x`/`y` therefore crop
 * the mark against the plate's edge rather than shrinking it into a corner.
 */
export interface PlateCrop {
  /** Mark width as a share of plate width. 0–1. */
  scale: number;
  /** Horizontal offset as a share of plate width. May be negative to crop off the left edge. */
  x: number;
  /** Vertical offset as a share of plate height. May be negative to crop off the top edge. */
  y: number;
  /** Rotation in degrees. */
  rotation: number;
  /**
   * Layer opacity, capped at 0.20 (BD191). Applied to the wrapper, not the
   * mark, so it resolves the deep-field loudness on both light and deep grounds
   * without a separate rule.
   */
  opacity: number;
}

/**
 * Six composed placements, tuned against a 16:9 band. Curated presets — no
 * continuous ranges, no interpolation (BD191 rule 2). The spread is deliberately
 * wide (scale 0.40–0.92, opacity 0.09–0.20, both edges of the plate used) so
 * eight fields × six crops read as forty-eight distinct plates, not eight.
 */
export const PLATE_CROPS: readonly PlateCrop[] = [
  { scale: 0.62, x: 0.58, y: -0.30, rotation: -8, opacity: 0.14 },
  { scale: 0.52, x: 0.52, y: 0.40, rotation: 12, opacity: 0.15 },
  { scale: 0.78, x: 0.62, y: 0.30, rotation: 20, opacity: 0.11 },
  { scale: 0.44, x: 0.68, y: 0.10, rotation: -14, opacity: 0.17 },
  { scale: 0.92, x: -0.22, y: 0.34, rotation: 6, opacity: 0.09 },
  { scale: 0.40, x: 0.72, y: -0.06, rotation: 0, opacity: 0.20 },
];

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

/**
 * MurmurHash3 fmix32 — avalanche finalizer.
 *
 * FNV-1a multiplies by an odd prime, which preserves the low bit, so hashes of
 * suffixed variants of one seed share their low bits (BD211). With both array
 * lengths even, that locked parity(field) to parity(crop) and killed half the
 * composition space. This finalizer decorrelates the low bits so every axis
 * derived from the same seed is independent — including any added later.
 *
 * `Math.imul` and `>>> 0` at every step are load-bearing: they keep the mix in
 * true unsigned 32-bit arithmetic. Do not simplify them away.
 */
function fmix32(h: number): number {
  h = (h ^ (h >>> 16)) >>> 0;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h;
}

/**
 * Index into a curated axis from a seed, salted per axis and avalanched before
 * the modulo. The finalizer is what makes the two axes independent: without it,
 * FNV-1a's preserved low bit ties parity(field) to parity(crop) and only 24 of
 * the 48 field × crop pairs are reachable (BD211). One code path serves both
 * axes, so any axis added later inherits the same decorrelation.
 */
function seededIndex(seed: string, salt: string, len: number): number {
  return fmix32(fnv1a(`${seed}:${salt}`)) % len;
}

export interface PlateComposition {
  field: PlateField;
  mark: MarkComponent;
  crop: PlateCrop;
}

/**
 * The full recipe for one event. Field and crop take independent slices of the
 * seed (re-hashed with a per-axis salt, then avalanched) so they don't move in
 * lockstep. Given the same id and event_type, the result is byte-for-byte
 * identical, always.
 */
export function composePlate(
  id: string,
  eventType?: string | null,
): PlateComposition {
  const seed = id ?? '';
  const field = PLATE_FIELDS[seededIndex(seed, 'field', PLATE_FIELDS.length)];
  const crop = PLATE_CROPS[seededIndex(seed, 'crop', PLATE_CROPS.length)];
  return { field, mark: markForEventType(eventType), crop };
}
