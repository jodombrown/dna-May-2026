/**
 * affirmationsService — data access for the Affirmation flow.
 *
 * The backend (public.affirmations + RPCs) is live and certified; this module
 * only reads and writes through it. It never authors schema.
 *
 * Contract recap:
 *  - INSERT creates a pending row (witness required). Affirmed = attested_at set.
 *  - While pending, the declarer may edit statement / re-pick witness (UPDATE).
 *  - After attestation the row is immutable.
 *  - rpc_list_eligible_witnesses(role) -> uuid[] (names resolved via public_profiles).
 *  - rpc_attest_affirmation(id) -> void (witness-only).
 */

import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';

export type Affirmation = Tables<'affirmations'>;

/** A candidate (or named) member, resolved through the public_profiles view. */
export interface ResolvedMember {
  id: string;
  /** Best available display name, or null when none is public. */
  name: string | null;
  username: string | null;
  avatarUrl: string | null;
}

const bestName = (p: {
  display_name: string | null;
  full_name: string | null;
  first_name: string | null;
  username: string | null;
}): string | null => p.display_name || p.full_name || p.first_name || p.username || null;

/** Resolve display info for a set of profile ids via the public_profiles view. */
export const resolveMembers = async (ids: string[]): Promise<Map<string, ResolvedMember>> => {
  const map = new Map<string, ResolvedMember>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from('public_profiles')
    .select('id, display_name, full_name, first_name, username, avatar_url')
    .in('id', unique);

  if (error) throw error;

  for (const row of data ?? []) {
    if (!row.id) continue;
    map.set(row.id, {
      id: row.id,
      name: bestName(row),
      username: row.username,
      avatarUrl: row.avatar_url,
    });
  }
  return map;
};

/** Resolve a single member (or null when the id is null / not visible). */
export const resolveMember = async (id: string | null): Promise<ResolvedMember | null> => {
  if (!id) return null;
  const map = await resolveMembers([id]);
  return map.get(id) ?? null;
};

export const affirmationsService = {
  /** The current user's own affirmation row (pending or attested), if any. */
  async getOwn(profileId: string): Promise<Affirmation | null> {
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /** A single affirmation by id (RLS decides visibility: declarer or witness). */
  async getById(id: string): Promise<Affirmation | null> {
    const { data, error } = await supabase
      .from('affirmations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  /** Eligible witnesses for a role, with names resolved via public_profiles. */
  async listEligibleWitnesses(role: AffirmRole): Promise<ResolvedMember[]> {
    const { data, error } = await supabase.rpc('rpc_list_eligible_witnesses', {
      p_role_at_affirm: role,
    });
    if (error) throw error;

    const ids = (data ?? []) as string[];
    if (ids.length === 0) return [];

    const resolved = await resolveMembers(ids);
    // Preserve RPC ordering; keep every id even if the view hid a name.
    return ids.map(
      (id) => resolved.get(id) ?? { id, name: null, username: null, avatarUrl: null },
    );
  },

  /** INSERT a pending affirmation. Witness is required by the backend contract. */
  async create(input: {
    profileId: string;
    role: AffirmRole;
    witnessId: string;
    statement: string | null;
  }): Promise<Affirmation> {
    const { data, error } = await supabase
      .from('affirmations')
      .insert({
        profile_id: input.profileId,
        role_at_affirm: input.role,
        witness_id: input.witnessId,
        statement: input.statement,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /** UPDATE own pending row — edit statement and/or re-pick witness. */
  async updatePending(
    id: string,
    updates: { statement?: string | null; witnessId?: string },
  ): Promise<Affirmation> {
    const patch: Partial<Affirmation> = {};
    if ('statement' in updates) patch.statement = updates.statement ?? null;
    if (updates.witnessId) patch.witness_id = updates.witnessId;

    const { data, error } = await supabase
      .from('affirmations')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  /** Witness-only attestation. */
  async attest(id: string): Promise<void> {
    const { error } = await supabase.rpc('rpc_attest_affirmation', {
      p_affirmation_id: id,
    });
    if (error) throw error;
  },
};
