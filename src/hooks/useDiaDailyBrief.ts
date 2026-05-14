/**
 * useDiaDailyBrief — DIA's three personal cards for the right rail.
 */
import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { DiaBriefCard, BriefInteractionType, CModule, BriefSignalType } from '@/types/right-rail';

interface RpcRow {
  id: string;
  position: number;
  c_module: string;
  signal_type: string;
  title: string;
  body: string;
  cta_label: string;
  cta_route: string;
  target_entity_type: string | null;
  target_entity_id: string | null;
  reasoning: string;
  is_fallback: boolean;
}

export function useDiaDailyBrief() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['dia-daily-brief', user?.id ?? null],
    enabled: !!user?.id,
    queryFn: async (): Promise<DiaBriefCard[]> => {
      const { data, error } = await supabase.rpc('get_dia_daily_brief', { p_user_id: user!.id });
      if (error) throw error;
      return ((data ?? []) as RpcRow[]).map((r) => ({
        id: r.id,
        position: (r.position as 1 | 2 | 3),
        c_module: r.c_module as CModule,
        signal_type: r.signal_type as BriefSignalType,
        title: r.title,
        body: r.body,
        cta_label: r.cta_label,
        cta_route: r.cta_route,
        target_entity_type: r.target_entity_type,
        target_entity_id: r.target_entity_id,
        reasoning: r.reasoning,
        is_fallback: r.is_fallback,
      }));
    },
    staleTime: 5 * 60_000,
  });

  // Refresh brief on broadcast (server-side dia-brief channel if/when emitted)
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`dia-brief-${user.id}`)
      .on('broadcast', { event: 'brief_refresh' }, () => {
        qc.invalidateQueries({ queryKey: ['dia-daily-brief', user.id] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, user?.id]);

  return query;
}

export function useRecordBriefInteraction() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ cardId, type }: { cardId: string; type: BriefInteractionType }) => {
      const { data, error } = await supabase.rpc('record_brief_interaction', {
        p_card_id: cardId,
        p_interaction_type: type,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_d, vars) => {
      if (vars.type === 'dismissed' || vars.type === 'not_interested') {
        qc.setQueryData<DiaBriefCard[] | undefined>(['dia-daily-brief', user?.id ?? null], (prev) =>
          prev?.filter((c) => c.id !== vars.cardId)
        );
      }
    },
  });
}
