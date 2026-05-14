import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDailyPulse, type DailyPulsePayload } from './useDailyPulse';

export interface DailyPulseHighlight {
  module: 'convene' | 'collaborate' | 'contribute';
  refId: string;
  oneLiner: string;
  suggestion?: string;
}

export interface DailyPulseBrief {
  headline: string;
  narrative: string;
  highlights: DailyPulseHighlight[];
}

interface UseDailyPulseBriefResult {
  pulse: DailyPulsePayload | undefined;
  brief: DailyPulseBrief | undefined;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Phase 18 - Combined hook returning the raw cross-module pulse and the
 * DIA-narrated daily brief. Brief generation is throttled to 30 minutes.
 */
export function useDailyPulseBrief(enabled: boolean): UseDailyPulseBriefResult {
  const { user } = useAuth();
  const { data: pulse, isLoading: pulseLoading, isError: pulseError } =
    useDailyPulse(enabled);

  const totalItems =
    (pulse?.events.length ?? 0) +
    (pulse?.tasks.length ?? 0) +
    (pulse?.needs.length ?? 0);

  const briefQuery = useQuery<DailyPulseBrief>({
    queryKey: ['daily-pulse-brief', user?.id, totalItems],
    enabled: enabled && !!user?.id && !!pulse,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      if (!pulse) throw new Error('no pulse');
      const { data, error } = await supabase.functions.invoke(
        'dia-daily-pulse',
        {
          body: {
            events: pulse.events.map((e) => ({
              id: e.id,
              title: e.title,
              startsAt: e.startsAt,
            })),
            tasks: pulse.tasks.map((t) => ({
              id: t.id,
              title: t.title,
              spaceTitle: t.spaceTitle,
              dueDate: t.dueDate,
              isStalled: t.isStalled,
              isOverdue: t.isOverdue,
            })),
            needs: pulse.needs.map((n) => ({
              id: n.id,
              title: n.title,
              spaceTitle: n.spaceTitle,
              type: n.type,
              priority: n.priority,
            })),
          },
        },
      );
      if (error) throw error;
      return data as DailyPulseBrief;
    },
  });

  return {
    pulse,
    brief: briefQuery.data,
    isLoading: pulseLoading || briefQuery.isLoading,
    isError: pulseError || briefQuery.isError,
  };
}
