import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface BadgePayload {
  badge_name?: string;
  badge_key?: string;
  description?: string;
}

interface NotificationRow {
  user_id?: string;
  type?: string;
  payload?: BadgePayload | null;
}

export default function BadgeToastListener() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Realtime postgres_changes only supports a single filter per
    // subscription, so scope to the current user via user_id (the
    // critical privacy boundary) and check the notification type
    // client-side. Previously this listener filtered on
    // type=eq.badge_awarded, which fired toasts for every user
    // platform-wide whenever anyone earned a badge.
    const ch = supabase
      .channel(`badge-toasts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (p) => {
          const row = p.new as NotificationRow;
          if (row?.type !== 'badge_awarded') return;
          const b = row.payload ?? {};
          toast.success(`🎉 Badge earned: ${b.badge_name ?? b.badge_key ?? ''}`, {
            description: b.description ?? 'Great work!',
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  return null;
}
