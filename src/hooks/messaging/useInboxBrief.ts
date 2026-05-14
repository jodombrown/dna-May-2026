import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface InboxBriefHighlight {
  threadId: string;
  threadType: 'direct' | 'group';
  title: string;
  oneLiner: string;
  suggestion: string;
}

export interface InboxBriefPayload {
  generatedAt: string;
  basedOnThreadIds: string[];
  headline: string;
  narrative: string;
  highlights: InboxBriefHighlight[];
  totalUnread: number;
  unreadThreadCount: number;
}

/**
 * Phase 16 - DIA cross-thread inbox brief.
 * Generates a short narrative across the user's most active unread threads.
 * Lazy: only runs when `enabled` is true (typically when the digest sheet opens
 * or the morning brief banner mounts).
 */
export function useInboxBrief(enabled: boolean) {
  const { user } = useAuth();
  return useQuery<InboxBriefPayload>({
    queryKey: ['inbox-brief', user?.id],
    enabled: enabled && !!user?.id,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<InboxBriefPayload>(
        'dia-inbox-brief',
        { body: {} },
      );
      if (error) throw error;
      if (!data) throw new Error('Empty inbox brief response');
      return data;
    },
  });
}
