import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logDiaMessagingEvent } from '@/services/diaMessagingTelemetry';

export interface DiaMessagingPrefs {
  smartRepliesEnabled: boolean;
  summariesEnabled: boolean;
}

const DEFAULTS: DiaMessagingPrefs = {
  smartRepliesEnabled: true,
  summariesEnabled: true,
};

/**
 * Phase 13 - per-user toggles for DIA messaging surfaces.
 * Reads from `dia_messaging_prefs`; falls back to defaults when no row exists.
 */
export function useDiaMessagingPrefs() {
  const qc = useQueryClient();

  const query = useQuery<DiaMessagingPrefs>({
    queryKey: ['dia-messaging-prefs'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return DEFAULTS;
      const { data, error } = await supabase
        .from('dia_messaging_prefs')
        .select('smart_replies_enabled, summaries_enabled')
        .eq('user_id', uid)
        .maybeSingle();
      if (error || !data) return DEFAULTS;
      return {
        smartRepliesEnabled: data.smart_replies_enabled,
        summariesEnabled: data.summaries_enabled,
      };
    },
  });

  const update = useMutation({
    mutationFn: async (next: Partial<DiaMessagingPrefs>) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error('Not signed in');
      const merged = { ...(query.data ?? DEFAULTS), ...next };
      const { error } = await supabase
        .from('dia_messaging_prefs')
        .upsert({
          user_id: uid,
          smart_replies_enabled: merged.smartRepliesEnabled,
          summaries_enabled: merged.summariesEnabled,
        });
      if (error) throw error;
      return merged;
    },
    onSuccess: (merged) => {
      qc.setQueryData(['dia-messaging-prefs'], merged);
      logDiaMessagingEvent({
        conversationId: 'global',
        eventType: 'prefs_changed',
        metadata: { ...merged },
      });
    },
  });

  return {
    prefs: query.data ?? DEFAULTS,
    isLoading: query.isLoading,
    update,
  };
}
