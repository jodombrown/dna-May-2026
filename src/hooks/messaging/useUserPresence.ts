import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  acquirePresence,
  getPresenceState,
  subscribePresenceListener,
} from './presenceChannel';

interface PresenceData {
  online: boolean;
  lastSeenAt: string | null;
  showPresence: boolean;
}

/**
 * Live presence + last_seen for a single user.
 *
 * Online state is read from the shared `presence:global` channel via the
 * singleton in `presenceChannel.ts` (so we never double-subscribe even when
 * dozens of conversation rows mount this hook simultaneously).
 *
 * Last-seen + privacy preference come from the profiles table.
 */
export function useUserPresence(userId: string | null | undefined): PresenceData {
  const { user: authUser } = useAuth();
  const [online, setOnline] = useState(false);

  const { data } = useQuery({
    queryKey: ['profile-presence', userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('last_seen_at, show_presence')
        .eq('id', userId)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!userId) return;

    // Acquire the singleton channel (subscribe happens at most once globally).
    // We key by the AUTH user so we participate in our own presence; the
    // observed userId is just what we look up in presenceState().
    const presenceKey = authUser?.id ?? userId;
    const { release } = acquirePresence(presenceKey);

    const recompute = () => {
      const state = getPresenceState();
      setOnline(Boolean(state[userId]?.length));
    };
    recompute();

    const unsubscribe = subscribePresenceListener(recompute);

    return () => {
      unsubscribe();
      release();
    };
  }, [userId, authUser?.id]);

  return {
    online: !!(data?.show_presence && online),
    lastSeenAt: data?.show_presence ? (data?.last_seen_at ?? null) : null,
    showPresence: !!data?.show_presence,
  };
}
