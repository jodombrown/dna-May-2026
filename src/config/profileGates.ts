/**
 * Feature gates — formalised.
 *
 * Each gated feature declares:
 *  - `minPercent`: minimum profile completion percentage (0-100)
 *  - `fields`: profileCompletion field ids that must be filled in
 *  - `label` / `reason`: human copy for the gate notice
 *
 * Field ids MUST match those returned by `getProfileFieldChecks` in
 * `src/lib/profileCompletion.ts` so gate checks and the completion
 * scorer stay in lockstep.
 */

export interface FeatureGateSpec {
  label: string;
  minPercent: number;
  fields: readonly string[];
  reason: string;
}

export const FEATURE_GATES = {
  post_create: {
    label: 'Post to the feed',
    minPercent: 30,
    fields: ['avatar_url', 'full_name', 'headline'],
    reason: 'Add a photo, name, and headline so people know who they\'re hearing from.',
  },
  connection_request: {
    label: 'Send a connection request',
    minPercent: 30,
    fields: ['avatar_url', 'headline'],
    reason: 'A photo and headline make it clear why you\'re reaching out.',
  },
  messaging: {
    label: 'Direct messaging',
    minPercent: 40,
    fields: ['avatar_url', 'headline', 'skills'],
    reason: 'Fill out your basics before starting DMs.',
  },
  event_create: {
    label: 'Host an event',
    minPercent: 60,
    fields: ['avatar_url', 'headline', 'bio', 'current_country'],
    reason: 'Hosts need a complete profile so attendees know who\'s convening.',
  },
  project_create: {
    label: 'Start a Space',
    minPercent: 60,
    fields: ['avatar_url', 'headline', 'bio', 'skills', 'interests'],
    reason: 'Space leads need a full profile so collaborators can vet them.',
  },
  contribute_post: {
    label: 'Post a Need or Offer',
    minPercent: 50,
    fields: ['avatar_url', 'headline', 'bio'],
    reason: 'Contributions carry real value. Fill out your profile so others can trust the exchange.',
  },
  story_publish: {
    label: 'Publish a story',
    minPercent: 50,
    fields: ['avatar_url', 'full_name', 'headline', 'bio'],
    reason: 'Stories are attributed. Round out your profile before publishing.',
  },
} satisfies Record<string, FeatureGateSpec>;

export type FeatureKey = keyof typeof FEATURE_GATES;
