import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Search, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MateMasie } from '@/components/icons/adinkra';

interface DiaHistoryProps {
  compact?: boolean;
  limit?: number;
  onQueryClick?: (query: string) => void;
}

interface QueryLogEntry {
  id: string;
  query_text: string;
  cache_hit: boolean;
  response_time_ms: number;
  source: string;
  created_at: string;
}

export function DiaHistory({
  compact = false,
  limit = 10,
  onQueryClick
}: DiaHistoryProps) {
  const { data: queries, isLoading, error } = useQuery({
    queryKey: ['dia-history', limit],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Type assertion needed as dia_query_log table was added after types generation
      const { data, error } = await (supabase
        .from('dia_query_log' as any)
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(limit) as any);

      if (error) throw error;
      return (data || []) as QueryLogEntry[];
    },
  });

  const handleQueryClick = (query: string) => {
    if (onQueryClick) {
      onQueryClick(query);
    }
  };

  // Deduplicate queries (show unique queries only)
  const uniqueQueries = React.useMemo(() => {
    if (!queries) return [];
    const seen = new Set<string>();
    return queries.filter(q => {
      const normalized = q.query_text.toLowerCase().trim();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [queries]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Failed to load history</p>
      </div>
    );
  }

  if (!uniqueQueries || uniqueQueries.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground mb-1">No search history yet</p>
        <p className="text-sm text-muted-foreground/70">
          Your DIA queries will appear here
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {uniqueQueries.slice(0, 5).map((entry) => (
          <button
            key={entry.id}
            onClick={() => handleQueryClick(entry.query_text)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left group min-h-[56px]"
          >
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate group-hover:text-emerald-600 transition-colors">
                {entry.query_text}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}

        {uniqueQueries.length > 5 && (
          <p className="text-xs text-center text-muted-foreground pt-2">
            +{uniqueQueries.length - 5} more queries
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          Recent Searches
        </h3>
        <span className="text-sm text-muted-foreground">
          {uniqueQueries.length} unique queries
        </span>
      </div>

      <div className="space-y-2">
        {uniqueQueries.map((entry) => (
          <Card
            key={entry.id}
            className="cursor-pointer hover:border-emerald-500/50 transition-colors group"
            onClick={() => handleQueryClick(entry.query_text)}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm sm:text-base group-hover:text-emerald-600 transition-colors line-clamp-2 sm:line-clamp-none">
                    {entry.query_text}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                    </span>
                    {entry.cache_hit && (
                      <span className="flex items-center gap-1 text-emerald-600">
                        <MateMasie className="h-3 w-3" />
                        Cached
                      </span>
                    )}
                    <span className="hidden sm:inline">{entry.response_time_ms}ms</span>
                    <span className="capitalize hidden sm:inline">{entry.source}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Search className="h-4 w-4 mr-1" />
                  Re-run
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DiaHistory;
