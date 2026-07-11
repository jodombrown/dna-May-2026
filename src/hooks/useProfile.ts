/**
 * useProfile - Current User's Own Profile
 *
 * Use this hook to get the authenticated user's own profile data.
 * Includes realtime subscription for automatic updates.
 *
 * For viewing OTHER users' profiles, use useProfileV2 instead.
 */

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { profilesService } from '@/services/profilesService';
import { getPrimaryOriginCode } from '@/lib/memberHeritage';
import { STALE_TIMES } from '@/lib/queryClient';


interface ProfileChannelEntry {
  channel: RealtimeChannel;
  refs: number;
}

const profileChannelRegistry = new Map<string, ProfileChannelEntry>();

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;
    const uid = user.id;

    let entry = profileChannelRegistry.get(uid);
    if (!entry) {
      const channel = supabase
        .channel(`realtime:profiles:self:${uid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${uid}` }, () => {
          queryClient.invalidateQueries({ queryKey: ['profile', uid] });
        })
        .subscribe();

      entry = { channel, refs: 0 };
      profileChannelRegistry.set(uid, entry);
    }

    entry.refs += 1;

    return () => {
      const e = profileChannelRegistry.get(uid);
      if (e) {
        e.refs -= 1;
        if (e.refs <= 0) {
          supabase.removeChannel(e.channel);
          profileChannelRegistry.delete(uid);
        }
      }
    };
  }, [user?.id, queryClient]);
  
  return useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const data = await profilesService.getCurrentUserProfile(user.id);
        if (!data) return data;

        // BD038: primary origin country moved off `profiles` onto
        // `member_heritage`. Hydrate it back onto the profile object
        // so downstream consumers (profile completion scorer, feature
        // gates, cards) see a single, consistent shape.
        try {
          const origin = await getPrimaryOriginCode(user.id);
          return { ...data, primary_origin_country: origin ?? null } as typeof data;
        } catch {
          return { ...data, primary_origin_country: null } as typeof data;
        }
      } catch (error) {
        throw error;
      }
    },

    enabled: !!user?.id,
    staleTime: STALE_TIMES.profile,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
};