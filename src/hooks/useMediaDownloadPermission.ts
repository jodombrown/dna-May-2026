/**
 * useMediaDownloadPermission
 *
 * Returns whether the current user is allowed to download / open media
 * attached to a given conversation. Membership in the conversation grants
 * permission. Used to gate the lightbox download button and PDF embed.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useMediaDownloadPermission(conversationId: string | undefined): {
  canDownload: boolean;
  isLoading: boolean;
} {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['media-download-permission', conversationId, user?.id],
    queryFn: async () => {
      if (!conversationId || !user) return false;
      // Use the unified conversations table participant check.
      // RLS already restricts what rows the user can see, so a positive
      // result here is authoritative.
      const { data: rows, error } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return false;
      return !!rows;
    },
    enabled: !!conversationId && !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    canDownload: !!data,
    isLoading,
  };
}
