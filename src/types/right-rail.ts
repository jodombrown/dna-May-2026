/**
 * DNA Right Rail — shared types for the redesigned components.
 *
 * Components covered:
 *   1. Five C's Pulse Compass
 *   2. DIA Daily Brief
 *   3. Trending in DNA
 *   4. Ask DIA persistent CTA
 *
 * Companion data layer migration:
 *   supabase/migrations/20260508000000_dna_right_rail_data_layer.sql
 */

export type CModule =
  | 'connect'
  | 'convene'
  | 'collaborate'
  | 'contribute'
  | 'convey';

export type PulseTimeRange = '24h' | '7d' | '30d';
export type PulseScope = 'platform' | 'user';

export interface PulseSlice {
  c_module: CModule;
  event_count: number;
  unique_users: number;
  delta_vs_prior_period: number;
}

export interface PulseBreakdownItem {
  event_type: string;
  event_count: number;
  display_label: string;
}

export type BriefSignalType =
  | 'opportunity_match'
  | 'sector_aligned_returnees'
  | 'event_with_network_attendance'
  | 'space_match'
  | 'followed_trend_active'
  | 'profile_completion'
  | 'network_growth'
  | 'evergreen_events';

export interface DiaBriefCard {
  id: string;
  position: 1 | 2 | 3;
  c_module: CModule;
  signal_type: BriefSignalType;
  title: string;
  body: string;
  cta_label: string;
  cta_route: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
  reasoning: string;
  is_fallback: boolean;
}

export type BriefInteractionType =
  | 'viewed'
  | 'clicked'
  | 'dismissed'
  | 'not_interested'
  | 'saved'
  | 'why_this_opened';

export interface TrendingHashtag {
  hashtag: string;
  post_count: number;
  unique_authors: number;
  is_followed: boolean;
}

export interface PulseBroadcast {
  c_module: CModule;
  event_type: string;
  user_id: string;
  timestamp: string;
}

export interface BriefBroadcast {
  action: 'refresh' | 'new_card';
  card_id?: string;
}
