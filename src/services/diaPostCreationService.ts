/**
 * DNA Post Composer — DIA Post-Creation Suggestion Service
 *
 * Sprint 3B: Provides contextual next-action suggestions after the user
 * publishes content. Each mode gets a tailored suggestion that bridges
 * the user to the next meaningful action in the diaspora movement.
 *
 * For alpha: Suggestions are static/template-based per mode.
 * Future: DIA will personalize based on user history and network analysis.
 */

import type { ComposerMode } from '@/hooks/useUniversalComposer';

export interface PostCreationSuggestion {
  headline: string;
  body: string;
  actionLabel: string;
  actionType: 'navigate' | 'open_composer' | 'share' | 'invite';
  actionPayload: Record<string, string>;
  dismissLabel: string;
}

const SUGGESTION_TEMPLATES: Record<
  ComposerMode,
  (createdId: string) => PostCreationSuggestion
> = {
  event: (createdId) => ({
    headline: 'Get the word out',
    body: 'Invite your connections to attend this event.',
    actionLabel: 'Invite Connections',
    actionType: 'navigate',
    actionPayload: { route: `/dna/convene/events/${createdId}` },
    dismissLabel: 'Maybe later',
  }),
  space: (createdId) => ({
    headline: 'Build your team',
    body: 'Add members who have the skills your space needs.',
    actionLabel: 'Add Members',
    actionType: 'navigate',
    actionPayload: { route: `/dna/collaborate/spaces/${createdId}` },
    dismissLabel: "I'll do this later",
  }),
  need: (createdId) => ({
    headline: 'Spread the word',
    body: 'Share this opportunity with your network to find the right match.',
    actionLabel: 'Share with Network',
    actionType: 'share',
    actionPayload: { contentId: createdId, contentType: 'opportunity' },
    dismissLabel: 'Not now',
  }),
  story: (createdId) => ({
    headline: 'Your voice matters',
    body: 'Stories that get shared in the first hour reach 3x more people.',
    actionLabel: 'Share to Feed',
    actionType: 'share',
    actionPayload: { contentId: createdId, contentType: 'story' },
    dismissLabel: 'Let it grow organically',
  }),
  connect: () => ({
    headline: 'Keep the momentum',
    body: 'Your network is most engaged when you show up consistently.',
    actionLabel: 'View in Feed',
    actionType: 'navigate',
    actionPayload: { route: '/dna/feed' },
    dismissLabel: 'Done',
  }),
};

/**
 * Get the DIA post-creation suggestion for a given mode and created content ID.
 */
export function getPostCreationSuggestion(
  mode: ComposerMode,
  createdId: string
): PostCreationSuggestion {
  const templateFn = SUGGESTION_TEMPLATES[mode];
  return templateFn(createdId);
}

/**
 * Success headlines per mode — displayed at the top of the success screen.
 */
export const SUCCESS_HEADLINES: Record<ComposerMode, string> = {
  connect: 'Your connection is live!',
  story: 'Your story is published!',
  event: 'Your event is live!',
  space: 'Your space is launched!',
  need: 'Your opportunity is posted!',
};
