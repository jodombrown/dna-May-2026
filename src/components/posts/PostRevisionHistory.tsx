/**
 * PostRevisionHistory — author-only revision viewer (BD160).
 *
 * Opens the append-only `post_revisions` history for a post. RLS restricts
 * that table to the author (and admins), so a non-author who somehow reaches
 * this dialog simply gets zero rows — the wall is the database, not this view.
 *
 * Read-only. There is NO restore action in this phase, and prior content is
 * shown ONLY here, to the author, never to other viewers (matches BD162: an
 * edited-away public line is not re-exposed to strangers).
 */

import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { logHighError } from '@/lib/errorLogger';
import { toast } from '@/hooks/use-toast';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
} from '@/components/ui/responsive-modal';

interface PostRevisionHistoryProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PostRevision {
  revision_number: number;
  changed_keys: string[] | null;
  prior: Record<string, unknown> | null;
  created_at: string;
}

/** The prior content value, when this revision changed the body. */
const priorContent = (prior: Record<string, unknown> | null): string | null => {
  const value = prior?.content;
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
};

export function PostRevisionHistory({ postId, open, onOpenChange }: PostRevisionHistoryProps) {
  const { data: revisions = [], isLoading } = useQuery({
    queryKey: ['post-revisions', postId],
    // Only fetch once the author actually opens the history.
    enabled: open && !!postId,
    queryFn: async (): Promise<PostRevision[]> => {
      const { data, error } = await (supabase
        .from('post_revisions' as any)
        .select('revision_number, changed_keys, prior, created_at')
        .eq('post_id', postId)
        .order('revision_number', { ascending: false }) as any);

      if (error) {
        logHighError(error, 'database', 'Failed to load post revisions', { postId });
        toast({ variant: 'destructive', description: 'Could not load edit history.' });
        return [];
      }
      return (data ?? []) as PostRevision[];
    },
  });

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalHeader>
        <ResponsiveModalTitle>Edit history</ResponsiveModalTitle>
        <ResponsiveModalDescription>
          Only you can see the earlier versions of this post.
        </ResponsiveModalDescription>
      </ResponsiveModalHeader>

      <div className="max-h-96 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <p className="text-body text-muted-foreground">Loading…</p>
        ) : revisions.length === 0 ? (
          <p className="text-body text-muted-foreground">No earlier versions to show.</p>
        ) : (
          <ul className="space-y-4">
            {revisions.map((rev) => {
              const prior = priorContent(rev.prior);
              return (
                <li key={rev.revision_number} className="border-b pb-4 last:border-b-0">
                  <p className="text-meta font-medium text-muted-foreground">
                    Revision {rev.revision_number}
                    {' · '}
                    {formatDistanceToNow(new Date(rev.created_at), { addSuffix: true })}
                  </p>
                  {prior ? (
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-body text-foreground">
                      {prior}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-body italic text-muted-foreground">
                      No previous text recorded for this change.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </ResponsiveModal>
  );
}
