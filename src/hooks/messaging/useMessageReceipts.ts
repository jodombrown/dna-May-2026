import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

interface ReceiptRow {
  message_id: string;
  user_id: string;
  delivered_at: string | null;
  read_at: string | null;
}

/**
 * Fetch + subscribe to receipts for a conversation. Used to drive
 * sent / delivered / read tick states on own bubbles.
 *
 * Realtime channel is filtered by conversation_id (Performance Foundation rule 3).
 */
export function useConversationReceipts(conversationId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['message-receipts', conversationId],
    enabled: !!conversationId,
    staleTime: 30_000,
    queryFn: async (): Promise<Record<string, MessageStatus>> => {
      if (!conversationId) return {};
      const { data, error } = await supabase
        .from('message_receipts')
        .select('message_id, user_id, delivered_at, read_at')
        .eq('conversation_id', conversationId);
      if (error) throw error;
      return aggregate((data ?? []) as ReceiptRow[]);
    },
  });

  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`receipts:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_receipts',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['message-receipts', conversationId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, queryClient]);

  return query;
}

function aggregate(rows: ReceiptRow[]): Record<string, MessageStatus> {
  // Group by message_id; the worst (least-far-along) state across recipients wins
  const byMsg = new Map<string, ReceiptRow[]>();
  for (const r of rows) {
    const arr = byMsg.get(r.message_id) ?? [];
    arr.push(r);
    byMsg.set(r.message_id, arr);
  }
  const out: Record<string, MessageStatus> = {};
  for (const [mid, list] of byMsg) {
    const allRead = list.every((r) => r.read_at);
    const anyDelivered = list.some((r) => r.delivered_at || r.read_at);
    out[mid] = allRead ? 'read' : anyDelivered ? 'delivered' : 'sent';
  }
  return out;
}
