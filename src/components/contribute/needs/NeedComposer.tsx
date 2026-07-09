import { useEffect, useState } from 'react';
import { useMobile } from '@/hooks/useMobile';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { FieldError } from '@/components/composer/fields/FieldError';
import {
  AUTHORABLE_CURRENCIES,
  NEED_CONTEXT_MAX,
  NEED_TAGS_MAX,
  NEED_TITLE_MAX,
  NEED_TITLE_MIN,
  type CurrencyStance,
  type NeedDeclaration,
  type NeedFormValues,
  type StanceVisibility,
} from '@/types/contribute';
import { CURRENCY_VISUALS, VISIBILITY_LABELS } from '../manifest/currencyConfig';
import { NEED_SCOPE_LABELS, NEED_SCOPE_OPTIONS } from './needsConfig';

const VISIBILITY_OPTIONS: StanceVisibility[] = ['public', 'connections_only', 'private'];

const EMPTY_VALUES: NeedFormValues = {
  currency: 'expertise',
  title: '',
  context: '',
  scope: 'open_ended',
  relatedStanceId: null,
  tags: [],
  visibility: 'public',
  startsAt: null,
  endsAt: null,
};

interface NeedComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: NeedDeclaration | null;
  ownStances: CurrencyStance[];
  onSubmit: (values: NeedFormValues) => Promise<void> | void;
  submitting?: boolean;
}

export function NeedComposer({
  open,
  onOpenChange,
  editing,
  ownStances,
  onSubmit,
  submitting,
}: NeedComposerProps) {
  const { isMobile } = useMobile();
  const [values, setValues] = useState<NeedFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagDraft, setTagDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setValues({
        currency: editing.currency,
        title: editing.title,
        context: editing.context ?? '',
        scope: editing.scope,
        relatedStanceId: editing.relatedStanceId,
        tags: editing.tags,
        visibility: editing.visibility,
        startsAt: editing.startsAt,
        endsAt: editing.endsAt,
      });
    } else {
      setValues(EMPTY_VALUES);
    }
    setErrors({});
    setTagDraft('');
  }, [open, editing]);

  const update = <K extends keyof NeedFormValues>(key: K, value: NeedFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (values.tags.length >= NEED_TAGS_MAX) return;
    if (values.tags.includes(t)) {
      setTagDraft('');
      return;
    }
    update('tags', [...values.tags, t]);
    setTagDraft('');
  };

  const removeTag = (tag: string) => {
    update('tags', values.tags.filter((t) => t !== tag));
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!editing && !AUTHORABLE_CURRENCIES.includes(values.currency)) {
      next.currency = 'Pick a currency.';
    }
    const titleLen = values.title.trim().length;
    if (titleLen < NEED_TITLE_MIN) {
      next.title = `Add a title of at least ${NEED_TITLE_MIN} characters.`;
    } else if (titleLen > NEED_TITLE_MAX) {
      next.title = `Keep the title under ${NEED_TITLE_MAX} characters.`;
    }
    if (values.context.length > NEED_CONTEXT_MAX) {
      next.context = `Keep the context under ${NEED_CONTEXT_MAX} characters.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit({ ...values, title: values.title.trim() });
  };

  const matchingStances = ownStances.filter(
    (s) => s.currency === values.currency && !s.isArchived,
  );

  const Body = (
    <div className="space-y-5 px-4 pb-6">
      {/* Currency */}
      <div>
        <span className="block text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Currency you are seeking
        </span>
        <div className="grid grid-cols-2 gap-2">
          {AUTHORABLE_CURRENCIES.map((c) => {
            const visual = CURRENCY_VISUALS[c];
            const Icon = visual.icon;
            const selected = values.currency === c;
            const locked = !!editing;
            return (
              <button
                key={c}
                type="button"
                disabled={locked && !selected}
                onClick={() => !locked && update('currency', c)}
                aria-pressed={selected}
                className="flex items-center gap-2 px-3 py-3 min-h-[44px] rounded-lg border text-left transition-colors disabled:opacity-50"
                style={{
                  borderColor: selected ? visual.barHex : undefined,
                  background: selected ? `${visual.barHex}10` : undefined,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: visual.barHex }} aria-hidden="true" />
                <span
                  className="text-sm font-medium"
                  style={{ color: selected ? visual.labelHex : undefined }}
                >
                  {visual.label}
                </span>
              </button>
            );
          })}
          <div className="flex items-center justify-between gap-2 px-3 py-3 min-h-[44px] rounded-lg border opacity-60 col-span-2">
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = CURRENCY_VISUALS.capital.icon;
                return (
                  <Icon
                    className="h-4 w-4"
                    style={{ color: CURRENCY_VISUALS.capital.barHex }}
                    aria-hidden="true"
                  />
                );
              })()}
              <span className="text-sm font-medium">Capital</span>
            </div>
            <Badge variant="outline" className="text-[10px]">Coming soon</Badge>
          </div>
        </div>
        <FieldError field="currency" errors={errors} />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="need-title" className="block text-sm font-medium mb-1.5">Title</label>
        <Input
          id="need-title"
          value={values.title}
          maxLength={NEED_TITLE_MAX + 20}
          onChange={(e) => update('title', e.target.value)}
          placeholder="What you are building, in one line"
        />
        <FieldError field="title" errors={errors} />
      </div>

      {/* Context */}
      <div>
        <label htmlFor="need-context" className="block text-sm font-medium mb-1.5">Context</label>
        <Textarea
          id="need-context"
          value={values.context}
          maxLength={NEED_CONTEXT_MAX + 20}
          onChange={(e) => update('context', e.target.value)}
          placeholder="What you are building, why this currency matters, what success looks like."
          className="min-h-28"
        />
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {values.context.length} / {NEED_CONTEXT_MAX}
        </div>
        <FieldError field="context" errors={errors} />
      </div>

      {/* Scope */}
      <div>
        <span className="block text-sm font-medium mb-1.5">Scope</span>
        <div className="space-y-1.5">
          {NEED_SCOPE_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-start gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border cursor-pointer"
              style={{
                borderColor: values.scope === opt ? '#4A8D77' : undefined,
                background: values.scope === opt ? '#4A8D7708' : undefined,
              }}
            >
              <input
                type="radio"
                name="scope"
                value={opt}
                checked={values.scope === opt}
                onChange={() => update('scope', opt)}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium">{NEED_SCOPE_LABELS[opt].short}</span>
                <span className="block text-xs text-muted-foreground">
                  {NEED_SCOPE_LABELS[opt].helper}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Related stance (symmetric context) */}
      {matchingStances.length > 0 && (
        <div>
          <label htmlFor="need-stance" className="block text-sm font-medium mb-1.5">
            Pair with one of your stances
          </label>
          <select
            id="need-stance"
            value={values.relatedStanceId ?? ''}
            onChange={(e) => update('relatedStanceId', e.target.value || null)}
            className="w-full h-11 px-3 rounded-lg border bg-background text-sm"
          >
            <option value="">No paired stance</option>
            {matchingStances.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional. Shows the symmetric "I bring this, I'm seeking this" context.
          </p>
        </div>
      )}

      {/* Tags */}
      <div>
        <span className="block text-sm font-medium mb-1.5">Tags</span>
        <div className="flex gap-2">
          <Input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag and press Enter"
            disabled={values.tags.length >= NEED_TAGS_MAX}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={!tagDraft.trim() || values.tags.length >= NEED_TAGS_MAX}
          >
            Add
          </Button>
        </div>
        {values.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {values.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal gap-1 pr-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                  className="inline-flex items-center justify-center h-4 w-4 rounded hover:bg-background/60"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Up to {NEED_TAGS_MAX} tags. These help DIA surface this Need to the right people.
        </p>
      </div>

      {/* Visibility */}
      <div>
        <span className="block text-sm font-medium mb-1.5">Visibility</span>
        <div className="space-y-1.5">
          {VISIBILITY_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-start gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border cursor-pointer"
              style={{
                borderColor: values.visibility === opt ? '#4A8D77' : undefined,
                background: values.visibility === opt ? '#4A8D7708' : undefined,
              }}
            >
              <input
                type="radio"
                name="visibility"
                value={opt}
                checked={values.visibility === opt}
                onChange={() => update('visibility', opt)}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium">{VISIBILITY_LABELS[opt].short}</span>
                <span className="block text-xs text-muted-foreground">
                  {VISIBILITY_LABELS[opt].helper}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-11"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="flex-1 h-11"
          onClick={handleSubmit}
          disabled={submitting}
          style={{ background: '#4A8D77', color: 'white' }}
        >
          {submitting ? 'Saving...' : editing ? 'Save changes' : 'Save as draft'}
        </Button>
      </div>
    </div>
  );

  const title = editing ? 'Edit Need' : 'Declare a Need';

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <div data-vaul-drawer-handle="" className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-muted" />
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[78vh]">{Body}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="max-w-lg max-h-[90vh] overflow-y-auto">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>{title}</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        {Body}
      </ResponsiveModal>
  );
}
