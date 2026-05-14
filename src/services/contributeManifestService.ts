/**
 * CONTRIBUTE Phase 1 service layer.
 *
 * Thin wrappers over the three Phase 1 RPCs and the
 * contribution_manifests / currency_stances tables.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  ContributionCurrency,
  ContributionManifest,
  CurrencyStance,
  ManifestWithStances,
  StanceAvailability,
  StanceFormValues,
  StanceVisibility,
} from '@/types/contribute';

interface ManifestRow {
  id: string;
  user_id: string;
  headline: string | null;
  is_published: boolean;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface StanceRow {
  id: string;
  manifest_id: string;
  user_id: string;
  currency: ContributionCurrency;
  title: string;
  description: string | null;
  tags: string[];
  availability: StanceAvailability;
  visibility: StanceVisibility;
  display_order: number;
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapManifest(row: ManifestRow): ContributionManifest {
  return {
    id: row.id,
    userId: row.user_id,
    headline: row.headline,
    isPublished: row.is_published,
    lastReviewedAt: row.last_reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStance(row: StanceRow): CurrencyStance {
  return {
    id: row.id,
    manifestId: row.manifest_id,
    userId: row.user_id,
    currency: row.currency,
    title: row.title,
    description: row.description,
    tags: row.tags ?? [],
    availability: row.availability,
    visibility: row.visibility,
    displayOrder: row.display_order,
    isArchived: row.is_archived,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const contributeManifestService = {
  async ensureManifest(): Promise<string> {
    const { data, error } = await supabase.rpc('ensure_manifest');
    if (error) throw error;
    if (!data) throw new Error('ensure_manifest returned no id');
    return data as string;
  },

  async loadOwnManifest(userId: string): Promise<ManifestWithStances> {
    const manifestId = await contributeManifestService.ensureManifest();

    const { data: manifestRow, error: mErr } = await supabase
      .from('contribution_manifests')
      .select('*')
      .eq('id', manifestId)
      .single();
    if (mErr) throw mErr;

    const { data: stanceRows, error: sErr } = await supabase
      .from('currency_stances')
      .select('*')
      .eq('manifest_id', manifestId)
      .eq('user_id', userId)
      .order('is_archived', { ascending: true })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (sErr) throw sErr;

    return {
      manifest: mapManifest(manifestRow as ManifestRow),
      stances: (stanceRows as StanceRow[] | null)?.map(mapStance) ?? [],
    };
  },

  async getManifestForUser(targetUserId: string): Promise<ManifestWithStances | null> {
    const { data, error } = await supabase.rpc('get_manifest_for_user', {
      target_user_id: targetUserId,
    });
    if (error) throw error;
    const rows = (data ?? []) as Array<{
      manifest_id: string;
      headline: string | null;
      is_published: boolean;
      last_reviewed_at: string | null;
      manifest_created_at: string | null;
      manifest_updated_at: string | null;
      stance_id: string | null;
      currency: ContributionCurrency | null;
      title: string | null;
      description: string | null;
      tags: string[] | null;
      availability: StanceAvailability | null;
      visibility: StanceVisibility | null;
      display_order: number | null;
      stance_created_at: string | null;
      stance_updated_at: string | null;
    }>;

    if (rows.length === 0) return null;
    const head = rows[0];

    const manifest: ContributionManifest = {
      id: head.manifest_id,
      userId: targetUserId,
      headline: head.headline,
      isPublished: head.is_published,
      lastReviewedAt: head.last_reviewed_at,
      createdAt: head.manifest_created_at ?? '',
      updatedAt: head.manifest_updated_at ?? '',
    };

    const stances: CurrencyStance[] = rows
      .filter((r) => r.stance_id !== null && r.currency !== null && r.title !== null)
      .map((r) => ({
        id: r.stance_id as string,
        manifestId: head.manifest_id,
        userId: targetUserId,
        currency: r.currency as ContributionCurrency,
        title: r.title as string,
        description: r.description,
        tags: r.tags ?? [],
        availability: (r.availability as StanceAvailability) ?? 'open_ongoing',
        visibility: (r.visibility as StanceVisibility) ?? 'public',
        displayOrder: r.display_order ?? 0,
        isArchived: false,
        archivedAt: null,
        createdAt: r.stance_created_at ?? '',
        updatedAt: r.stance_updated_at ?? '',
      }));

    return { manifest, stances };
  },

  async updateHeadline(manifestId: string, headline: string): Promise<void> {
    const { error } = await supabase
      .from('contribution_manifests')
      .update({ headline: headline.trim().length === 0 ? null : headline })
      .eq('id', manifestId);
    if (error) throw error;
  },

  async publishManifest(): Promise<ContributionManifest> {
    const { data, error } = await supabase.rpc('publish_manifest');
    if (error) throw error;
    return mapManifest(data as ManifestRow);
  },

  async unpublishManifest(manifestId: string): Promise<void> {
    const { error } = await supabase
      .from('contribution_manifests')
      .update({ is_published: false })
      .eq('id', manifestId);
    if (error) throw error;
  },

  async createStance(
    input: StanceFormValues & { manifestId: string; userId: string; displayOrder: number },
  ): Promise<CurrencyStance> {
    const { data, error } = await supabase
      .from('currency_stances')
      .insert({
        manifest_id: input.manifestId,
        user_id: input.userId,
        currency: input.currency,
        title: input.title,
        description: input.description.trim().length === 0 ? null : input.description,
        tags: input.tags,
        availability: input.availability,
        visibility: input.visibility,
        display_order: input.displayOrder,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapStance(data as StanceRow);
  },

  async updateStance(
    stanceId: string,
    input: Partial<Omit<StanceFormValues, 'currency'>>,
  ): Promise<CurrencyStance> {
    const patch: Partial<StanceRow> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) {
      patch.description = input.description.trim().length === 0 ? null : input.description;
    }
    if (input.tags !== undefined) patch.tags = input.tags;
    if (input.availability !== undefined) patch.availability = input.availability;
    if (input.visibility !== undefined) patch.visibility = input.visibility;

    const { data, error } = await supabase
      .from('currency_stances')
      .update(patch)
      .eq('id', stanceId)
      .select('*')
      .single();
    if (error) throw error;
    return mapStance(data as StanceRow);
  },

  async archiveStance(stanceId: string): Promise<void> {
    const { error } = await supabase
      .from('currency_stances')
      .update({ is_archived: true })
      .eq('id', stanceId);
    if (error) throw error;
  },

  async unarchiveStance(stanceId: string): Promise<void> {
    const { error } = await supabase
      .from('currency_stances')
      .update({ is_archived: false })
      .eq('id', stanceId);
    if (error) throw error;
  },

  async reorderStances(orderedIds: string[]): Promise<void> {
    if (orderedIds.length === 0) return;
    // Batch via Promise.all - small N (<=5).
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase
          .from('currency_stances')
          .update({ display_order: idx })
          .eq('id', id)
          .then(({ error }) => {
            if (error) throw error;
          }),
      ),
    );
  },
};
