import { supabase } from '@/integrations/supabase/client';

export type DiaMessagingEvent =
  | 'suggestion_shown'
  | 'suggestion_picked'
  | 'suggestion_sent'
  | 'summary_opened'
  | 'summary_refreshed'
  | 'action_item_clicked'
  | 'prefs_changed';

export interface LogDiaEventInput {
  conversationId: string;
  eventType: DiaMessagingEvent;
  refId?: string;
  model?: string;
  variant?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Phase 13 - fire-and-forget telemetry log for DIA messaging surfaces.
 * Never throws - bad analytics must not break chat.
 */
export async function logDiaMessagingEvent(input: LogDiaEventInput): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    await supabase.from('dia_messaging_events').insert([{
      user_id: uid,
      conversation_id: input.conversationId,
      event_type: input.eventType,
      ref_id: input.refId ?? null,
      model: input.model ?? null,
      variant: input.variant ?? null,
      metadata: (input.metadata ?? null) as never,
    }]);
  } catch {
    // swallow - telemetry must never crash UI
  }
}

export interface SubmitDiaFeedbackInput {
  conversationId: string;
  surface: 'smart_reply' | 'summary' | 'action_item';
  helpful: boolean;
  refId?: string;
  model?: string;
  variant?: string;
}

export async function submitDiaFeedback(input: SubmitDiaFeedbackInput): Promise<void> {
  try {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) return;
    await supabase.from('dia_messaging_feedback').insert([{
      user_id: uid,
      conversation_id: input.conversationId,
      surface: input.surface,
      helpful: input.helpful,
      ref_id: input.refId ?? null,
      model: input.model ?? null,
      variant: input.variant ?? null,
    }]);
  } catch {
    // swallow
  }
}
