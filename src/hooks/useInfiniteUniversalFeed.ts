/**
 * DNA | FEED v1.2 - Infinite Scroll Hook
 * 
 * Cursor-based infinite loading for the Universal Feed.
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UniversalFeedItem, FeedFilters } from '@/types/feed';
import { logHighError } from '@/lib/errorLogger';
import { mapFeedRow, type FeedRpcRow } from '@/lib/feed/mapFeedRow';
import { STALE_TIMES } from '@/lib/queryClient';

/**
 * IMPORTANT: tabs differ ONLY by `tab` and `rankingMode` parameters passed
 * to the RPC. Never apply tab-specific reordering, mapping, or shape
 * overrides on the client. The shared `mapFeedRow` mapper guarantees that
 * the same post renders identically on All / For You / Mine / etc.
 */

const PAGE_SIZE = 20;

/** RPC parameters for get_universal_feed */
interface UniversalFeedRpcParams {
  p_viewer_id: string;
  p_tab: string;
  p_author_id: string | null;
  p_space_id: string | null;
  p_event_id: string | null;
  p_limit: number;
  p_offset: number;
  p_ranking_mode: string;
  p_hashtag: string | null;
}

// Raw row shape lives in src/lib/feed/mapFeedRow.ts (FeedRpcRow).

export const useInfiniteUniversalFeed = (filters: Omit<FeedFilters, 'limit' | 'offset'>) => {
  const {
    data, 
    isLoading, 
    error, 
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch 
  } = useInfiniteQuery({
    queryKey: ['universal-feed-infinite', filters],
    queryFn: async ({ pageParam }) => {
      try {
        const offset = typeof pageParam === 'number' ? pageParam : 0;
        // Build RPC params - DO NOT include p_post_type as it doesn't exist in the DB function
        const params: UniversalFeedRpcParams = {
          p_viewer_id: filters.viewerId,
          p_tab: filters.tab || 'all',
          p_author_id: filters.authorId || null,
          p_space_id: filters.spaceId || null,
          p_event_id: filters.eventId || null,
          p_limit: PAGE_SIZE,
          p_offset: offset,
          p_ranking_mode: filters.rankingMode || 'latest',
          p_hashtag: filters.hashtag || null,
        };

        // Call RPC - spread params to match function signature
        const { data, error } = await supabase.rpc('get_universal_feed', { ...params });

        if (error) {
          logHighError(error, 'feed', 'get_universal_feed RPC failed', { filters });
          throw error;
        }
        
        // Map RPC response through the canonical mapper so every tab
        // produces an identically-shaped UniversalFeedItem.
        const rawRows = (data || []) as FeedRpcRow[];
        const items: UniversalFeedItem[] = rawRows.map(mapFeedRow);

        return items;
      } catch (error) {
        logHighError(error, 'feed', 'Universal feed infinite query failed', { filters });
        throw error;
      }
    },
    getNextPageParam: (lastPage: UniversalFeedItem[], allPages: UniversalFeedItem[][]) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    initialPageParam: 0 as number,
    enabled: !!filters.viewerId,
    staleTime: STALE_TIMES.feed,
  });

  // PERFORMANCE: Removed aggressive realtime subscriptions that were causing
  // excessive refetches. Feed updates are now handled through:
  // 1. Manual refetch when user creates content
  // 2. Pull-to-refresh on mobile
  // 3. Periodic stale time expiration (STALE_TIMES.feed — 2 minutes)
  // This significantly reduces database load and improves responsiveness.

  // Flatten pages into single array, then apply client-side postType filter.
  // Filtering happens after flattening so per-page length reflects the true
  // DB page size (critical for pagination offsets to stay aligned).
  const flattened = data?.pages.flatMap((page) => page) || [];

  // For You: hide the viewer's own posts. Mine and All are unaffected.
  const tabFiltered =
    filters.tab === 'for_you'
      ? flattened.filter((item) => item.author_id !== filters.viewerId)
      : flattened;

  const feedItems = filters.postType
    ? tabFiltered.filter((item) => item.post_type?.toLowerCase() === filters.postType.toLowerCase())
    : tabFiltered;

  return {
    feedItems,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage: hasNextPage ?? false,
    isFetchingNextPage,
    refetch,
  };
};
