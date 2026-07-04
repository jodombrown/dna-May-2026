/**
 * affirmation-ceremony.content
 * register: INTERNAL VOICE
 *
 * The substance of the Affirmation declaration (D031). This is the only place
 * in the Affirmation flow where the internal / mythic register is permitted
 * (BD062 / BD021). All chrome copy lives in affirmation-chrome.content.
 *
 * PLACEHOLDER - canonical Sacred Utterance pending, founder-drafted.
 * The lines below carry the agreed D031 substance as a clearly-marked
 * structural placeholder so the ceremony can render and the flow can be
 * built and certified. Swap the strings — not the shape — when the founder
 * hands down the canonical text.
 */

/** Roles that may affirm. `exploring` is excluded by the DB CHECK on role_at_affirm. */
export type AffirmRole = 'returnee' | 'anchor' | 'ally';

export interface CeremonySection {
  heading: string;
  lines: string[];
}

export interface CeremonyDeclaration {
  /** Commitment shared by every affirming role. */
  core: CeremonySection;
  /** The role-specific extension to the shared commitment. */
  extension: CeremonySection;
}

export const affirmationCeremonyContent = {
  register: 'INTERNAL VOICE' as const,

  // Shared core — commitment to The Return, in partnership with the body.
  // PLACEHOLDER - canonical Sacred Utterance pending, founder-drafted.
  core: {
    heading: 'The Affirmation',
    lines: [
      'I affirm The Return.',
      'I commit to the movement of the African world toward its own becoming,',
      'and I make this commitment in partnership with the body — never apart from it.',
    ],
  } satisfies CeremonySection,

  // Role extensions — PLACEHOLDER, canonical Sacred Utterance pending, founder-drafted.
  roleExtensions: {
    returnee: {
      heading: 'As a Returnee',
      lines: [
        "I take my place in Africa's progress from the diaspora,",
        'on whatever Pathway I claim,',
        'and I hold that Pathway as mine to walk.',
      ],
    },
    anchor: {
      heading: 'As an Anchor',
      lines: [
        "I hold ground for Africa's transformation from inside the continent,",
        'so that those who return find the work already living.',
      ],
    },
    ally: {
      heading: 'As an Ally',
      lines: [
        'I bring what I carry in support of the body’s work,',
        'in service of the body’s direction,',
        'and never in place of it.',
      ],
    },
  } satisfies Record<AffirmRole, CeremonySection>,
};

/** Assemble the full declaration (shared core + role extension) for a role. */
export const getCeremonyDeclaration = (role: AffirmRole): CeremonyDeclaration => ({
  core: affirmationCeremonyContent.core,
  extension: affirmationCeremonyContent.roleExtensions[role],
});
