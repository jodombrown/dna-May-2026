/**
 * DNA Profile v2 Types
 * Type definitions for the Diaspora Impact Dashboard
 */

import type { Database } from '@/integrations/supabase/types';

export type VerificationStatus = 'pending_verification' | 'soft_verified' | 'fully_verified';

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined';

export interface ProfileV2Bundle {
  profile: ProfileV2Data;
  tags: ProfileV2Tags;
  activity: ProfileV2Activity;
  permissions: ProfileV2Permissions;
  visibility: ProfileV2Visibility;
  completion: ProfileV2Completion;
  verification_meta: ProfileV2VerificationMeta;
  connection_status?: ConnectionStatus;
  /** Set when the bundle was built from get_public_profile for an anonymous viewer. */
  should_show_public_landing?: boolean;
}

export interface ProfileV2Data {
  id: string;
  user_id?: string; // legacy alias
  username: string;
  full_name: string;
  display_name?: string | null;
  first_name?: string;
  last_name?: string;
  pronouns?: string | null;
  website_url?: string | null;
  headline: string | null;
  professional_role: string | null;
  company: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  banner_type?: 'gradient' | 'solid' | 'image';
  banner_gradient?: string;
  banner_overlay?: boolean;
  current_country: string | null;
  current_city?: string | null;
  location: string | null;
  /** Primary origin country, ISO code, sourced from member_heritage (BD038). */
  primary_origin_country: string | null;
  
  bio: string | null;
  profession: string | null;
  industry: string | null;
  years_experience: number | null;
  languages?: string[] | null;
  verification_status: VerificationStatus;
  verification_updated_at?: string | null;
  created_at?: string;
  // Identity model (D054): role is the canonical identity field
  role?: Database["public"]["Enums"]["dna_identity_role"] | null;
  // Diaspora connection fields
  ethnic_heritage?: string[] | null;
  african_causes?: string[] | null;
  engagement_intentions?: string[] | null;
  return_intentions?: string | null;
  africa_visit_frequency?: string | null;
  diaspora_networks?: string[] | null;
  mentorship_areas?: string[] | null;
}

export interface ProfileV2Tags {
  // Primary array fields (used by profile view components)
  skills?: string[];
  interests?: string[];
  impact_areas?: string[];
  available_for?: string[];
  // Additional discovery tags
  focus_areas?: string[];
  regional_expertise?: string[];
  industries?: string[];
  professional_sectors?: string[];
  mentorship_areas?: string[];
  diaspora_networks?: string[];
  // Legacy tag fields for backward compatibility
  skill_tags?: string[];
  interest_tags?: string[];
  contribution_tags?: string[];
  sector_tags?: string[];
  
  region_tags?: string[];
  language_tags?: string[];
}

export interface ProfileV2Activity {
  spaces: Array<{
    id: string;
    title: string;
    role: 'creator' | 'member' | string;
  }>;
  events: Array<{
    id: string;
    title: string;
    role: 'host' | 'attendee' | string;
    event_date: string;
  }>;
  connections_count?: number;
  events_count?: number;
  stories_count?: number;
  contributions_count?: number;
}

export interface ProfileV2Permissions {
  is_owner: boolean;
  can_edit: boolean;
  can_create_events: boolean;
  can_create_public_spaces: boolean;
  can_connect?: boolean;
}

export interface ProfileV2Visibility {
  about?: 'public' | 'hidden';
  skills?: 'public' | 'hidden';
  interests?: 'public' | 'hidden';
  activity?: 'public' | 'hidden';
  events?: 'public' | 'hidden';
  spaces?: 'public' | 'hidden';
  opportunities?: 'public' | 'hidden';
  stories?: 'public' | 'hidden';
  show_about?: boolean;
  show_skills?: boolean;
  show_interests?: boolean;
  show_activity?: boolean;
  show_events?: boolean;
  show_spaces?: boolean;
  show_opportunities?: boolean;
  show_stories?: boolean;
}

/**
 * Per-field visibility settings for public profiles
 * Controls what fields are visible on the public profile page
 */
export interface PublicVisibilitySettings {
  avatar: boolean;
  headline: boolean;
  bio: boolean;
  location: boolean;
  heritage: boolean;
  industry: boolean;
  company: boolean;
  email: boolean;
  phone: boolean;
  linkedin_url: boolean;
  website_url: boolean;
  connection_count: boolean;
  event_count: boolean;
  member_since: boolean;
}

/**
 * Default public visibility settings per PRD Section 3.3
 */
export const DEFAULT_PUBLIC_VISIBILITY: PublicVisibilitySettings = {
  avatar: true,
  headline: true,
  bio: true,
  location: true,
  heritage: true,
  industry: true,
  company: true,
  email: false,
  phone: false,
  linkedin_url: true,
  website_url: true,
  connection_count: true,
  event_count: true,
  member_since: true,
};

export interface ProfileV2Completion {
  score: number;
  suggested_actions: string[];
}

export interface ProfileV2VerificationMeta {
  tier?: VerificationStatus | 'pending' | 'soft' | 'full';
  status?: VerificationStatus;
  updated_at?: string | null;
  improvement_suggestions?: string[];
}
