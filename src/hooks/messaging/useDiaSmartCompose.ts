import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SmartComposeResult {
  suggestions: string[];
  basedOnUserId: string | null;
}

/**
 * Phase 19 - DIA Smart Compose openers for a brand-new 1:1 thread.
 * Cached per (otherUserId). Only runs when explicitly enabled (zero history).
 */
export function useDiaSmartCompose(otherUserId: string | null, enabled: boolean) {
  return useQuery<SmartComposeResult>({
    queryKey: ['dia-smart-compose', otherUserId],
    enabled: enabled && !!otherUserId,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<SmartComposeResult>(
        'dia-smart-compose',
        { body: { otherUserId } },
      );
      if (error) throw error;
      return data ?? { suggestions: [], basedOnUserId: null };
    },
  });
}
