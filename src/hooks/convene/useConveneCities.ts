/**
 * DNA | CONVENE — City hooks for location-aware discovery
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** Time scope for the city list — mirrors the browse-layer filters. */
export type ConveneCityScope = 'upcoming' | 'past' | 'all' | 'watching';

/**
 * Fetch distinct cities that have events in the given time scope.
 *
 * 'upcoming' includes undated events (date_confirmed false / NULL
 * start_time): an unannounced date is still ahead of us, and those events
 * are shown on the discovery surface, so their cities belong in the picker.
 * A bare .gte('start_time', now) silently drops them, because NULL fails
 * every comparison.
 */
export function useConveneCities(scope: ConveneCityScope = 'upcoming') {
  return useQuery({
    queryKey: ['convene-distinct-cities', scope],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select('location_city, location_country')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .not('location_city', 'is', null);

      const now = new Date().toISOString();
      if (scope === 'upcoming') {
        query = query.or(
          `start_time.gte.${now},start_time.is.null,date_confirmed.eq.false`,
        );
      } else if (scope === 'past') {
        query = query.lt('end_time', now);
      } else if (scope === 'watching') {
        query = query.or('start_time.is.null,date_confirmed.eq.false');
      }
      // 'all' — no time constraint

      const { data, error } = await query;

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
