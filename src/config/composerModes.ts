/**
 * DNA | FEED + COMPOSER - Mode Configuration
 * 
 * Controls which composer modes are visible and enabled.
 * Only production-ready, fully-tested modes should be enabled.
 */

import { ComposerMode } from '@/hooks/useUniversalComposer';

export interface ComposerModeConfig {
  id: ComposerMode;
  enabled: boolean;
  tested: boolean;
  optimisticFeedInjection: boolean;
  notes?: string;
}

/**
 * TRUST-FIRST MODE CONFIGURATION
 * 
 * A mode is only enabled if:
 * 1. It has been manually tested in all contexts
 * 2. It has optimistic feed injection implemented
 * 3. Posts appear immediately in: All, My Posts, Profile Activity, Context Activity
 */
export const COMPOSER_MODE_CONFIG: Record<ComposerMode, ComposerModeConfig> = {
  post: {
    id: 'post',
    enabled: true,
    tested: true,
    optimisticFeedInjection: true,
    notes: 'Fully working - creates posts via createStandardPost, optimistic injection complete',
  },
  story: {
    id: 'story',
    enabled: true,
    tested: true,
    optimisticFeedInjection: true,
    notes: 'Story Engine v1.2 – QA Complete. Fully tested end-to-end: creation, feed injection (All/Network/Mine/Saved/Profile), detail page, routing consistency, error handling, auth guards. Trust-First guarantees met.',
  },
  event: {
    id: 'event',
    enabled: true,
    tested: true,
    optimisticFeedInjection: true,
    notes: 'Event creation via create-event edge function. Creates event and post atomically.',
  },
  need: {
    id: 'need',
    enabled: true,
    tested: true,
    optimisticFeedInjection: true,
    notes: 'Opportunity mode (Need/Offer) - creates contribution needs with four currencies',
  },
  space: {
    id: 'space',
    enabled: false,
    tested: true,
    optimisticFeedInjection: true,
    notes: 'Disabled: collaboration_spaces table retired; composer space creation is out of scope (canonical creation lives under /dna/collaborate, Arc 4). submitSpace throws until re-enabled.',
  },
  community: {
    id: 'community',
    enabled: false,
    tested: false,
    optimisticFeedInjection: false,
    notes: 'TODO: Community post creation does not return post data for optimistic injection',
  },
};

/**
 * Get all enabled modes for display in the composer
 */
export function getEnabledModes(): ComposerMode[] {
  return Object.values(COMPOSER_MODE_CONFIG)
    .filter((config) => config.enabled)
    .map((config) => config.id);
}

/**
 * Check if a specific mode is enabled
 */
export function isModeEnabled(mode: ComposerMode): boolean {
  return COMPOSER_MODE_CONFIG[mode]?.enabled ?? false;
}

/**
 * Get configuration for a specific mode
 */
export function getModeConfig(mode: ComposerMode): ComposerModeConfig | undefined {
  return COMPOSER_MODE_CONFIG[mode];
}
