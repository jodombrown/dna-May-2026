import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { History, Search, Clock, ArrowRight, Loader2, Archive, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MateMasie } from '@/components/icons/adinkra';
import { toast } from 'sonner';

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
  archived_at: string | null;
}

export function DiaHistory({
  compact = false,
  limit = 20,
  onQueryClick,
}: DiaHistoryProps) {
  const qc = useQueryClient();

  const { data: queries, isLoading, error } = useQuery({
    queryKey: ['dia-history', limit],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      // Purge archived entries older than 14 days (best-effort).
      (supabase as any).rpc('purge_expired_dia_history').then(() => {});

      const { data, error } = await (supabase
        .from('dia_query_log' as any)
        .select('id, query_text, cache_hit, response_time_ms, source, created_at, archived_at')
        .eq('user_id', session.user.id)
        .is('archived_at', null)
        .order('created_at', { ascending: false })
        .limit(limit) as any);

      if (error) throw error;
      return (data || []) as QueryLogEntry[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['dia-history'] });

  const handleArchive = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await (supabase
      .from('dia_query_log' as any)
      .update({ archived_at: new Date().toISOString() })
      .eq('id', id) as any);
    if (error) {
      toast.error('Could not archive');
      return;
    }
    toast.success('Archived (kept for 14 days)');
    invalidate();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const { error } = await (supabase.from('dia_query_log' as any).delete().eq('id', id) as any);
    if (error) {
      toast.error('Could not delete');
      return;
    }
    toast.success('Deleted');
    invalidate();
  };

  const handleClearAll = async () => {
    if (!confirm('Delete all DIA history? This cannot be undone.')) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { error } = await (supabase
      .from('dia_query_log' as any)
      .delete()
      .eq('user_id', session.user.id) as any);
    if (error) {
      toast.error('Could not clear history');
      return;
    }
    toast.success('History cleared');
    invalidate();
  };

  // Deduplicate queries (show unique queries only)
  const uniqueQueries = React.useMemo(() => {
    if (!queries) return [];
    const seen = new Set<string>();
    return queries.filter((q) => {
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
            onClick={() => onQueryClick?.(entry.query_text)}
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {uniqueQueries.length} unique
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClearAll}
          >
            Clear all
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {uniqueQueries.map((entry) => (
          <Card
            key={entry.id}
            className="cursor-pointer hover:border-emerald-500/50 transition-colors group"
            onClick={() => onQueryClick?.(entry.query_text)}
          >
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {entry.query_text}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-muted-foreground">
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
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={(e) => handleArchive(e, entry.id)}
                    aria-label="Archive"
                    title="Archive (kept 14 days)"
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={(e) => handleDelete(e, entry.id)}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-[10px] text-center text-muted-foreground/70 pt-2">
        Archived items are automatically removed after 14 days.
      </p>
    </div>
  );
}

export default DiaHistory;
