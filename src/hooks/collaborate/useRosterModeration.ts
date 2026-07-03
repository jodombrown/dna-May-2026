import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Approve or decline a pending join request on a space roster.
 *
 * Community-visibility spaces record join requests as (contributor, invited)
 * rows. A lead (or the space creator) reviews them:
 *   - approve -> status becomes 'active'
 *   - decline -> status becomes 'removed'
 *
 * Both go through PostgREST under the existing space_members RLS, which allows
 * UPDATE only for the space creator or a lead. A caller without rights updates
 * zero rows silently, so we select the affected row back and treat an empty
 * result as a permission failure rather than a phantom success.
 */
async function setMemberStatus(
  spaceId: string,
  userId: string,
  status: 'active' | 'removed',
): Promise<void> {
  const { data, error } = await supabase
    .from('space_members')
    .update({ status })
    .eq('space_id', spaceId)
    .eq('user_id', userId)
    .select('user_id');
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Only a space lead can review join requests.');
  }
}

export function useRosterModeration(spaceId: string | undefined) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['space-members', spaceId] });
    queryClient.invalidateQueries({ queryKey: ['spaces'] });
    queryClient.invalidateQueries({ queryKey: ['my-spaces'] });
  };

  const showError = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : 'Something went wrong. Please try again.');

  const approve = useMutation({
    mutationFn: (userId: string) => setMemberStatus(spaceId!, userId, 'active'),
    onSuccess: () => {
      invalidate();
      toast.success('Request approved — they’re now a member.');
    },
    onError: showError,
  });

  const decline = useMutation({
    mutationFn: (userId: string) => setMemberStatus(spaceId!, userId, 'removed'),
    onSuccess: () => {
      invalidate();
      toast.success('Request declined.');
    },
    onError: showError,
  });

  return { approve, decline };
}
