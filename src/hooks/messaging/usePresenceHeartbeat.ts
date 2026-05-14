import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { acquirePresence } from './presenceChannel';

/**
 * Heartbeat presence: tracks the current user on the shared `presence:global`
 * channel and refreshes profiles.last_seen_at periodically + on visibility change.
 *
 * Mount once near the app root for authenticated users.
 */
export function usePresenceHeartbeat() {
  const { user } = useAuth();
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    if (!user?.id) return;

    const { channel, release } = acquirePresence(user.id);

    const ping = async () => {
      const now = Date.now();
      if (now - lastPingRef.current < 60_000) return; // throttle: 60s
      lastPingRef.current = now;
      await supabase.rpc('update_presence');
    };

    // Initial ping shortly after mount; the singleton handles subscribe+track
    void ping();

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void channel.track({ online_at: new Date().toISOString() });
        void ping();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    const interval = window.setInterval(ping, 5 * 60_000); // 5 min refresh

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
      release();
    };
  }, [user?.id]);
}
