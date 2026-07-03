import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { SpaceVisibility } from '@/types/collaborate';

interface JoinSpaceArgs {
  spaceId: string;
  /** Used only to tailor the success message (open join vs. request). */
  visibility?: SpaceVisibility;
}

/**
 * Calls public.rpc_request_join_space, which is keyed to the space's visibility:
 *   - public    -> caller joins immediately (active)
 *   - community -> caller's request is recorded (invited), pending a lead's approval.
 *                  Requires profiles.role_declared_at IS NOT NULL (Arc-2 proxy for
 *                  Affirmed-Member; mirrors the community-visibility RLS gate).
 *   - private   -> the RPC raises 'This space is invite-only.'
 * Invalidates the space membership queries so the UI reflects the new state.
 */
export function useJoinSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ spaceId }: JoinSpaceArgs) => {
      const { error } = await supabase.rpc('rpc_request_join_space', {
        p_space: spaceId,
      });
      if (error) throw error;
    },
    onSuccess: (_data, { spaceId, visibility }) => {
      if (visibility === 'community') {
        toast.success("Request sent — a space lead will review it soon.");
      } else {
        toast.success("You've joined the space.");
      }
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['my-spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space', spaceId] });
      queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] });
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.';
      toast.error(message);
    },
  });
}
