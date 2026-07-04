/**
 * useAffirmation — react-query hooks for the Affirmation flow.
 *
 * Wraps affirmationsService. Query keys are shared with useIsAffirmed so a
 * mutation here refreshes the gating hook too.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  affirmationsService,
  resolveMember,
  type Affirmation,
  type ResolvedMember,
} from '@/services/affirmationsService';
import type { AffirmRole } from '@/content/affirmation-ceremony.content';

export const affirmationKeys = {
  all: ['affirmations'] as const,
  own: (userId?: string) => ['affirmations', 'own', userId] as const,
  byId: (id?: string) => ['affirmations', 'byId', id] as const,
  witnesses: (role?: AffirmRole) => ['affirmations', 'witnesses', role] as const,
  member: (id?: string | null) => ['affirmations', 'member', id] as const,
};

/** The current user's own affirmation (pending or attested), if any. */
export const useOwnAffirmation = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: affirmationKeys.own(user?.id),
    queryFn: () => affirmationsService.getOwn(user!.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  });
};

/** A single affirmation by id — the attest surface. RLS decides visibility. */
export const useAffirmationById = (id: string | undefined) =>
  useQuery({
    queryKey: affirmationKeys.byId(id),
    queryFn: () => affirmationsService.getById(id!),
    enabled: !!id,
    staleTime: 15_000,
  });

/** Eligible witnesses for a role, names resolved via public_profiles. */
export const useEligibleWitnesses = (role: AffirmRole | undefined, enabled = true) =>
  useQuery({
    queryKey: affirmationKeys.witnesses(role),
    queryFn: () => affirmationsService.listEligibleWitnesses(role!),
    enabled: enabled && !!role,
    staleTime: 30_000,
  });

/** Resolve one member's display info (e.g. a named witness or declarer). */
export const useResolvedMember = (id: string | null | undefined) =>
  useQuery<ResolvedMember | null>({
    queryKey: affirmationKeys.member(id),
    queryFn: () => resolveMember(id ?? null),
    enabled: !!id,
    staleTime: 5 * 60_000,
  });

/** INSERT a pending affirmation. */
export const useCreateAffirmation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { role: AffirmRole; witnessId: string; statement: string | null }) =>
      affirmationsService.create({ profileId: user!.id, ...input }),
    onSuccess: (row: Affirmation) => {
      queryClient.setQueryData(affirmationKeys.own(user?.id), row);
      queryClient.invalidateQueries({ queryKey: affirmationKeys.own(user?.id) });
    },
  });
};

/** UPDATE own pending affirmation — edit statement / re-pick witness. */
export const useUpdateAffirmation = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { statement?: string | null; witnessId?: string };
    }) => affirmationsService.updatePending(id, updates),
    onSuccess: (row: Affirmation) => {
      queryClient.setQueryData(affirmationKeys.own(user?.id), row);
      queryClient.setQueryData(affirmationKeys.byId(row.id), row);
    },
  });
};

/** Witness-only attestation. */
export const useAttestAffirmation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => affirmationsService.attest(id),
    onSuccess: (_void, id) => {
      queryClient.invalidateQueries({ queryKey: affirmationKeys.byId(id) });
      queryClient.invalidateQueries({ queryKey: affirmationKeys.all });
    },
  });
};

/**
 * Declare / update the current user's affirming role on their profile (the
 * gate before the ceremony). Mirrors the onboarding write: sets role and,
 * when not already declared, role_declared_at.
 */
export const useDeclareRole = () => {
  const { user, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      role,
      setDeclaredAt,
    }: {
      role: AffirmRole;
      setDeclaredAt: boolean;
    }) => {
      const nowIso = new Date().toISOString();
      const patch: { role: AffirmRole; updated_at: string; role_declared_at?: string } = {
        role,
        updated_at: nowIso,
      };
      if (setDeclaredAt) patch.role_declared_at = nowIso;

      const { error } = await supabase.from('profiles').update(patch).eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await refreshProfile();
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-check', user?.id] });
    },
  });
};
