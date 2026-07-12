/**
 * DNA | CONVENE — City hooks for location-aware discovery
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Fetch distinct cities that have upcoming events */
export function useConveneCities() {
  return useQuery({
    queryKey: ['convene-distinct-cities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('location_city, location_country')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .not('location_city', 'is', null)
        .gte('start_time', new Date().toISOString());

      if (error || !data) return [];

      // Aggregate distinct cities with counts
      const cityMap = new Map<string, { city: string; country: string | null; count: number }>();
      for (const row of data) {
        const city = row.location_city;
        if (!city) continue;
        const key = city.toLowerCase();
        const existing = cityMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityMap.set(key, { city, country: row.location_country, count: 1 });
        }
      }

      return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
    },
    staleTime: 120_000,
  });
}

/** Fetch the user's current city from their profile */
export function useUserCity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-current-city', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('current_city, current_country')
        .eq('id', user.id)
        .maybeSingle();
      return data ? { city: data.current_city, country: data.current_country } : null;
    },
    enabled: !!user?.id,
    staleTime: 300_000,
  });
}
