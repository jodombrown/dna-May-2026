/**
 * useFiveCsPulse — drives the Five C's Pulse Compass.
 * Calls the get_five_cs_pulse RPC and refreshes on activity_events realtime broadcasts.
 */
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PulseSlice, PulseTimeRange, PulseScope, CModule, PulseBreakdownItem } from '@/types/right-rail';

export function useFiveCsPulse(timeRange: PulseTimeRange = '24h', scope: PulseScope = 'platform') {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['five-cs-pulse', timeRange, scope, user?.id ?? null],
    queryFn: async (): Promise<PulseSlice[]> => {
      const { data, error } = await supabase.rpc('get_five_cs_pulse', {
        p_time_range: timeRange,
        p_scope: scope,
        p_user_id: scope === 'user' ? user?.id ?? undefined : undefined,
      });
      if (error) throw error;
      return ((data ?? []) as PulseSlice[]);
    },
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel(`pulse-activity-${scope}-${timeRange}`)
      .on('broadcast', { event: 'activity_event' }, () => {
        qc.invalidateQueries({ queryKey: ['five-cs-pulse', timeRange, scope] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, scope, timeRange]);

  return query;
}

export interface UserPulseTotals {
  first: number;
  second: number;
}

export function useUserPulseTotals(cModule: CModule | null, enabled: boolean) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-pulse-totals', cModule, user?.id ?? null],
    enabled: enabled && !!cModule && !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<UserPulseTotals> => {
      if (!cModule || !user?.id) return { first: 0, second: 0 };
      const uid = user.id;
      const safe = (n: number | null | undefined) => n ?? 0;

      switch (cModule) {
        case 'connect': {
          const [{ count: accepted }, { count: pending }] = await Promise.all([
            supabase
              .from('connections')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'accepted')
              .or(`requester_id.eq.${uid},recipient_id.eq.${uid}`),
            supabase
              .from('connections')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending')
              .or(`requester_id.eq.${uid},recipient_id.eq.${uid}`),
          ]);
          return { first: safe(accepted), second: safe(pending) };
        }
        case 'convene': {
          const [{ count: created }, { count: rsvps }] = await Promise.all([
            supabase.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', uid),
            supabase
              .from('event_attendees')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', uid)
              .eq('status', 'going'),
          ]);
          return { first: safe(created), second: safe(rsvps) };
        }
        case 'collaborate': {
          const [{ count: spaces }, { count: tasks }] = await Promise.all([
            supabase
              .from('space_members')
              .select('space_id', { count: 'exact', head: true })
              .eq('user_id', uid),
            supabase
              .from('space_tasks')
              .select('id', { count: 'exact', head: true })
              .eq('assignee_id', uid),
          ]);
          return { first: safe(spaces), second: safe(tasks) };
        }
        case 'contribute': {
          const [{ count: needs }, { count: offers }] = await Promise.all([
            supabase
              .from('contribution_needs')
              .select('id', { count: 'exact', head: true })
              .eq('created_by', uid),
            supabase
              .from('contribution_offers')
              .select('id', { count: 'exact', head: true })
              .eq('created_by', uid),
          ]);
          return { first: safe(needs), second: safe(offers) };
        }
        case 'convey': {
          const { count: posts } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('author_id', uid)
            .eq('is_deleted', false);
          let engagements = 0;
          const { data: postIds } = await supabase
            .from('posts')
            .select('id')
            .eq('author_id', uid)
            .eq('is_deleted', false)
            .limit(1000);
          const ids = (postIds ?? []).map((p) => p.id);
          if (ids.length > 0) {
            const { count } = await supabase
              .from('post_likes')
              .select('id', { count: 'exact', head: true })
              .in('post_id', ids);
            engagements = safe(count);
          }
          return { first: safe(posts), second: engagements };
        }
        default:
          return { first: 0, second: 0 };
      }
    },
  });
}

export function usePulseBreakdown(cModule: CModule | null, timeRange: PulseTimeRange = '24h', scope: PulseScope = 'platform') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pulse-breakdown', cModule, timeRange, scope, user?.id ?? null],
    enabled: !!cModule,
    queryFn: async (): Promise<PulseBreakdownItem[]> => {
      if (!cModule) return [];
      const { data, error } = await supabase.rpc('get_pulse_breakdown', {
        p_c_module: cModule,
        p_time_range: timeRange,
        p_scope: scope,
        p_user_id: scope === 'user' ? user?.id ?? undefined : undefined,
      });
      if (error) throw error;
      return (data ?? []) as PulseBreakdownItem[];
    },
    staleTime: 60_000,
  });
}
