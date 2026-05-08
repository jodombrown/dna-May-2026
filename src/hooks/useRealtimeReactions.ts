import { useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RealtimeReactionPayload {
  post_id: string;
  user_id: string;
  emoji: string;
  id: string;
  created_at: string;
}

export interface RealtimeLikePayload {
  post_id: string;
  user_id: string;
  id: string;
  created_at: string;
}

interface UseRealtimeReactionsProps {
  /**
   * Post IDs that the consumer is currently rendering. The subscription is
   * scoped to reactions/likes on these posts only, so platform-wide reaction
   * traffic does not invalidate every active session.
   *
   * When empty, no subscription is created.
   *
   * Performance Foundation Spec §2.3 (filter-by-relevant-scope).
   */
  postIds: readonly string[];
  onReactionUpdate?: (payload: RealtimeReactionPayload, event: 'INSERT' | 'DELETE') => void;
  onLikeUpdate?: (payload: RealtimeLikePayload, event: 'INSERT' | 'DELETE') => void;
}

export const useRealtimeReactions = ({
  postIds,
  onReactionUpdate,
  onLikeUpdate,
}: UseRealtimeReactionsProps) => {

  const handleReactionChange = useCallback((payload: { new?: RealtimeReactionPayload; old?: RealtimeReactionPayload }, event: 'INSERT' | 'DELETE') => {
    const data = payload.new || payload.old;
    if (data) onReactionUpdate?.(data, event);
  }, [onReactionUpdate]);

  const handleLikeChange = useCallback((payload: { new?: RealtimeLikePayload; old?: RealtimeLikePayload }, event: 'INSERT' | 'DELETE') => {
    const data = payload.new || payload.old;
    if (data) onLikeUpdate?.(data, event);
  }, [onLikeUpdate]);

  // Stable dependency key so subscriptions don't rebuild for the same set in
  // a different array reference. Sort to make order-insensitive.
  const postIdsKey = useMemo(() => {
    if (!postIds || postIds.length === 0) return '';
    return [...postIds].sort().join(',');
  }, [postIds]);

  useEffect(() => {
    if (!postIdsKey) return;

    const channelId = `${postIdsKey.length}-${Math.random().toString(36).slice(2, 9)}`;
    const filter = `post_id=in.(${postIdsKey})`;

    const reactionsChannel = supabase
      .channel(`realtime-reactions-${channelId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "post_reactions",
        filter,
      }, (payload: { new?: RealtimeReactionPayload; old?: RealtimeReactionPayload }) => {
        handleReactionChange(payload, 'INSERT');
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "post_reactions",
        filter,
      }, (payload: { new?: RealtimeReactionPayload; old?: RealtimeReactionPayload }) => {
        handleReactionChange(payload, 'DELETE');
      })
      .subscribe();

    const likesChannel = supabase
      .channel(`realtime-likes-${channelId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "post_likes",
        filter,
      }, (payload: { new?: RealtimeLikePayload; old?: RealtimeLikePayload }) => {
        handleLikeChange(payload, 'INSERT');
      })
      .on("postgres_changes", {
        event: "DELETE",
        schema: "public",
        table: "post_likes",
        filter,
      }, (payload: { new?: RealtimeLikePayload; old?: RealtimeLikePayload }) => {
        handleLikeChange(payload, 'DELETE');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(reactionsChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [postIdsKey, handleReactionChange, handleLikeChange]);
};
