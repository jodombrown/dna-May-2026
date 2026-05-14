import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOwnManifest, useManifestMutations } from '@/hooks/contribute/useManifest';
import { useStanceMutations } from '@/hooks/contribute/useStances';
import { HeadlineEditor } from './HeadlineEditor';
import { CurrencyStanceCard } from './CurrencyStanceCard';
import { CurrencyStanceForm } from './CurrencyStanceForm';
import { CapitalComingSoonCard } from './CapitalComingSoonCard';
import { ManifestPublishGate } from './ManifestPublishGate';
import { trackContributeEvent } from '@/lib/contributeAnalytics';
import {
  MANIFEST_STANCE_CAP,
  MANIFEST_STANCE_SOFT_WARN,
  type CurrencyStance,
  type StanceFormValues,
} from '@/types/contribute';

export function ManifestEditor() {
  const navigate = useNavigate();
  const { data, isLoading } = useOwnManifest();
  const { updateHeadline, publish, unpublish } = useManifestMutations();
  const { createStance, updateStance, archiveStance } = useStanceMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CurrencyStance | null>(null);

  useEffect(() => {
    if (data) {
      trackContributeEvent({
        type: 'manifest_editor_opened',
        has_existing_manifest: data.stances.length > 0 || !!data.manifest.headline,
      });
    }
  }, [data]);

  const activeStances = useMemo(
    () => (data?.stances ?? []).filter((s) => !s.isArchived),
    [data?.stances],
  );

  const handleHeadlineSave = (value: string) => {
    if (!data) return;
    updateHeadline.mutate(
      { manifestId: data.manifest.id, headline: value },
      {
        onError: () => toast.error('Could not save headline. Try again in a moment.'),
      },
    );
  };

  const openNewStance = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmitStance = async (values: StanceFormValues) => {
    if (!data) return;
    try {
      if (editing) {
        await updateStance.mutateAsync({
          stanceId: editing.id,
          values: {
            title: values.title,
            description: values.description,
            tags: values.tags,
            availability: values.availability,
            visibility: values.visibility,
          },
        });
        trackContributeEvent({
          type: 'stance_updated',
          stance_id: editing.id,
          currency: editing.currency,
        });
        toast.success('Stance updated.');
      } else {
        await createStance.mutateAsync({
          values,
          manifestId: data.manifest.id,
          displayOrder: activeStances.length,
        });
        trackContributeEvent({
          type: 'stance_created',
          currency: values.currency,
        });
        toast.success('Stance added.');
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save stance.';
      toast.error(msg);
    }
  };

  const handleArchive = async (stance: CurrencyStance) => {
    try {
      await archiveStance.mutateAsync(stance.id);
      trackContributeEvent({
        type: 'stance_archived',
        stance_id: stance.id,
        currency: stance.currency,
      });
      toast.success('Stance archived.');
    } catch {
      toast.error('Could not archive stance.');
    }
  };

  const handlePublish = async () => {
    try {
      await publish.mutateAsync();
      trackContributeEvent({
        type: 'manifest_published',
        stance_count: activeStances.length,
        currencies: activeStances.map((s) => s.currency),
      });
      toast.success('Your Manifest is live. The diaspora can see how you show up.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not publish.';
      toast.error(msg);
    }
  };

  const handleUnpublish = async () => {
    if (!data) return;
    try {
      await unpublish.mutateAsync(data.manifest.id);
      trackContributeEvent({
        type: 'manifest_unpublished',
        stance_count: activeStances.length,
      });
      toast.success('Manifest unpublished.');
    } catch {
      toast.error('Could not unpublish.');
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-muted-foreground">
        Loading your Manifest...
      </div>
    );
  }

  const atCap = activeStances.length >= MANIFEST_STANCE_CAP;
  const showSoftWarn = activeStances.length >= MANIFEST_STANCE_SOFT_WARN;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-serif font-medium">Your Manifest</h1>
          <Badge variant="outline" className="mt-1 text-[10px]">
            {data.manifest.isPublished ? 'Published' : 'Draft - not visible to others'}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Close editor"
          onClick={() => navigate('/dna/contribute')}
          className="h-11 w-11"
        >
          <X className="h-5 w-5" />
        </Button>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6">
        <HeadlineEditor
          manifestId={data.manifest.id}
          initialValue={data.manifest.headline}
          onSave={handleHeadlineSave}
        />

        <section aria-labelledby="stance-list-heading" className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 id="stance-list-heading" className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Your stances
            </h2>
            <span className="text-xs text-muted-foreground">
              {activeStances.length} / {MANIFEST_STANCE_CAP}
            </span>
          </div>

          {activeStances.length === 0 && (
            <p className="text-sm text-muted-foreground py-4">
              Add a stance for each way you show up - expertise you offer, networks you can open, or resources you can share.
            </p>
          )}

          {activeStances.map((stance) => (
            <CurrencyStanceCard
              key={stance.id}
              stance={stance}
              variant="editor"
              onEdit={(s) => {
                setEditing(s);
                setFormOpen(true);
              }}
              onArchive={handleArchive}
            />
          ))}

          {showSoftWarn && (
            <p className="text-xs text-muted-foreground italic">
              Manifests stay legible when focused. Consider archiving older stances before adding new ones.
            </p>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={openNewStance}
            disabled={atCap}
          >
            <Plus className="h-4 w-4 mr-1.5" aria-hidden="true" />
            {atCap ? 'Stance limit reached' : 'Add a stance'}
          </Button>

          <CapitalComingSoonCard surface="editor" />
        </section>
      </main>

      <ManifestPublishGate
        manifest={data.manifest}
        activeStances={activeStances}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        busy={publish.isPending || unpublish.isPending}
      />

      <CurrencyStanceForm
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        editing={editing}
        onSubmit={handleSubmitStance}
        submitting={createStance.isPending || updateStance.isPending}
      />
    </div>
  );
}

export default ManifestEditor;
