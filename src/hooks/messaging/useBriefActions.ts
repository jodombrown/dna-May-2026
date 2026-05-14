import { useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/services/messageService';
import { groupMessageService } from '@/services/groupMessageService';
import { logDiaMessagingEvent } from '@/services/diaMessagingTelemetry';
import { toast } from 'sonner';

export type BriefThreadType = 'direct' | 'group';

export interface SnoozeRow {
  thread_id: string;
  thread_type: BriefThreadType;
  snoozed_until: string;
}

/**
 * Phase 17 - Actionable Brief.
 * Returns the set of currently-active snoozes for the signed-in user so the
 * inbox digest can hide snoozed threads.
 */
export function useActiveSnoozes(enabled: boolean) {
  const { user } = useAuth();
  return useQuery<SnoozeRow[]>({
    queryKey: ['brief-snoozes', user?.id],
    enabled: enabled && !!user?.id,
    staleTime: 30 * 1000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('dia_brief_snoozes')
        .select('thread_id, thread_type, snoozed_until')
        .eq('user_id', user!.id)
        .gt('snoozed_until', nowIso);
      if (error) return [];
      return (data ?? []).map((r) => ({
        thread_id: r.thread_id as string,
        thread_type: r.thread_type as BriefThreadType,
        snoozed_until: r.snoozed_until as string,
      }));
    },
  });
}

interface SnoozeArgs {
  threadId: string;
  threadType: BriefThreadType;
  hours: number;
}

export function useBriefActions() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['inbox-digest', user?.id] });
    qc.invalidateQueries({ queryKey: ['brief-snoozes', user?.id] });
    qc.invalidateQueries({ queryKey: ['inbox-brief', user?.id] });
  }, [qc, user?.id]);

  const snooze = useMutation({
    mutationFn: async ({ threadId, threadType, hours }: SnoozeArgs) => {
      if (!user?.id) throw new Error('not authed');
      const until = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('dia_brief_snoozes')
        .upsert(
          {
            user_id: user.id,
            thread_id: threadId,
            thread_type: threadType,
            snoozed_until: until,
          },
          { onConflict: 'user_id,thread_id,thread_type' },
        );
      if (error) throw error;
      logDiaMessagingEvent({
        conversationId: threadId,
        eventType: 'action_item_clicked',
        metadata: { surface: 'brief', action: 'snooze', hours, threadType },
      });
    },
    onSuccess: (_d, vars) => {
      invalidateAll();
      toast.success(
        vars.hours >= 24
          ? `Snoozed for ${Math.round(vars.hours / 24)}d`
          : `Snoozed for ${vars.hours}h`,
      );
    },
    onError: () => toast.error('Could not snooze that thread'),
  });

  const markRead = useMutation({
    mutationFn: async ({
      threadId,
      threadType,
    }: {
      threadId: string;
      threadType: BriefThreadType;
    }) => {
      if (threadType === 'direct') {
        await messageService.markAsRead(threadId);
      } else {
        await groupMessageService.updateReadCursor(threadId);
      }
      logDiaMessagingEvent({
        conversationId: threadId,
        eventType: 'action_item_clicked',
        metadata: { surface: 'brief', action: 'mark_read', threadType },
      });
    },
    onSuccess: () => {
      invalidateAll();
    },
    onError: () => toast.error('Could not mark as read'),
  });

  const markAllRead = useMutation({
    mutationFn: async (
      threads: Array<{ id: string; type: BriefThreadType; unreadCount: number }>,
    ) => {
      const targets = threads.filter((t) => t.unreadCount > 0);
      await Promise.allSettled(
        targets.map((t) =>
          t.type === 'direct'
            ? messageService.markAsRead(t.id)
            : groupMessageService.updateReadCursor(t.id),
        ),
      );
      logDiaMessagingEvent({
        conversationId: 'inbox-brief',
        eventType: 'action_item_clicked',
        metadata: { surface: 'brief', action: 'mark_all_read', count: targets.length },
      });
      return targets.length;
    },
    onSuccess: (count) => {
      invalidateAll();
      toast.success(`Marked ${count} thread${count === 1 ? '' : 's'} as read`);
    },
    onError: () => toast.error('Could not mark all as read'),
  });

  return { snooze, markRead, markAllRead };
}
