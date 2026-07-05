import { useState, useEffect, useCallback } from 'react';

export interface UserStats {
  total: number;
  new_today: number;
  new_this_week: number;
  new_this_month: number;
  dau: number;
  wau: number;
  mau: number;
}

export interface ConnectionStats {
  total: number;
  pending: number;
  new_this_week: number;
}

export interface EventStats {
  total: number;
  upcoming: number;
  this_week: number;
}

export interface ContentStats {
  total_posts: number;
  posts_this_week: number;
}

export interface FeedbackStats {
  total: number;
  pending: number;
  unresolved: number;
}

export interface ModerationStats {
  pending_flags: number;
  resolved_this_week: number;
}

export interface AdminDashboardStats {
  users: UserStats;
  connections: ConnectionStats;
  events: EventStats;
  content: ContentStats;
  feedback: FeedbackStats;
  moderation: ModerationStats;
  generated_at: string;
}

export interface UserGrowthDataPoint {
  date: string;
  new_users: number;
  cumulative_users: number;
}

export interface UserSegment {
  segment: string;
  count: number;
  percentage: number;
}

interface UseAdminStatsReturn {
  stats: AdminDashboardStats | null;
  userGrowth: UserGrowthDataPoint[];
  userSegments: UserSegment[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refetchGrowth: (days?: number) => Promise<void>;
  refetchSegments: () => Promise<void>;
}

export const useAdminStats = (): UseAdminStatsReturn => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthDataPoint[]>([]);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // v0.0: no platform-wide analytics RPC is provisioned. get_admin_dashboard_stats,
  // get_user_growth_data, and get_user_segments_distribution were never built — the
  // real metrics source is owned by a dedicated admin analytics cycle (Arc 5). The
  // fetch bodies below are short-circuited so we never call an absent RPC; the admin
  // overview renders a deferred-state notice instead of zero-state cards.
  const fetchStats = useCallback(async () => {
    // no-op until the analytics layer is built (Arc 5)
    return;
  }, []);

  const fetchGrowth = useCallback(async (_days: number = 30) => {
    // no-op until the analytics layer is built (Arc 5)
    return;
  }, []);

  const fetchSegments = useCallback(async () => {
    // no-op until the analytics layer is built (Arc 5)
    return;
  }, []);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchStats(), fetchGrowth(), fetchSegments()]);
    setIsLoading(false);
  }, [fetchStats, fetchGrowth, fetchSegments]);

  useEffect(() => {
    refetch();

    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      fetchStats();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetch, fetchStats]);

  return {
    stats,
    userGrowth,
    userSegments,
    isLoading,
    error,
    refetch,
    refetchGrowth: fetchGrowth,
    refetchSegments: fetchSegments
  };
};

export default useAdminStats;
