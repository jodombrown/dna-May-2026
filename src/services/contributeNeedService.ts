/**
 * CONTRIBUTE Phase 2 service layer for Need declarations.
 *
 * Thin wrappers over the Phase 2 RPCs and the `need_declarations` table.
 * Symmetric peer to `contributeManifestService`.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ContributionCurrency,
  NeedDeclaration,
  NeedFormValues,
  NeedScope,
  NeedStatus,
  StanceVisibility,
} from '@/types/contribute';

interface NeedRow {
  id: string;
  user_id: string;
  currency: ContributionCurrency;
  title: string;
  context: string | null;
  scope: NeedScope;
  related_stance_id: string | null;
  tags: string[] | null;
  visibility: StanceVisibility;
  status: NeedStatus;
  starts_at: string | null;
  ends_at: string | null;
  expires_at: string | null;
  published_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapNeed(row: NeedRow): NeedDeclaration {
  return {
    id: row.id,
    userId: row.user_id,
    currency: row.currency,
    title: row.title,
    context: row.context,
    scope: row.scope,
    relatedStanceId: row.related_stance_id,
    tags: row.tags ?? [],
    visibility: row.visibility,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    expiresAt: row.expires_at,
    publishedAt: row.published_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const STATUS_RANK: Record<NeedStatus, number> = {
  open: 1,
  matched: 2,
  fulfilled: 3,
  draft: 4,
  closed: 5,
  expired: 6,
};

export const contributeNeedService = {
  async loadOwnNeeds(userId: string): Promise<NeedDeclaration[]> {
    const { data, error } = await supabase
      .from('need_declarations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    const rows = (data as NeedRow[] | null) ?? [];
    return rows
      .map(mapNeed)
      .sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
  },

  async getNeedsForUser(targetUserId: string): Promise<NeedDeclaration[]> {
    const { data, error } = await supabase.rpc('get_need_declarations_for_user', {
      target_user_id: targetUserId,
    });
    if (error) throw error;
    const rows = (data as NeedRow[] | null) ?? [];
    return rows.map(mapNeed);
  },

  async createNeed(input: NeedFormValues & { userId: string }): Promise<NeedDeclaration> {
    const { data, error } = await supabase
      .from('need_declarations')
      .insert({
        user_id: input.userId,
        currency: input.currency,
        title: input.title,
        context: input.context.trim().length === 0 ? null : input.context,
        scope: input.scope,
        related_stance_id: input.relatedStanceId,
        tags: input.tags,
        visibility: input.visibility,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapNeed(data as NeedRow);
  },

  async updateNeed(
    needId: string,
    input: Partial<Omit<NeedFormValues, 'currency'>>,
  ): Promise<NeedDeclaration> {
    const patch: Partial<NeedRow> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.context !== undefined) {
      patch.context = input.context.trim().length === 0 ? null : input.context;
    }
    if (input.scope !== undefined) patch.scope = input.scope;
    if (input.relatedStanceId !== undefined) patch.related_stance_id = input.relatedStanceId;
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.visibility !== undefined) patch.visibility = input.visibility;
    if (input.startsAt !== undefined) patch.starts_at = input.startsAt;
    if (input.endsAt !== undefined) patch.ends_at = input.endsAt;

    const { data, error } = await supabase
      .from('need_declarations')
      .update(patch)
      .eq('id', needId)
      .select('*')
      .single();
    if (error) throw error;
    return mapNeed(data as NeedRow);
  },

  async publishNeed(needId: string): Promise<NeedDeclaration> {
    const { data, error } = await supabase.rpc('publish_need_declaration', {
      declaration_id: needId,
    });
    if (error) throw error;
    return mapNeed(data as NeedRow);
  },

  async closeNeed(needId: string): Promise<NeedDeclaration> {
    const { data, error } = await supabase.rpc('close_need_declaration', {
      declaration_id: needId,
    });
    if (error) throw error;
    return mapNeed(data as NeedRow);
  },

  async deleteNeed(needId: string): Promise<void> {
    const { error } = await supabase
      .from('need_declarations')
      .delete()
      .eq('id', needId);
    if (error) throw error;
  },
};
