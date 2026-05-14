import { useMemo, useState } from 'react';
import { RecognitionCard } from './RecognitionCard';
import { CurationDrawer } from './CurationDrawer';
import type { RoomCuration, RoomSubjectProfile } from '@/types/contribute';

interface PeopleZoneProps {
  curations: RoomCuration[];
  subjects: Record<string, RoomSubjectProfile>;
  onDismiss: (curationId: string) => void;
}

const INITIAL_CAP = 5;

/**
 * "People to recognize today" zone. Renders person-kind curations
 * (their_stance_my_need, mutual, tag_affinity). Mutuals always sort first.
 */
export function PeopleZone({ curations, subjects, onDismiss }: PeopleZoneProps) {
  const [expanded, setExpanded] = useState(false);
  const [openCurationId, setOpenCurationId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const order: Record<RoomCuration['kind'], number> = {
      mutual: 0,
      their_stance_my_need: 1,
      their_need_my_stance: 2,
      tag_affinity: 3,
    };
    return [...curations].sort((a, b) => {
      const ko = order[a.kind] - order[b.kind];
      if (ko !== 0) return ko;
      return b.score - a.score;
    });
  }, [curations]);

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_CAP);
  const hidden = sorted.length - INITIAL_CAP;
  const openCuration = sorted.find((c) => c.curationId === openCurationId) ?? null;

  if (sorted.length === 0) {
    return (
      <section aria-label="People to recognize today" className="space-y-3">
        <Header />
        <p className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          No new people in your room today. The next curation refresh is tomorrow.
        </p>
      </section>
    );
  }

  return (
    <section aria-label="People to recognize today" className="space-y-3">
      <Header />
      <div className="space-y-3">
        {visible.map((c) => (
          <RecognitionCard
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
      <h3 className="font-serif text-lg text-foreground">People to recognize today</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Manifests where someone offers what you're seeking, or seeks what you offer.
      </p>
    </header>
  );
}
