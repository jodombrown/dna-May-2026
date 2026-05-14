/**
 * CONTRIBUTE Phase 3: The Room - service layer.
 *
 * Wraps the four Phase 3 RPCs:
 *  - get_room_for_viewer
 *  - get_room_readiness
 *  - dismiss_curation
 *  - curate_room_for_user (called implicitly by get_room_for_viewer on first
 *    visit of the day; also exposed here for the empty-state retry path)
 *
 * Plus a batched profile lookup for the subjects rendered in the room.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ContributionCurrency,
  MatchKind,
  NeedScope,
  ReasoningSource,
  RoomCuration,
  RoomReadiness,
  RoomSubjectProfile,
} from '@/types/contribute';

interface RoomRow {
  curation_id: string;
  subject_user_id: string;
  kind: MatchKind;
  currency: ContributionCurrency;
  subject_stance_id: string | null;
  subject_stance_title: string | null;
  subject_need_id: string | null;
  subject_need_title: string | null;
  subject_need_context: string | null;
  subject_need_scope: NeedScope | null;
  viewer_stance_id: string | null;
  viewer_stance_title: string | null;
  viewer_need_id: string | null;
  viewer_need_title: string | null;
  score: number | string;
  reasoning: string;
  reasoning_source: ReasoningSource;
  curation_date: string;
}

interface ReadinessRow {
  has_manifest: boolean;
  manifest_published: boolean;
  active_stance_count: number;
  active_need_count: number;
  curation_count_today: number;
}

interface ProfileRow {
  id: string;
  username: string | null;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  city: string | null;
  location: string | null;
  headline: string | null;
}

function mapCuration(row: RoomRow): RoomCuration {
  return {
    curationId: row.curation_id,
    subjectUserId: row.subject_user_id,
    kind: row.kind,
    currency: row.currency,
    subjectStanceId: row.subject_stance_id,
    subjectStanceTitle: row.subject_stance_title,
    subjectNeedId: row.subject_need_id,
    subjectNeedTitle: row.subject_need_title,
    subjectNeedContext: row.subject_need_context,
    subjectNeedScope: row.subject_need_scope,
    viewerStanceId: row.viewer_stance_id,
    viewerStanceTitle: row.viewer_stance_title,
    viewerNeedId: row.viewer_need_id,
    viewerNeedTitle: row.viewer_need_title,
    score: typeof row.score === 'string' ? parseFloat(row.score) : row.score,
    reasoning: row.reasoning,
    reasoningSource: row.reasoning_source,
    curationDate: row.curation_date,
  };
}

function mapProfile(row: ProfileRow): RoomSubjectProfile {
  return {
    userId: row.id,
    displayName: row.display_name ?? row.full_name ?? row.username ?? 'A diaspora member',
    username: row.username,
    avatarUrl: row.avatar_url,
    city: row.city,
    location: row.location,
    headline: row.headline,
  };
}

export const contributeRoomService = {
  async getRoomForViewer(): Promise<RoomCuration[]> {
    // Cast: get_room_for_viewer is a Phase 3 RPC not yet in the generated types.
    const rpc = supabase.rpc as unknown as (
      fn: string,
    ) => Promise<{ data: RoomRow[] | null; error: { message: string } | null }>;
    const { data, error } = await rpc('get_room_for_viewer');
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapCuration);
  },

  async getRoomReadiness(): Promise<RoomReadiness> {
    const rpc = supabase.rpc as unknown as (
      fn: string,
    ) => Promise<{ data: ReadinessRow[] | null; error: { message: string } | null }>;
    const { data, error } = await rpc('get_room_readiness');
    if (error) throw new Error(error.message);
    const row = data?.[0];
    if (!row) {
      return {
        hasManifest: false,
        manifestPublished: false,
        activeStanceCount: 0,
        activeNeedCount: 0,
        curationCountToday: 0,
      };
    }
    return {
      hasManifest: row.has_manifest,
      manifestPublished: row.manifest_published,
      activeStanceCount: row.active_stance_count,
      activeNeedCount: row.active_need_count,
      curationCountToday: row.curation_count_today,
    };
  },

  async dismissCuration(curationId: string): Promise<void> {
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
    const { error } = await rpc('dismiss_curation', { curation_id: curationId });
    if (error) throw new Error(error.message);
  },

  async curateRoomForUser(maxPerKind = 5): Promise<number> {
    const rpc = supabase.rpc as unknown as (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: number | null; error: { message: string } | null }>;
    const { error, data } = await rpc('curate_room_for_user', { p_max_per_kind: maxPerKind });
    if (error) throw new Error(error.message);
    return data ?? 0;
  },

  async getSubjectProfiles(userIds: string[]): Promise<Record<string, RoomSubjectProfile>> {
    if (userIds.length === 0) return {};
    const unique = Array.from(new Set(userIds));
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, display_name, avatar_url, city, location, headline')
      .in('id', unique);
    if (error) throw new Error(error.message);
    const out: Record<string, RoomSubjectProfile> = {};
    for (const row of (data ?? []) as ProfileRow[]) {
      out[row.id] = mapProfile(row);
    }
    return out;
  },
};
