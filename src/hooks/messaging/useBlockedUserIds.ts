import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tier 3 block-enforcement hook.
 *
 * Returns the set of user IDs that the signed-in user has blocked OR who have
 * blocked the signed-in user. Surfaces (Smart Compose, inbox suggestions,
 * request bucket) should hide / disable interactions involving these users.
 */
export function useBlockedUserIds() {
  const { user } = useAuth();
  return useQuery<Set<string>>({
    queryKey: ['blocked-user-ids', user?.id ?? null],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async () => {
      const uid = user!.id;
      const [outgoing, incoming] = await Promise.all([
        supabase.from('user_blocks').select('blocked_id').eq('blocker_id', uid),
        supabase.from('user_blocks').select('blocker_id').eq('blocked_id', uid),
      ]);
      const ids = new Set<string>();
      (outgoing.data ?? []).forEach((r) => r.blocked_id && ids.add(r.blocked_id));
      (incoming.data ?? []).forEach((r) => r.blocker_id && ids.add(r.blocker_id));
      return ids;
    },
  });
}
