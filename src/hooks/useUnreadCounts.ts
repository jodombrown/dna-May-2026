/**
 * useUnreadCounts - Real-time unread counts for messages and notifications
 *
 * PERFORMANCE OPTIMIZED: Uses single queries instead of N+1 patterns.
 * Provides unified access to unread message and notification counts
 * with real-time updates via Supabase subscriptions.
 */

import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface UnreadCounts {
  messages: {
    unreadCount: number;
  };
  notifications: {
    unreadCount: number;
  };
  isLoading: boolean;
}

const UNREAD_QUERY_KEY = 'unread-counts';

// Singleton channel registry to prevent duplicate subscriptions
const channelRegistry = new Map<string, { channel: ReturnType<typeof supabase.channel>; refs: number }>();

export function useUnreadCounts(): UnreadCounts {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const registryKeyRef = useRef<string | null>(null);

  // OPTIMIZED: Single query using RPC or aggregated approach
  const messagesQuery = useQuery({
    queryKey: [UNREAD_QUERY_KEY, 'messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Use a single aggregated query instead of N+1 pattern
      const { data, error } = await supabase.rpc('get_unread_message_count' as any, {
        p_user_id: user.id,
      });

      // Fallback to simpler count if RPC doesn't exist
      if (error) {
        // Simple fallback: count messages in conversations where user is participant
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('read', false)
          .neq('sender_id', user.id)
          .limit(100); // Cap the count for performance
        
        return count || 0;
      }

      return (data as number) || 0;
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute (increased from 30s)
    refetchInterval: 120000, // 2 minutes (increased from 1 min)
  });

  // Fetch unread notifications count using RPC
  const notificationsQuery = useQuery({
    queryKey: [UNREAD_QUERY_KEY, 'notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data, error } = await supabase.rpc('get_unread_notification_count' as any, {
        p_user_id: user.id,
      });

      if (error) {
        return 0;
      }

      return (data as number) || 0;
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });

  // OPTIMIZED: Use singleton channel pattern to prevent duplicate subscriptions
  useEffect(() => {
    if (!user?.id) return;

    const registryKey = `unread-counts-${user.id}`;
    registryKeyRef.current = registryKey;

    let entry = channelRegistry.get(registryKey);
    if (!entry) {
      // Subscribe to UPDATE on conversation_participants filtered by the
      // current user. The broadcast_new_message trigger on messages_new
      // increments unread_count for every recipient, and mark_conversation_read
      // resets it — both fire UPDATE events here. This replaces a previous
      // platform-wide INSERT subscription on `messages` that invalidated
      // every session's unread count whenever any user sent any message.
      const channel = supabase
        .channel(`unread-messages-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversation_participants',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: [UNREAD_QUERY_KEY, 'messages'] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: [UNREAD_QUERY_KEY, 'notifications'] });
          }
        )
        .subscribe();

      entry = { channel, refs: 0 };
      channelRegistry.set(registryKey, entry);
    }

    entry.refs += 1;

    return () => {
      const e = channelRegistry.get(registryKey);
      if (e) {
        e.refs -= 1;
        if (e.refs <= 0) {
          supabase.removeChannel(e.channel);
          channelRegistry.delete(registryKey);
        }
      }
    };
  }, [user?.id, queryClient]);

  return {
    messages: { unreadCount: messagesQuery.data || 0 },
    notifications: { unreadCount: notificationsQuery.data || 0 },
    isLoading: messagesQuery.isLoading || notificationsQuery.isLoading,
  };
}
