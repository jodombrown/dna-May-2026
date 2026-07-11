/**
 * Composer Modes — the five verbs (BD075)
 *
 * Every post resolves to one of the five C's. There is no generic "Post"
 * bucket: plain text with no verb chosen resolves to CONVEY (BD075), because a
 * thought shared with the diaspora is a story, however short.
 *
 * Verb labels are the customer-facing surface (Marketing Voice). The C-name and
 * C-color ride along as secondary identity.
 *
 * Colors are the BD083 locked palette. Do not hardcode hexes at call sites —
 * use the bevel-* tokens so a palette change moves every surface at once.
 */

export type ComposerMode = 'connect' | 'event' | 'space' | 'need' | 'story';

export type CName = 'Connect' | 'Convene' | 'Collaborate' | 'Contribute' | 'Convey';

export interface ComposerModeConfig {
  /** The verb. What the member is doing. */
  label: string;
  /** The C this verb belongs to — secondary identity. */
  cName: CName;
  /** Tailwind token from the BD083 palette. */
  bevelToken: string;
  /** Placeholder in the body field. */
  placeholder: string;
  enabled: boolean;
}

export const COMPOSER_MODE_CONFIG: Record<ComposerMode, ComposerModeConfig> = {
  connect: {
    label: 'Make a Connection',
    cName: 'Connect',
    bevelToken: 'bevel-connect',
    placeholder: 'Who are you looking for, or what are you offering?',
    enabled: true,
  },
  event: {
    label: 'Host an Event',
    cName: 'Convene',
    bevelToken: 'bevel-event',
    placeholder: 'Bring the diaspora together. What are you hosting?',
    enabled: true,
  },
  space: {
    label: 'Start a Collaboration',
    cName: 'Collaborate',
    bevelToken: 'bevel-space',
    placeholder: 'What are you building, and who do you need?',
    enabled: true,
    // SPACE COMPOSES INLINE (reversal of BD087). On submit, the composer
    // calls the same Spaces substrate service the /dna/collaborate flow
    // uses — the member never leaves the composer.
  },
  need: {
    label: 'Offer or Ask',
    cName: 'Contribute',
    bevelToken: 'bevel-opportunity',
    placeholder: 'What can you give, or what do you need?',
    enabled: true,
  },
  story: {
    label: 'Tell a Story',
    cName: 'Convey',
    bevelToken: 'bevel-story',
    placeholder: "What's on your mind?",
    enabled: true,
  },
};

/**
 * The DIA-inferred default (BD075/BD085).
 *
 * The composer opens on the verb DIA infers from context. When nothing is
 * inferable — an empty composer, an ambiguous opening line — it resolves to
 * CONVEY. Convey is the fallback, not a generic bucket: it is a real verb with
 * a real card.
 */
export const DEFAULT_MODE: ComposerMode = 'story';

/** Display order. Natural order of the Five C's. */
export const MODE_ORDER: ComposerMode[] = ['connect', 'event', 'space', 'need', 'story'];

export const modeConfig = (m: ComposerMode): ComposerModeConfig => COMPOSER_MODE_CONFIG[m];
