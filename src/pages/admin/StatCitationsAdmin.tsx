import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Save, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAllStatCitations, type StatCitation } from '@/hooks/useStatCitations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

type Draft = Partial<StatCitation> & { key: string };

const EMPTY_DRAFT: Draft = {
  key: '',
  display_value: '',
  label: '',
  description: '',
  source_name: '',
  source_url: '',
  year: null,
  methodology: '',
  definition: '',
  sort_order: 99,
  is_active: true,
};

const StatCitationsAdmin: React.FC = () => {
  const { data: citations, isLoading } = useAllStatCitations();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [newDraft, setNewDraft] = useState<Draft | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['stat-citations'] });

  const upsertMutation = useMutation({
    mutationFn: async (draft: Draft) => {
      const payload = {
        key: draft.key,
        display_value: draft.display_value ?? '',
        label: draft.label ?? '',
        description: draft.description ?? '',
        source_name: draft.source_name ?? '',
        source_url: draft.source_url || null,
        year: draft.year ?? null,
        methodology: draft.methodology || null,
        definition: draft.definition || null,
        sort_order: draft.sort_order ?? 99,
        is_active: draft.is_active ?? true,
      };
      const { error } = await supabase
        .from('stat_citations')
        .upsert(payload, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Citation saved' });
      invalidate();
      setNewDraft(null);
      setDrafts({});
    },
    onError: (e: Error) =>
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stat_citations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Citation deleted' });
      invalidate();
    },
    onError: (e: Error) =>
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });

  const setField = (id: string, base: StatCitation) => (patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...base, ...(d[id] ?? {}), ...patch } }));

  const merged = (c: StatCitation): Draft => ({ ...c, ...(drafts[c.id] ?? {}) });
  const isDirty = (c: StatCitation) => Boolean(drafts[c.id]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Homepage Stat Citations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Edit the numbers, labels, sources, and methodology notes that appear on the homepage
            "African Diaspora" stat cards. Changes are live immediately; no redeploy needed.
          </p>
        </div>
        <Button onClick={() => setNewDraft({ ...EMPTY_DRAFT })} disabled={Boolean(newDraft)}>
          <Plus className="h-4 w-4 mr-2" /> Add citation
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading citations...
        </div>
      )}

      {newDraft && (
        <CitationForm
          value={newDraft}
          onChange={(patch) => setNewDraft((d) => (d ? { ...d, ...patch } : d))}
          onSave={() => upsertMutation.mutate(newDraft)}
          onCancel={() => setNewDraft(null)}
          saving={upsertMutation.isPending}
          isNew
        />
      )}

      <div className="space-y-4">
        {citations?.map((c) => {
          const draft = merged(c);
          const dirty = isDirty(c);
          return (
            <CitationForm
              key={c.id}
              value={draft}
              onChange={setField(c.id, c)}
              onSave={() => upsertMutation.mutate(draft)}
              onDelete={() => {
                if (confirm(`Delete citation "${c.label}"? This cannot be undone.`)) {
                  deleteMutation.mutate(c.id);
                }
              }}
              saving={upsertMutation.isPending}
              dirty={dirty}
              lastUpdated={c.updated_at}
            />
          );
        })}
      </div>
    </div>
  );
};

interface FormProps {
  value: Draft;
  onChange: (patch: Partial<Draft>) => void;
  onSave: () => void;
  onCancel?: () => void;
  onDelete?: () => void;
  saving: boolean;
  dirty?: boolean;
  isNew?: boolean;
  lastUpdated?: string;
}

const CitationForm: React.FC<FormProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  onDelete,
  saving,
  dirty,
  isNew,
  lastUpdated,
}) => {
  return (
    <Card className={dirty ? 'ring-2 ring-dna-emerald/40' : ''}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex-1">
          <CardTitle className="text-lg">
            {isNew ? 'New citation' : value.label || value.key || 'Untitled'}
          </CardTitle>
          {!isNew && lastUpdated && (
            <p className="text-xs text-muted-foreground mt-1">
              Updated {new Date(lastUpdated).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor={`active-${value.key}`} className="text-xs">
            Active
          </Label>
          <Switch
            id={`active-${value.key}`}
            checked={value.is_active ?? true}
            onCheckedChange={(v) => onChange({ is_active: v })}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Key (stable identifier)" required>
            <Input
              value={value.key}
              onChange={(e) => onChange({ key: e.target.value })}
              placeholder="e.g. diaspora_population"
              disabled={!isNew}
            />
          </Field>
          <Field label="Sort order">
            <Input
              type="number"
              value={value.sort_order ?? 0}
              onChange={(e) => onChange({ sort_order: Number(e.target.value) })}
            />
          </Field>

          <Field label="Display value" required>
            <Input
              value={value.display_value ?? ''}
              onChange={(e) => onChange({ display_value: e.target.value })}
              placeholder="200M+"
            />
          </Field>
          <Field label="Year">
            <Input
              type="number"
              value={value.year ?? ''}
              onChange={(e) =>
                onChange({ year: e.target.value ? Number(e.target.value) : null })
              }
              placeholder="2024"
            />
          </Field>

          <Field label="Label" required>
            <Input
              value={value.label ?? ''}
              onChange={(e) => onChange({ label: e.target.value })}
              placeholder="People of African Descent"
            />
          </Field>
          <Field label="Source name" required>
            <Input
              value={value.source_name ?? ''}
              onChange={(e) => onChange({ source_name: e.target.value })}
              placeholder="African Union"
            />
          </Field>
        </div>

        <Field label="Description (shown on card)" required>
          <Textarea
            rows={2}
            value={value.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </Field>

        <Field label="Source URL">
          <div className="flex gap-2">
            <Input
              type="url"
              value={value.source_url ?? ''}
              onChange={(e) => onChange({ source_url: e.target.value })}
              placeholder="https://..."
            />
            {value.source_url && (
              <Button variant="outline" size="icon" asChild>
                <a href={value.source_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </Field>

        <Field label="Definition (what does this number mean?)">
          <Textarea
            rows={3}
            value={value.definition ?? ''}
            onChange={(e) => onChange({ definition: e.target.value })}
            placeholder="Plain-English definition surfaced in the details modal."
          />
        </Field>

        <Field label="Methodology (how was it measured?)">
          <Textarea
            rows={3}
            value={value.methodology ?? ''}
            onChange={(e) => onChange({ methodology: e.target.value })}
            placeholder="Data source, filters, aggregation method."
          />
        </Field>

        <div className="flex items-center justify-between pt-2">
          {onDelete ? (
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            {onCancel && (
              <Button variant="ghost" onClick={onCancel} disabled={saving}>
                Cancel
              </Button>
            )}
            <Button onClick={onSave} disabled={saving || (!isNew && !dirty)}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isNew ? 'Create' : 'Save changes'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Field: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({
  label,
  required,
  children,
}) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-medium">
      {label}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
    {children}
  </div>
);

export default StatCitationsAdmin;
