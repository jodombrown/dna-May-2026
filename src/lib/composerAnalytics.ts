/**
 * Composer analytics dispatcher.
 *
 * Lightweight wrapper that funnels composer telemetry through the central
 * logger today and is the single seam to swap in a real analytics SDK later.
 * Zero `any` — every event is a tagged union.
 */

import { logger } from '@/lib/logger';
import type { ComposerMode } from '@/hooks/useUniversalComposer';

export type DiscardSource = 'toast' | 'indicator_menu' | 'header_menu';

export type ComposerAnalyticsEvent =
  | { type: 'composer_draft_restored'; mode: ComposerMode; age_minutes: number }
  | { type: 'composer_draft_discard_prompted'; mode: ComposerMode; source: DiscardSource }
  | { type: 'composer_draft_discarded'; mode: ComposerMode; age_minutes: number; source: DiscardSource }
  | { type: 'composer_draft_discard_cancelled'; mode: ComposerMode; source: DiscardSource }
  | { type: 'composer_published_with_draft'; mode: ComposerMode; draft_age_minutes: number }
  | { type: 'composer_draft_save_failed'; mode: ComposerMode; reason: 'quota' | 'unavailable' | 'unknown' };

export function trackComposerEvent(event: ComposerAnalyticsEvent): void {
  logger.info('ComposerAnalytics', event.type, event);
}

export function ageMinutes(savedAt: number): number {
  return Math.max(0, Math.round((Date.now() - savedAt) / 60000));
}
