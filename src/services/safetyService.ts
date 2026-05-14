/**
 * safetyService - Phase 10
 *
 * Block / unblock, report, disappearing-messages, and rate-limit helpers.
 * The DB enforces the safety guarantees via RLS + triggers; this service
 * only provides typed access for the UI layer.
 */
import { supabase } from '@/integrations/supabase/client';

export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'impersonation'
  | 'inappropriate_content'
  | 'other';

export interface BlockedSummary {
  blocked_id: string;
  created_at: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export interface ReportInput {
  targetUserId: string;
  reason: ReportReason;
  details?: string;
  conversationId?: string;
  messageId?: string;
}

export const safetyService = {
  async blockUser(targetUserId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('user_blocks')
      .insert({ blocker_id: user.id, blocked_id: targetUserId });
    if (error && !error.message.includes('duplicate')) throw error;
  },

  async unblockUser(targetUserId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetUserId);
    if (error) throw error;
  },

  async isBlocked(targetUserId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetUserId)
      .maybeSingle();
    if (error) return false;
    return !!data;
  },

  async listBlocked(): Promise<BlockedSummary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from('user_blocks')
      .select('blocked_id, created_at, profiles:profiles!user_blocks_blocked_id_fkey(full_name, username, avatar_url)')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false });
    if (error) {
      // Fallback - no FK relation defined; do a manual lookup
      const { data: rows } = await supabase
        .from('user_blocks')
        .select('blocked_id, created_at')
        .eq('blocker_id', user.id)
        .order('created_at', { ascending: false });
      if (!rows) return [];
      const ids = rows.map((r) => r.blocked_id);
      if (ids.length === 0) return [];
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .in('id', ids);
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      return rows.map((r) => {
        const p = profMap.get(r.blocked_id);
        return {
          blocked_id: r.blocked_id,
          created_at: r.created_at,
          full_name: p?.full_name ?? null,
          username: p?.username ?? null,
          avatar_url: p?.avatar_url ?? null,
        };
      });
    }
    type Row = { blocked_id: string; created_at: string; profiles: { full_name: string | null; username: string | null; avatar_url: string | null } | null };
    return (data as unknown as Row[]).map((r) => ({
      blocked_id: r.blocked_id,
      created_at: r.created_at,
      full_name: r.profiles?.full_name ?? null,
      username: r.profiles?.username ?? null,
      avatar_url: r.profiles?.avatar_url ?? null,
    }));
  },

  async reportUser(input: ReportInput): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase.from('user_reports').insert({
      reporter_id: user.id,
      target_user_id: input.targetUserId,
      reason: input.reason,
      details: input.details ?? null,
      conversation_id: input.conversationId ?? null,
      message_id: input.messageId ?? null,
    });
    if (error) throw error;
  },

  async setDisappearingDuration(conversationId: string, seconds: number | null): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .update({ disappearing_seconds: seconds })
      .eq('id', conversationId);
    if (error) throw error;
  },

  async getDisappearingDuration(conversationId: string): Promise<number | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select('disappearing_seconds')
      .eq('id', conversationId)
      .maybeSingle();
    if (error || !data) return null;
    return (data as { disappearing_seconds: number | null }).disappearing_seconds;
  },

  /**
   * Client-side rate guard. Returns true when the user may send.
   * Authoritative enforcement should still be done DB-side; this stops the
   * obvious local floods before they hit the network.
   */
  async checkAndLogRate(conversationId: string, windowMs = 60_000, max = 30): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return true;
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count } = await supabase
      .from('message_rate_log')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', since);
    if ((count ?? 0) >= max) return false;
    await supabase.from('message_rate_log').insert({
      sender_id: user.id,
      conversation_id: conversationId,
    });
    return true;
  },
};
