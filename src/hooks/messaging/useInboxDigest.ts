import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { messageService } from '@/services/messageService';
import { groupMessageService } from '@/services/groupMessageService';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNowStrict } from 'date-fns';

export interface InboxDigestThread {
  id: string;
  type: 'direct' | 'group';
  title: string;
  avatarUrl?: string;
  unreadCount: number;
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastMessageRelative: string;
  href: string;
}

export interface InboxDigestPayload {
  totalUnread: number;
  unreadThreadCount: number;
  topThreads: InboxDigestThread[];
  totalThreads: number;
  groupUnread: number;
  directUnread: number;
}

const formatRel = (iso: string | null | undefined) => {
  if (!iso) return '';
  try {
    return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
  } catch {
    return '';
  }
};

/**
 * Phase 15 - Cross-thread inbox digest for PulseDock.
 * Aggregates direct + group conversations into a single ranked digest.
 */
export function useInboxDigest(enabled: boolean) {
  const { user } = useAuth();

  return useQuery<InboxDigestPayload>({
    queryKey: ['inbox-digest', user?.id],
    enabled: enabled && !!user?.id,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const [direct, groups, snoozesRes] = await Promise.all([
        messageService.getConversations(50, 0, false).catch(() => []),
        groupMessageService.getGroupConversations().catch(() => []),
        supabase
          .from('dia_brief_snoozes')
          .select('thread_id, thread_type')
          .eq('user_id', user!.id)
          .gt('snoozed_until', nowIso),
      ]);

      const snoozedKeys = new Set(
        (snoozesRes.data ?? []).map((r) => `${r.thread_type}:${r.thread_id}`),
      );

      const directThreads: InboxDigestThread[] = (direct ?? []).map((c) => ({
        id: c.conversation_id,
        type: 'direct',
        title: c.other_user_full_name || c.other_user_username || 'Member',
        avatarUrl: c.other_user_avatar_url,
        unreadCount: c.unread_count ?? 0,
        lastMessagePreview:
          c.last_message_preview || c.last_message_content || '(no messages yet)',
        lastMessageAt: c.last_message_at ?? null,
        lastMessageRelative: formatRel(c.last_message_at),
        href: `/dna/messages/${c.conversation_id}`,
      }));

      const groupThreads: InboxDigestThread[] = (groups ?? []).map((g) => ({
        id: g.conversation_id,
        type: 'group',
        title: g.title || 'Group chat',
        avatarUrl: g.avatar_url ?? undefined,
        unreadCount: g.unread_count ?? 0,
        lastMessagePreview: `${g.participant_count} members`,
        lastMessageAt: g.last_message_at ?? null,
        lastMessageRelative: formatRel(g.last_message_at),
        href: `/dna/messages/group/${g.conversation_id}`,
      }));

      const all = [...directThreads, ...groupThreads].filter(
        (t) => !snoozedKeys.has(`${t.type}:${t.id}`),
      );

      // Rank: unread first (more = higher), then most recent
      const ranked = all.slice().sort((a, b) => {
        if ((b.unreadCount > 0 ? 1 : 0) !== (a.unreadCount > 0 ? 1 : 0)) {
          return (b.unreadCount > 0 ? 1 : 0) - (a.unreadCount > 0 ? 1 : 0);
        }
        if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount;
        const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return tb - ta;
      });

      const totalUnread = all.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
      const unreadThreadCount = all.filter((t) => t.unreadCount > 0).length;

      return {
        totalUnread,
        unreadThreadCount,
        topThreads: ranked.slice(0, 6),
        totalThreads: all.length,
        groupUnread: groupThreads.reduce((s, t) => s + (t.unreadCount || 0), 0),
        directUnread: directThreads.reduce((s, t) => s + (t.unreadCount || 0), 0),
      };
    },
  });
}
