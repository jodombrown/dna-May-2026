import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useOwnManifest } from '@/hooks/contribute/useManifest';
import { useOwnNeeds, useNeedMutations } from '@/hooks/contribute/useNeeds';
import { trackContributeEvent } from '@/lib/contributeAnalytics';
import {
  NEED_ACTIVE_CAP,
  NEED_ACTIVE_SOFT_WARN,
  type NeedDeclaration,
  type NeedFormValues,
} from '@/types/contribute';
import { NeedCard } from './NeedCard';
import { NeedComposer } from './NeedComposer';

const ACTIVE_STATUSES: NeedDeclaration['status'][] = ['draft', 'open', 'matched'];

interface NeedEditorProps {
  /** Increment to programmatically open the composer (e.g., from a parent header). */
  externalOpenSignal?: number;
}

export function NeedEditor({ externalOpenSignal }: NeedEditorProps = {}) {
  const { toast } = useToast();
  const { data: manifestData } = useOwnManifest();
  const { data: needs = [], isLoading } = useOwnNeeds();
  const { createNeed, updateNeed, publishNeed, closeNeed, deleteNeed } = useNeedMutations();

  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<NeedDeclaration | null>(null);

  const ownStances = manifestData?.stances ?? [];
  const activeCount = useMemo(
    () => needs.filter((n) => ACTIVE_STATUSES.includes(n.status)).length,
    [needs],
  );
  const atCap = activeCount >= NEED_ACTIVE_CAP;
  const showSoftWarn = activeCount >= NEED_ACTIVE_SOFT_WARN && !atCap;

  const openCreate = () => {
    if (atCap) {
      trackContributeEvent({ type: 'need_cap_blocked', active_count: activeCount });
      toast({
        title: 'Need cap reached',
        description: `Close one of your ${NEED_ACTIVE_CAP} active Needs before adding another.`,
        variant: 'destructive',
      });
      return;
    }
    if (showSoftWarn) {
      trackContributeEvent({ type: 'need_cap_warning_shown', active_count: activeCount });
    }
    setEditing(null);
    setComposerOpen(true);
    trackContributeEvent({ type: 'need_composer_opened', mode: 'create' });
  };

  useEffect(() => {
    if (externalOpenSignal === undefined) return;
    if (externalOpenSignal <= 0) return;
    openCreate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpenSignal]);

  const openEdit = (need: NeedDeclaration) => {
    setEditing(need);
    setComposerOpen(true);
    trackContributeEvent({ type: 'need_composer_opened', mode: 'edit' });
  };

  const handleSubmit = async (values: NeedFormValues) => {
    try {
      if (editing) {
        await updateNeed.mutateAsync({
          needId: editing.id,
          patch: {
            title: values.title,
            context: values.context,
            scope: values.scope,
            relatedStanceId: values.relatedStanceId,
            tags: values.tags,
            visibility: values.visibility,
            startsAt: values.startsAt,
            endsAt: values.endsAt,
          },
        });
        toast({ title: 'Need updated' });
      } else {
        await createNeed.mutateAsync(values);
        trackContributeEvent({ type: 'need_created', currency: values.currency });
        toast({ title: 'Draft saved', description: 'Publish when you are ready to share it.' });
      }
      setComposerOpen(false);
      setEditing(null);
    } catch (err) {
      toast({
        title: 'Could not save Need',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePublish = async (need: NeedDeclaration) => {
    try {
      await publishNeed.mutateAsync(need.id);
      trackContributeEvent({ type: 'need_published', currency: need.currency });
      toast({ title: 'Need published' });
    } catch (err) {
      toast({
        title: 'Could not publish',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleClose = async (need: NeedDeclaration) => {
    try {
      await closeNeed.mutateAsync(need.id);
      trackContributeEvent({ type: 'need_closed', need_id: need.id });
      toast({ title: 'Need closed' });
    } catch (err) {
      toast({
        title: 'Could not close',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (need: NeedDeclaration) => {
    try {
      await deleteNeed.mutateAsync(need.id);
      trackContributeEvent({ type: 'need_deleted', need_id: need.id });
      toast({ title: 'Draft deleted' });
    } catch (err) {
      toast({
        title: 'Could not delete',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">Your Needs</h2>
          <p className="text-sm text-muted-foreground">
            What you are building and what you are seeking. Symmetric peer to your Manifest.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-9 shrink-0"
          onClick={openCreate}
          style={{ background: '#4A8D77', color: 'white' }}
        >
          <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
          New Need
        </Button>
      </header>

      {showSoftWarn && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          You have {activeCount} of {NEED_ACTIVE_CAP} active Needs. Close ones that are no longer current to keep your signal sharp.
        </div>
      )}
      {atCap && (
        <div className="text-xs text-stone-700 bg-stone-100 border border-stone-200 rounded-md px-3 py-2">
          You are at the {NEED_ACTIVE_CAP}-Need cap. Close one to declare another.
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your Needs...</p>
      ) : needs.length === 0 ? (
        <div className="bg-card border rounded-lg p-5 text-center">
          <p className="text-sm text-foreground/90 mb-3">
            You have not declared a Need yet. Tell the diaspora what you are building.
          </p>
          <Button
            type="button"
            onClick={openCreate}
            style={{ background: '#4A8D77', color: 'white' }}
          >
            Declare your first Need
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {needs.map((n) => (
            <NeedCard
              key={n.id}
              need={n}
              variant="editor"
              onEdit={openEdit}
              onPublish={handlePublish}
              onClose={handleClose}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <NeedComposer
        open={composerOpen}
        onOpenChange={(o) => {
          setComposerOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        ownStances={ownStances}
        onSubmit={handleSubmit}
        submitting={createNeed.isPending || updateNeed.isPending}
      />
    </section>
  );
}

export default NeedEditor;
