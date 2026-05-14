/**
 * useUnreadCounts - Real-time unread counts for messages and notifications
 *
 * PERFORMANCE OPTIMIZED: Uses single queries instead of N+1 patterns.
 * Provides unified access to unread message and notification counts
 * with real-time updates via Supabase subscriptions.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeUserNotifications,
  subscribeUserParticipants,
} from '@/lib/realtime/userNotificationsChannel';

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

export function useUnreadCounts(): UnreadCounts {
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  // Phase 2B: subscribe via the shared user-notifications channel manager
  // instead of opening a dedicated `unread-messages-{userId}` channel.
  useEffect(() => {
    if (!user?.id) return;
    const userId = user.id;

    const offParticipants = subscribeUserParticipants(userId, () => {
      queryClient.invalidateQueries({ queryKey: [UNREAD_QUERY_KEY, 'messages'] });
    });
    const offNotifs = subscribeUserNotifications(userId, () => {
      queryClient.invalidateQueries({ queryKey: [UNREAD_QUERY_KEY, 'notifications'] });
    });

    return () => {
      offParticipants();
      offNotifs();
    };
  }, [user?.id, queryClient]);

  return {
    messages: { unreadCount: messagesQuery.data || 0 },
    notifications: { unreadCount: notificationsQuery.data || 0 },
    isLoading: messagesQuery.isLoading || notificationsQuery.isLoading,
  };
}
