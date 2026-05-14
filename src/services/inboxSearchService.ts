import { supabase } from '@/integrations/supabase/client';

export interface InboxSearchHit {
  conversation_id: string;
  message_id: string;
  snippet: string;
  created_at: string;
  is_group: boolean;
}

/**
 * Tier 3: global inbox search across message bodies.
 * Backed by `search_inbox_messages` SECURITY DEFINER RPC.
 */
export async function searchInboxMessages(
  query: string,
  limit = 25
): Promise<InboxSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  // RPC is not yet in generated types; cast through unknown.
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>
  ) => Promise<{ data: InboxSearchHit[] | null; error: unknown }>)(
    'search_inbox_messages',
    { p_query: q, p_limit: limit }
  );
  if (error) throw error;
  return data ?? [];
}
