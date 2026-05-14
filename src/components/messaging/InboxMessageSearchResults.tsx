import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchInboxMessages, type InboxSearchHit } from '@/services/inboxSearchService';
import { Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  query: string;
  onPick?: () => void;
}

/**
 * Tier 3: global inbox message search results.
 * Renders only when `query` is at least 2 chars; debounces requests.
 */
export function InboxMessageSearchResults({ query, onPick }: Props) {
  const [hits, setHits] = useState<InboxSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setError(null);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await searchInboxMessages(q, 20);
        setHits(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  if (query.trim().length < 2) return null;

  return (
    <div className="border-t border-border/60 bg-muted/30">
      <div className="px-4 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
        <MessageSquare className="h-3.5 w-3.5" />
        Messages
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>
      {error && <div className="px-4 pb-2 text-xs text-destructive">{error}</div>}
      {!loading && hits.length === 0 && !error && (
        <div className="px-4 pb-3 text-xs text-muted-foreground">No message matches.</div>
      )}
      <ul className="max-h-64 overflow-y-auto">
        {hits.map((h) => (
          <li key={h.message_id}>
            <button
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-accent/50 focus:bg-accent/50 focus:outline-none"
              onClick={() => {
                onPick?.();
                if (h.is_group) {
                  navigate(`/dna/messages/group/${h.conversation_id}`);
                } else {
                  navigate(`/dna/messages?thread=${h.conversation_id}`);
                }
              }}
            >
              <div className="text-sm line-clamp-2">{h.snippet}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}
                {h.is_group ? ' · group' : ''}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
