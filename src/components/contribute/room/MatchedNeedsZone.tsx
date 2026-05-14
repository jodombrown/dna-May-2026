import { useMemo, useState } from 'react';
import { MatchedNeedCard } from './MatchedNeedCard';
import { CurationDrawer } from './CurationDrawer';
import type { RoomCuration, RoomSubjectProfile } from '@/types/contribute';

interface MatchedNeedsZoneProps {
  curations: RoomCuration[];
  subjects: Record<string, RoomSubjectProfile>;
  onDismiss: (curationId: string) => void;
}

const INITIAL_CAP = 5;

/**
 * "Active Needs that fit you" zone. Renders curations with
 * kind = 'their_need_my_stance' - the discovery surface for Needs the
 * diaspora has posted where one of your stances applies.
 *
 * Naming note: this is intentionally NOT the existing profile NeedsRenderer
 * (which renders the profile owner's own Needs).
 */
export function MatchedNeedsZone({ curations, subjects, onDismiss }: MatchedNeedsZoneProps) {
  const [expanded, setExpanded] = useState(false);
  const [openCurationId, setOpenCurationId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...curations].sort((a, b) => b.score - a.score),
    [curations],
  );

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_CAP);
  const hidden = sorted.length - INITIAL_CAP;
  const openCuration = sorted.find((c) => c.curationId === openCurationId) ?? null;

  if (sorted.length === 0) {
    return (
      <section aria-label="Active Needs that fit you" className="space-y-3">
        <Header />
        <p className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          No matching Needs in your room today. Check back tomorrow.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Active Needs that fit you" className="space-y-3">
      <Header />
      <div className="space-y-3">
        {visible.map((c) => (
          <MatchedNeedCard
            key={c.curationId}
            curation={c}
            subject={subjects[c.subjectUserId] ?? null}
            onOpenDrawer={() => setOpenCurationId(c.curationId)}
            onDismiss={() => onDismiss(c.curationId)}
          />
        ))}
      </div>
      {!expanded && hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm font-medium text-foreground/80 underline-offset-4 hover:underline"
        >
          See {hidden} more
        </button>
      )}
      <CurationDrawer
        open={!!openCuration}
        onOpenChange={(o) => !o && setOpenCurationId(null)}
        curation={openCuration}
        subject={openCuration ? subjects[openCuration.subjectUserId] ?? null : null}
        onDismiss={onDismiss}
      />
    </section>
  );
}

function Header() {
  return (
    <header>
      <h3 className="font-serif text-lg text-foreground">Active Needs that fit you</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Needs the diaspora has posted where one of your stances applies.
      </p>
    </header>
  );
}
