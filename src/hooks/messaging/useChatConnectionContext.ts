import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChatConnectionContext {
  is_connected: boolean;
  connected_at: string | null;
  shared_events: number;
  shared_spaces: number;
  mutual_connections: number;
  recent_event_title: string | null;
  recent_space_title: string | null;
}

const EMPTY: ChatConnectionContext = {
  is_connected: false,
  connected_at: null,
  shared_events: 0,
  shared_spaces: 0,
  mutual_connections: 0,
  recent_event_title: null,
  recent_space_title: null,
};

/**
 * Phase 6 - ChatHeader v2
 * Lightweight, cached lookup for the chat header context chip.
 * Backed by `get_chat_connection_context` RPC.
 */
export function useChatConnectionContext(otherUserId: string | null | undefined) {
  return useQuery({
    queryKey: ['chat-connection-context', otherUserId],
    enabled: !!otherUserId,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ChatConnectionContext> => {
      if (!otherUserId) return EMPTY;
      const { data, error } = await supabase.rpc('get_chat_connection_context', {
        _other_user_id: otherUserId,
      });
      if (error) throw error;
      return (data as unknown as ChatConnectionContext) ?? EMPTY;
    },
  });
}
