import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { HubType, HubData } from '@/types/hub.types';

interface UseHubDataOptions {
  hubType: HubType;
  hubSlug: string;
  userId?: string | null;
  feeds?: {
    connect?: { limit: number };
    convene?: { limit: number };
    collaborate?: { limit: number };
    contribute?: { limit: number };
    convey?: { limit: number };
  };
}

export function useHubData({ hubType, hubSlug, userId, feeds }: UseHubDataOptions) {
  return useQuery({
    queryKey: ['hub', hubType, hubSlug, userId],
    queryFn: async (): Promise<HubData> => {
      const { data, error } = await supabase.functions.invoke('dia-hub-intelligence', {
        body: {
          hub_type: hubType,
          hub_slug: hubSlug,
          user_id: userId || null,
          feeds: feeds || {
            connect: { limit: 6 },
            convene: { limit: 4 },
            collaborate: { limit: 4 },
            contribute: { limit: 4 },
            convey: { limit: 4 }
          },
          include_metrics: true,
          include_metadata: true
        }
      });

      if (error) throw error;
      return data as HubData;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });
}

export default useHubData;
