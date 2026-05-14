/**
 * messagingSafetyService - block + report actions for the messaging surface.
 * Uses public.user_blocks and public.user_reports.
 */
import { supabase } from '@/integrations/supabase/client';

export const messagingSafetyService = {
  async blockUser(targetUserId: string): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) throw new Error('Not authenticated');
    if (uid === targetUserId) throw new Error('Cannot block yourself');
    const { error } = await supabase
      .from('user_blocks')
      .upsert(
        { blocker_id: uid, blocked_id: targetUserId },
        { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true },
      );
    if (error) throw error;
  },

  async unblockUser(targetUserId: string): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', uid)
      .eq('blocked_id', targetUserId);
    if (error) throw error;
  },

  async isBlocked(targetUserId: string): Promise<boolean> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return false;
    const { data, error } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', uid)
      .eq('blocked_id', targetUserId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async reportUser(params: {
    targetUserId: string;
    conversationId?: string | null;
    messageId?: string | null;
    reason: string;
    details?: string;
  }): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) throw new Error('Not authenticated');
    const { error } = await supabase.from('user_reports').insert({
      reporter_id: uid,
      target_user_id: params.targetUserId,
      conversation_id: params.conversationId ?? null,
      message_id: params.messageId ?? null,
      reason: params.reason as never,
      details: params.details ?? null,
    });
    if (error) throw error;
  },
};
