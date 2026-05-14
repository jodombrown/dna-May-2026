/**
 * DNA | useUnifiedNotifications Hook — Sprint 4C
 *
 * Primary hook for the unified notification system. Merges platform
 * notifications (Supabase) with DIA nudge notifications (localStorage)
 * into a single, filterable stream.
 *
 * Features:
 * - Unified notification list with All/Activity/DIA filtering
 * - Unread count across both sources
 * - Mark as read / acted / dismissed
 * - Polling for updates (60s interval)
 * - Real-time subscription for platform notifications
 * - Time grouping (Just now, Today, Yesterday, This week, Earlier)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  unifiedNotificationService,
  type UnifiedNotification,
  type UnifiedNotificationFilter,
} from '@/services/unifiedNotificationService';

// ============================================================
// QUERY KEYS
// ============================================================

const QK_UNIFIED_NOTIFICATIONS = 'unified-notifications';
const QK_UNIFIED_UNREAD = 'unified-notifications-unread';

// ============================================================
// TIME GROUPING
// ============================================================

export interface NotificationTimeGroup {
  label: string;
  notifications: UnifiedNotification[];
}

function getTimeGroupLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  const diffHours = diffMinutes / 60;
  const diffDays = diffHours / 24;

  if (diffMinutes < 5) return 'Just now';
  if (diffHours < 24 && date.getDate() === now.getDate()) return 'Today';
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 7) return 'This week';
  return 'Earlier';
}

function groupByTime(
  notifications: UnifiedNotification[]
): NotificationTimeGroup[] {
  const groups = new Map<string, UnifiedNotification[]>();
  const order = ['Just now', 'Today', 'Yesterday', 'This week', 'Earlier'];

  for (const notif of notifications) {
    const label = getTimeGroupLabel(notif.createdAt);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(notif);
  }

  return order
    .filter(label => groups.has(label))
    .map(label => ({ label, notifications: groups.get(label)! }));
}

// ============================================================
// MAIN HOOK
// ============================================================

export function useUnifiedNotifications(
  initialFilter: UnifiedNotificationFilter = 'all'
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<UnifiedNotificationFilter>(initialFilter);

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: [QK_UNIFIED_NOTIFICATIONS, user?.id, filter],
    queryFn: async () => {
      if (!user) return [];
      return unifiedNotificationService.getNotifications(user.id, filter, {
        limit: 50,
      });
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchInterval: 60000,
  });

  // Fetch unread count
  const unreadQuery = useQuery({
    queryKey: [QK_UNIFIED_UNREAD, user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, platform: 0, dia: 0 };
      return unifiedNotificationService.getUnreadCount(user.id);
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Real-time subscription for platform notifications
  useEffect(() => {
    if (!user?.id) return;

    const instanceId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const channelName = `unified_notifs_${user.id}_${instanceId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: [QK_UNIFIED_NOTIFICATIONS],
          });
          queryClient.invalidateQueries({ queryKey: [QK_UNIFIED_UNREAD] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Grouped notifications
  const groupedNotifications = useMemo(() => {
    return groupByTime(notificationsQuery.data || []);
  }, [notificationsQuery.data]);

  // Invalidate helper
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [QK_UNIFIED_NOTIFICATIONS] });
    queryClient.invalidateQueries({ queryKey: [QK_UNIFIED_UNREAD] });
    // Also invalidate legacy queries for badge consistency
    queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  // Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notification: UnifiedNotification) => {
      if (!user) return;
      await unifiedNotificationService.markAsRead(user.id, notification);
    },
    onSuccess: () => invalidateAll(),
  });

  // Mark as acted
  const markAsActedMutation = useMutation({
    mutationFn: async (notification: UnifiedNotification) => {
      if (!user) return;
      await unifiedNotificationService.markAsActed(user.id, notification);
    },
    onSuccess: () => invalidateAll(),
  });

  // Dismiss
  const dismissMutation = useMutation({
    mutationFn: async (notification: UnifiedNotification) => {
      if (!user) return;
      await unifiedNotificationService.dismiss(user.id, notification);
    },
    onSuccess: () => invalidateAll(),
  });

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await unifiedNotificationService.markAllPlatformAsRead(user.id);
      // Mark all DIA nudges as seen
      const notifications = notificationsQuery.data || [];
      for (const notif of notifications) {
        if (notif.type === 'dia' && notif.diaNudgeId && !notif.isRead) {
          unifiedNotificationService.markDiaAsRead(notif.diaNudgeId);
        }
      }
    },
    onSuccess: () => invalidateAll(),
  });

  return {
    // Data
    notifications: notificationsQuery.data || [],
    groupedNotifications,
    unreadCount: unreadQuery.data?.total || 0,
    unreadPlatformCount: unreadQuery.data?.platform || 0,
    unreadDiaCount: unreadQuery.data?.dia || 0,
    isLoading: notificationsQuery.isLoading,

    // Filter
    filter,
    setFilter,

    // Mutations
    markAsRead: markAsReadMutation.mutate,
    markAsActed: markAsActedMutation.mutate,
    dismiss: dismissMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,

    // Refresh
    refetch: notificationsQuery.refetch,
  };
}

// ============================================================
// LIGHTWEIGHT UNREAD COUNT HOOK (for bell icon)
// ============================================================

export function useUnifiedNotificationCount() {
  const { user } = useAuth();

  const unreadQuery = useQuery({
    queryKey: [QK_UNIFIED_UNREAD, user?.id],
    queryFn: async () => {
      if (!user) return { total: 0, platform: 0, dia: 0 };
      return unifiedNotificationService.getUnreadCount(user.id);
    },
    enabled: !!user,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  return {
    unreadCount: unreadQuery.data?.total || 0,
    platformCount: unreadQuery.data?.platform || 0,
    diaCount: unreadQuery.data?.dia || 0,
    isLoading: unreadQuery.isLoading,
  };
}
