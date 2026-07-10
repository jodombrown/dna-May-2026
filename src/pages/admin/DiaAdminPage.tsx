import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Users, Search, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { MateMasie } from '@/components/icons/adinkra';

interface DailyStat {
  date: string;
  total_queries: number;
  cache_hits: number;
  cache_misses: number;
  cache_hit_rate: number;
  avg_response_time_ms: number;
  unique_users: number;
}

interface PopularQuery {
  query_text: string;
  query_count: number;
  unique_users: number;
  last_queried: string;
}

interface CostData {
  date: string;
  queries: number;
  total_tokens: number;
  total_cost: number;
  avg_cost_per_query: number;
}

export default function DiaAdminPage() {
  // Check if user is admin
  const { data: isAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ['check-admin'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      // Check if user has admin role via user_roles table
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id) as any;

      const roles = (userRoles || []).map((r: any) => r.role);
      return roles.includes('admin');
    },
  });

  // Daily stats - use dia_daily_stats table (legacy name)
  const { data: dailyStats, isLoading: loadingStats } = useQuery({
    queryKey: ['dia-admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dia_daily_stats')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (error) throw error;
      return data as DailyStat[];
    },
    enabled: isAdmin === true,
  });

  // Popular queries - use dia_popular_queries table (legacy name)
  const { data: popularQueries, isLoading: loadingPopular } = useQuery({
    queryKey: ['dia-popular-queries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dia_popular_queries')
        .select('*')
        .limit(10);

      if (error) throw error;
      return data as PopularQuery[];
    },
    enabled: isAdmin === true,
  });

  // Cost tracking - use dia_cost_tracking table (legacy name)
  const { data: costData, isLoading: loadingCost } = useQuery({
    queryKey: ['dia-cost-tracking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dia_cost_tracking')
        .select('*')
        .order('date', { ascending: false })
        .limit(7);

      if (error) throw error;
      return (data || []) as unknown as CostData[];
    },
    enabled: isAdmin === true,
  });

  // Summary stats
  const todayStats = dailyStats?.[0];
  const weeklyQueries = dailyStats?.reduce((sum, d) => sum + d.total_queries, 0) || 0;
  const weeklyUsers = dailyStats?.reduce((sum, d) => sum + d.unique_users, 0) || 0;
  const weeklyCost = costData?.reduce((sum, d) => sum + (d.total_cost || 0), 0) || 0;
  const avgCacheHitRate = dailyStats?.length
    ? dailyStats.reduce((sum, d) => sum + (d.cache_hit_rate || 0), 0) / dailyStats.length
    : 0;

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 pb-20 sm:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 sm:p-3 rounded-lg bg-emerald-500/10">
          <MateMasie className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">DIA Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground hidden sm:block">Monitor usage, costs, and performance</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">This Week</p>
                <p className="text-xl sm:text-2xl font-bold">{weeklyQueries}</p>
                <p className="text-xs text-muted-foreground hidden sm:block">total queries</p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-blue-500/10">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">{weeklyUsers}</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
              <div className="p-3 rounded-full bg-green-500/10">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                <p className="text-2xl font-bold">{avgCacheHitRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">avg this week</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500/10">
                <MateMasie className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Est. Cost</p>
                <p className="text-2xl font-bold">${weeklyCost.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">this week</p>
              </div>
              <div className="p-3 rounded-full bg-emerald-500/10">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Stats Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : dailyStats && dailyStats.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Queries</th>
                      <th className="text-right py-2">Users</th>
                      <th className="text-right py-2">Cache %</th>
                      <th className="text-right py-2">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyStats.map((stat) => (
                      <tr key={stat.date} className="border-b border-muted">
                        <td className="py-2">{format(new Date(stat.date), 'MMM d')}</td>
                        <td className="text-right py-2">{stat.total_queries}</td>
                        <td className="text-right py-2">{stat.unique_users}</td>
                        <td className="text-right py-2">
                          <Badge variant={stat.cache_hit_rate > 40 ? 'default' : 'secondary'}>
                            {stat.cache_hit_rate?.toFixed(0)}%
                          </Badge>
                        </td>
                        <td className="text-right py-2">{stat.avg_response_time_ms}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No data available</p>
            )}
          </CardContent>
        </Card>

        {/* Popular Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Popular Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPopular ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : popularQueries && popularQueries.length > 0 ? (
              <div className="space-y-3">
                {popularQueries.map((query, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{query.query_text}</p>
                      <p className="text-xs text-muted-foreground">
                        {query.unique_users} users
                      </p>
                    </div>
                    <Badge variant="secondary">{query.query_count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No queries yet</p>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCost ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : costData && costData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Date</th>
                      <th className="text-right py-2">Queries</th>
                      <th className="text-right py-2">Tokens</th>
                      <th className="text-right py-2">Total Cost</th>
                      <th className="text-right py-2">Avg/Query</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costData.map((cost) => (
                      <tr key={cost.date} className="border-b border-muted">
                        <td className="py-2">{format(new Date(cost.date), 'MMM d')}</td>
                        <td className="text-right py-2">{cost.queries}</td>
                        <td className="text-right py-2">{cost.total_tokens?.toLocaleString()}</td>
                        <td className="text-right py-2">${cost.total_cost?.toFixed(4)}</td>
                        <td className="text-right py-2">${cost.avg_cost_per_query?.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No cost data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}