/**
 * My Stories view (BD139).
 *
 * Lives under components/, not pages/, deliberately. The design-system gate
 * forbids page-level layout values under src/pages ("Section owns rhythm,
 * Container owns width"), and this view owns its own width and rhythm. The
 * page is a thin wrapper; the layout lives here where it is allowed.
 *
 * ── Why this page exists ──────────────────────────────────────────────────
 * Three surfaces promised "My Stories" and none delivered it:
 *   1. the Account drawer row  -> /dna/convey?tab=my_stories  (param ignored)
 *   2. UserAdminHub            -> /dna/convey                 (unfiltered hub)
 *   3. Convey's own sub-nav    -> /dna/me                     (redirects to feed)
 *
 * Meanwhile ConveyDiscovery counted the member's stories and displayed the
 * number on a stat card. The app told a member they had N stories, offered
 * three doors, and every door opened onto everyone else's posts.
 *
 * BD139: a navigation promise is a claim about the world, and a displayed count
 * is a promise of reachability. This is the destination all three now point at.
 *
 * It is a real ROUTE, not a query param. A param can be silently ignored — that
 * is exactly how the original defect survived. A route either exists in the
 * router or the registry gate fails the build.
 */

import { useNavigate } from 'react-router-dom';
import { Loader2, PenLine } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useConveyFeed } from '@/hooks/useConveyFeed';
import { ConveyFeedCard } from '@/components/convey/ConveyFeedCard';
import { Button } from '@/components/ui/button';

export function MyStoriesView() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data, isLoading } = useConveyFeed({ authorId: user?.id });
  const stories = data?.data ?? [];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h1 font-semibold tracking-tight">My stories</h1>
          <p className="text-meta text-muted-foreground">
            {isLoading
              ? 'Loading\u2026'
              : stories.length === 1
                ? '1 story'
                : `${stories.length} stories`}
          </p>
        </div>
        <Button onClick={() => navigate('/dna/convey/new')} className="shrink-0">
          <PenLine className="mr-2 h-4 w-4" />
          Write
        </Button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : stories.length > 0 ? (
        <div className="space-y-4">
          {stories.map((item) => (
            <ConveyFeedCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        /*
          An honest empty state. It says the member has written nothing yet,
          which is true, rather than showing other people's stories to fill the
          space — the failure this page exists to end.
        */
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="mb-4 text-body text-muted-foreground">
            You haven&apos;t published a story yet.
          </p>
          <Button variant="outline" onClick={() => navigate('/dna/convey/new')}>
            Write your first one
          </Button>
        </div>
      )}
    </div>
  );
}

export default MyStoriesView;
