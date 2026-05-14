import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { subscribeUserNotifications } from '@/lib/realtime/userNotificationsChannel';

interface BadgePayload {
  badge_name?: string;
  badge_key?: string;
  description?: string;
}

export default function BadgeToastListener() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Phase 2B: piggyback on the shared user-notifications channel rather
    // than opening a dedicated `badge-toasts-{userId}` channel.
    return subscribeUserNotifications(user.id, (e) => {
      if (e.eventType !== 'INSERT') return;
      const row = e.new;
      if (row?.type !== 'badge_awarded') return;
      const b = (row.payload ?? {}) as BadgePayload;
      toast.success(`🎉 Badge earned: ${b.badge_name ?? b.badge_key ?? ''}`, {
        description: b.description ?? 'Great work!',
        duration: 5000,
      });
    });
  }, [user?.id]);

  return null;
}
