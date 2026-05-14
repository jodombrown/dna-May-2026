/**
 * CONTRIBUTE Phase 1 analytics dispatcher.
 *
 * Thin wrapper that funnels manifest telemetry through the central logger
 * and is the single seam to swap in a real analytics SDK later.
 */

import { logger } from '@/lib/logger';
import type { ContributionCurrency } from '@/types/contribute';

export type ContributeAnalyticsEvent =
  | { type: 'manifest_editor_opened'; has_existing_manifest: boolean }
  | { type: 'manifest_headline_drafted_by_dia'; accepted: boolean }
  | { type: 'stance_created'; currency: ContributionCurrency }
  | { type: 'stance_updated'; stance_id: string; currency: ContributionCurrency }
  | { type: 'stance_archived'; stance_id: string; currency: ContributionCurrency }
  | { type: 'manifest_published'; stance_count: number; currencies: ContributionCurrency[] }
  | { type: 'manifest_unpublished'; stance_count: number }
  | { type: 'capital_coming_soon_viewed'; surface: 'editor' | 'renderer' }
  | { type: 'need_composer_opened'; mode: 'create' | 'edit' }
  | { type: 'need_created'; currency: ContributionCurrency }
  | { type: 'need_published'; currency: ContributionCurrency }
  | { type: 'need_closed'; need_id: string }
  | { type: 'need_deleted'; need_id: string }
  | { type: 'need_cap_warning_shown'; active_count: number }
  | { type: 'need_cap_blocked'; active_count: number }
  // Phase 3: The Room
  | {
      type: 'room_hub_opened';
      readiness_state: 'no_manifest' | 'unpublished_manifest' | 'no_stances' | 'curating' | 'ready';
      curation_count: number;
      mutual_count: number;
      stance_match_count: number;
      need_match_count: number;
    }
  | {
      type: 'room_empty_state_shown';
      state: 'no_manifest' | 'unpublished_manifest' | 'no_stances' | 'curating';
    }
  | {
      type: 'recognition_card_opened';
      curation_id: string;
      kind: import('@/types/contribute').MatchKind;
      currency: ContributionCurrency;
      score: number;
      reasoning_source: import('@/types/contribute').ReasoningSource;
    }
  | {
      type: 'matched_need_card_opened';
      curation_id: string;
      currency: ContributionCurrency;
      score: number;
      reasoning_source: import('@/types/contribute').ReasoningSource;
    }
  | {
      type: 'curation_reach_out_clicked';
      curation_id: string;
      kind: import('@/types/contribute').MatchKind;
      currency: ContributionCurrency;
      reasoning_source: import('@/types/contribute').ReasoningSource;
    }
  | {
      type: 'curation_offer_help_clicked';
      curation_id: string;
      currency: ContributionCurrency;
      reasoning_source: import('@/types/contribute').ReasoningSource;
    }
  | {
      type: 'curation_dismissed';
      curation_id: string;
      kind: import('@/types/contribute').MatchKind;
      currency: ContributionCurrency;
      source: 'card' | 'drawer';
    }
  | {
      type: 'room_curation_triggered';
      trigger: 'auto_first_visit_today';
      curation_count: number;
    };

export function trackContributeEvent(event: ContributeAnalyticsEvent): void {
  logger.info('ContributeAnalytics', event.type, event);
}
