import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logHighError } from '@/lib/errorLogger';

export function usePostActions(postId: string, authorId: string, currentUserId?: string) {
  const queryClient = useQueryClient();
  const isOwnPost = authorId === currentUserId;

  // Check if author is muted
  const { data: isMuted = false } = useQuery({
    queryKey: ['muted-author', currentUserId, authorId],
    queryFn: async () => {
      if (!currentUserId || isOwnPost) return false;

      const { data, error } = await supabase
        .from('muted_authors')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('muted_user_id', authorId)
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!currentUserId && !isOwnPost,
  });

  // Edit post via the column-allowlisted SECURITY DEFINER RPC. updated_at is
  // owned by a database trigger; the caller passes the row's current
  // updated_at for optimistic concurrency (40001 raised on mismatch).
  const editPost = useMutation({
    mutationFn: async ({
      content,
      expectedUpdatedAt,
    }: {
      content: string;
      expectedUpdatedAt: string;
    }) => {
      if (!currentUserId || !isOwnPost) throw new Error('Not authorized');

      const { error } = await supabase.rpc('rpc_update_post' as any, {
        p_post_id: postId,
        p_expected_updated_at: expectedUpdatedAt,
        p_patch: { content },
      });

      if (error) {
        if ((error as any).code === '40001') throw new Error('POST_STALE');
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      toast.success('Post updated');
    },
    onError: (error) => {
      if (error instanceof Error && error.message === 'POST_STALE') {
        toast.error('This post changed since you opened it. Reload before saving.');
      } else {
        logHighError(error, 'database', 'rpc_update_post failed', { postId });
        toast.error('Failed to update post');
      }
    },
  });

  // Delete post (soft delete via SECURITY DEFINER RPC)
  const deletePost = useMutation({
    mutationFn: async () => {
      if (!currentUserId || !isOwnPost) throw new Error('Not authorized');

      const { error } = await supabase.rpc('rpc_soft_delete_post' as any, {
        p_post_id: postId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      toast.success('Post deleted');
    },
    onError: (error) => {
      logHighError(error, 'database', 'rpc_soft_delete_post failed', { postId });
      toast.error('Failed to delete post');
    },
  });

  // Pin/unpin post to profile
  const togglePin = useMutation({
    mutationFn: async (isPinned: boolean) => {
      if (!currentUserId || !isOwnPost) throw new Error('Not authorized');

      const { error } = await supabase.rpc('rpc_set_post_pinned' as any, {
        p_post_id: postId,
        p_pinned: isPinned,
      });

      if (error) throw error;
    },
    onSuccess: (_, isPinned) => {
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      toast.success(isPinned ? 'Post pinned to profile' : 'Post unpinned');
    },
    onError: (error) => {
      logHighError(error, 'database', 'rpc_set_post_pinned failed', { postId });
      toast.error('Failed to update pin status');
    },
  });

  // Toggle comments
  const toggleComments = useMutation({
    mutationFn: async (disabled: boolean) => {
      if (!currentUserId || !isOwnPost) throw new Error('Not authorized');

      const { error } = await supabase.rpc('rpc_set_post_comments_disabled' as any, {
        p_post_id: postId,
        p_disabled: disabled,
      });

      if (error) throw error;
    },
    onSuccess: (_, disabled) => {
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      toast.success(disabled ? 'Comments turned off' : 'Comments turned on');
    },
    onError: (error) => {
      logHighError(error, 'database', 'rpc_set_post_comments_disabled failed', { postId });
      toast.error('Failed to update comment settings');
    },
  });

  // Report post
  const reportPost = useMutation({
    mutationFn: async ({ reason, description }: { reason: string; description?: string }) => {
      if (!currentUserId) throw new Error('Not authenticated');

      const { error } = await supabase.from('post_reports').insert({
        post_id: postId,
        reporter_id: currentUserId,
        reason,
        description,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Post reported. We will review it shortly.');
    },
    onError: () => toast.error('Failed to report post'),
  });

  // Hide post from feed
  const hidePost = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Not authenticated');

      const { error } = await supabase.from('hidden_posts').insert({
        user_id: currentUserId,
        post_id: postId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      toast.success('Post hidden from your feed');
    },
    onError: () => toast.error('Failed to hide post'),
  });

  // Mute author
  const muteAuthor = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Not authenticated');

      const { error } = await supabase.from('muted_authors').insert({
        user_id: currentUserId,
        muted_user_id: authorId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      queryClient.invalidateQueries({ queryKey: ['muted-author', currentUserId, authorId] });
      toast.success('Author muted. You won\'t see their posts.');
    },
    onError: () => toast.error('Failed to mute author'),
  });

  // Unmute author
  const unmuteAuthor = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('muted_authors')
        .delete()
        .eq('user_id', currentUserId)
        .eq('muted_user_id', authorId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      queryClient.invalidateQueries({ queryKey: ['muted-author', currentUserId, authorId] });
      toast.success('Author unmuted. You\'ll see their posts again.');
    },
    onError: () => toast.error('Failed to unmute author'),
  });

  // Copy link
  const copyLink = async () => {
    const url = `${window.location.origin}/post/${postId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };

  return {
    isOwnPost,
    isMuted,
    editPost,
    deletePost,
    togglePin,
    toggleComments,
    reportPost,
    hidePost,
    muteAuthor,
    unmuteAuthor,
    copyLink,
  };
}
