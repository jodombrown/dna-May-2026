/**
 * useTrendingInDna — new get_trending_hashtags signature (p_time_range).
 * Returns { hashtag, post_count, unique_authors, is_followed }.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TrendingHashtag } from '@/types/right-rail';

interface NewTrendingRow {
  hashtag: string;
  post_count: number;
  unique_authors: number;
  is_followed: boolean;
}

export function useTrendingInDna(timeRange: '24h' | '7d' | '30d' = '24h', limit = 8) {
  return useQuery({
    queryKey: ['trending-in-dna', timeRange, limit],
    queryFn: async (): Promise<TrendingHashtag[]> => {
      const fetchFor = async (range: '24h' | '7d' | '30d') => {
        const { data, error } = await supabase.rpc('get_trending_hashtags', {
          p_limit: limit,
          p_time_range: range,
        });
        if (error) throw error;
        return ((data ?? []) as unknown as NewTrendingRow[]).map((r) => ({
          hashtag: r.hashtag,
          post_count: r.post_count,
          unique_authors: r.unique_authors,
          is_followed: r.is_followed,
        }));
      };
      let rows = await fetchFor(timeRange);
      // Fallback: expand to 30d window if current range is empty.
      if (rows.length === 0 && timeRange !== '30d') {
        rows = await fetchFor('30d');
      }
      return rows;
    },
    staleTime: 60_000,
    refetchInterval: 2 * 60_000,
  });
}

export function useToggleTrendFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (hashtag: string) => {
      const { data, error } = await supabase.rpc('toggle_trend_follow', { p_hashtag: hashtag });
      if (error) throw error;
      return { hashtag, isFollowed: data as boolean };
    },
    onMutate: async (hashtag) => {
      // Optimistic: flip is_followed for matching tag in any cached query
      const queries = qc.getQueriesData<TrendingHashtag[]>({ queryKey: ['trending-in-dna'] });
      queries.forEach(([key, value]) => {
        if (!value) return;
        qc.setQueryData<TrendingHashtag[]>(key, value.map((t) =>
          t.hashtag === hashtag ? { ...t, is_followed: !t.is_followed } : t
        ));
      });
    },
    onError: (_e, hashtag) => {
      // Revert on error
      const queries = qc.getQueriesData<TrendingHashtag[]>({ queryKey: ['trending-in-dna'] });
      queries.forEach(([key, value]) => {
        if (!value) return;
        qc.setQueryData<TrendingHashtag[]>(key, value.map((t) =>
          t.hashtag === hashtag ? { ...t, is_followed: !t.is_followed } : t
        ));
      });
    },
  });
}
