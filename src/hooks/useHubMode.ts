// src/hooks/useHubMode.ts
// Hook for determining hub display mode based on content availability
// Supports URL parameter override: ?view=hub or ?view=aspiration

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type HubType = 'convene' | 'collaborate' | 'contribute' | 'convey';
export type HubMode = 'aspiration' | 'discovery' | 'hybrid';

interface HubModeConfig {
  threshold: number;
  countQuery: () => Promise<number>;
}

// Safe count query wrapper to prevent crashes on mobile
const safeCountQuery = async (queryFn: () => Promise<{ count: number | null; error: unknown }>): Promise<number> => {
  try {
    const result = await queryFn();
    if (result.error) {
      logger.warn('useHubMode', 'Query error, defaulting to 0', result.error);
      return 0;
    }
    return result.count || 0;
  } catch (error) {
    logger.warn('useHubMode', 'Failed to fetch count, defaulting to 0', error);
    return 0;
  }
};

const HUB_CONFIGS: Record<HubType, HubModeConfig> = {
  convene: {
    threshold: 3,
    countQuery: async () => safeCountQuery(async () => {
      const { count, error } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('start_time', new Date().toISOString());
      return { count, error };
    })
  },
  collaborate: {
    threshold: 5,
    countQuery: async () => safeCountQuery(async () => {
      const { count, error } = await supabase
        .from('spaces')
        .select('id', { count: 'exact', head: true })
        .eq('visibility', 'public')
        .eq('status', 'active');
      return { count, error };
    })
  },
  contribute: {
    threshold: 10,
    countQuery: async () => safeCountQuery(async () => {
      const { count, error } = await supabase
        .from('contribution_needs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['open', 'in_progress']);
      return { count, error };
    })
  },
  convey: {
    threshold: 10,
    countQuery: async () => safeCountQuery(async () => {
      const { count, error } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('is_deleted', false)
        .in('post_type', ['story', 'update', 'impact']);
      return { count, error };
    })
  }
};

export interface UseHubModeResult {
  mode: HubMode;
  contentCount: number;
  threshold: number;
  isLoading: boolean;
  progress: number; // 0-100 percentage toward threshold
}

export function useHubMode(hub: HubType): UseHubModeResult {
  const [searchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const config = HUB_CONFIGS[hub];

  const { data: contentCount = 0, isLoading, error } = useQuery({
    queryKey: ['hubMode', hub],
    queryFn: config.countQuery,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Retry twice on failure
    retryDelay: 1000, // 1 second delay between retries
  });

  // If query failed, log but don't crash - default to aspiration mode
  if (error) {
    logger.warn('useHubMode', `Error fetching ${hub} mode, defaulting to aspiration`, error);
  }

  // URL parameter override: ?view=hub forces discovery, ?view=aspiration forces aspiration
  let mode: HubMode;
  if (viewParam === 'hub') {
    mode = 'discovery';
  } else if (viewParam === 'aspiration') {
    mode = 'aspiration';
  } else if (contentCount >= config.threshold) {
    mode = 'discovery';
  } else if (contentCount > 0) {
    mode = 'hybrid';
  } else {
    mode = 'aspiration';
  }

  const progress = Math.min(100, Math.round((contentCount / config.threshold) * 100));

  return {
    mode,
    contentCount,
    threshold: config.threshold,
    isLoading,
    progress
  };
}

// Utility to get hub display name
export function getHubDisplayName(hub: HubType): string {
  const names: Record<HubType, string> = {
    convene: 'Convene',
    collaborate: 'Collaborate',
    contribute: 'Contribute',
    convey: 'Convey'
  };
  return names[hub];
}
