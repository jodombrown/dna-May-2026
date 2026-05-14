import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ThreadActionItem {
  title: string;
  kind: 'task' | 'event' | 'note';
  context: string;
  sourceMessageId?: string;
}

export interface ThreadSummary {
  generatedAt: string;
  basedOnMessageId: string;
  headline: string;
  bullets: string[];
  openQuestions: string[];
  actionItems: ThreadActionItem[];
}

interface SummaryArgs {
  conversationId: string;
  force?: boolean;
  sinceMessageId?: string | null;
  audienceName?: string | null;
}

const fetchSummary = async (args: SummaryArgs): Promise<ThreadSummary> => {
  const { data, error } = await supabase.functions.invoke<ThreadSummary>('dia-thread-summary', {
    body: {
      conversationId: args.conversationId,
      force: !!args.force,
      sinceMessageId: args.sinceMessageId ?? null,
      audienceName: args.audienceName ?? null,
    },
  });
  if (error) throw error;
  if (!data) throw new Error('Empty summary response');
  return data;
};

export interface UseThreadSummaryOptions {
  sinceMessageId?: string | null;
  audienceName?: string | null;
}

const REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Phase 12.2 / 14 - Catch-me-up summary, fetched on demand only.
 * Cached server-side keyed by last_summarised_message_id (when sinceMessageId is null).
 * Manual refresh is throttled client-side to once per 5 minutes per conversation.
 */
export function useThreadSummary(
  conversationId: string,
  enabled: boolean,
  opts: UseThreadSummaryOptions = {},
) {
  const queryClient = useQueryClient();
  const { sinceMessageId = null, audienceName = null } = opts;
  const key = ['dia-thread-summary', conversationId, sinceMessageId];

  const query = useQuery<ThreadSummary>({
    queryKey: key,
    enabled: enabled && !!conversationId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
    queryFn: () =>
      fetchSummary({ conversationId, force: false, sinceMessageId, audienceName }),
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const storageKey = `dia:summary-refresh:${conversationId}`;
      try {
        const last = Number(sessionStorage.getItem(storageKey) ?? 0);
        if (last && Date.now() - last < REFRESH_MIN_INTERVAL_MS) {
          const remainingMs = REFRESH_MIN_INTERVAL_MS - (Date.now() - last);
          throw new Error(
            `Please wait ${Math.ceil(remainingMs / 60000)} more minute${remainingMs > 60000 ? 's' : ''} before refreshing.`,
          );
        }
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('Please wait')) throw e;
      }
      const data = await fetchSummary({
        conversationId,
        force: true,
        sinceMessageId,
        audienceName,
      });
      try {
        sessionStorage.setItem(`dia:summary-refresh:${conversationId}`, String(Date.now()));
      } catch {
        // sessionStorage unavailable - ignore
      }
      return data;
    },
    onSuccess: (data) => queryClient.setQueryData(key, data),
  });

  return { ...query, refresh };
}
