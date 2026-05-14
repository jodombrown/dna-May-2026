import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmartRepliesResult {
  suggestions: string[];
  basedOnMessageId: string | null;
}

/**
 * Phase 12.1 - DIA smart reply suggestions for the most recent inbound message.
 * Cached per (conversationId, lastInboundMessageId). Never re-runs on the same
 * message id during a session.
 */
export function useDiaSmartReplies(
  conversationId: string,
  lastInboundMessageId: string | null,
  enabled: boolean,
) {
  return useQuery<SmartRepliesResult>({
    queryKey: ['dia-smart-replies', conversationId, lastInboundMessageId],
    enabled: enabled && !!conversationId && !!lastInboundMessageId,
    staleTime: 10 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<SmartRepliesResult>(
        'dia-smart-replies',
        { body: { conversationId } },
      );
      if (error) throw error;
      return data ?? { suggestions: [], basedOnMessageId: null };
    },
  });
}
