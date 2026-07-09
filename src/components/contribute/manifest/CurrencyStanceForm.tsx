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
  STANCE_DESCRIPTION_MAX,
  STANCE_TAGS_MAX,
  STANCE_TITLE_MAX,
  STANCE_TITLE_MIN,
  type ContributionCurrency,
  type CurrencyStance,
  type StanceAvailability,
  type StanceFormValues,
  type StanceVisibility,
} from '@/types/contribute';
import {
  AVAILABILITY_LABELS,
  CURRENCY_VISUALS,
  VISIBILITY_LABELS,
} from './currencyConfig';

const AVAILABILITY_OPTIONS: StanceAvailability[] = [
  'open_ongoing',
  'monthly_hours',
  'quarterly',
  'project_based',
  'limited_capacity',
];

const VISIBILITY_OPTIONS: StanceVisibility[] = ['public', 'connections_only', 'private'];

const EMPTY_VALUES: StanceFormValues = {
  currency: 'expertise',
  title: '',
  description: '',
  tags: [],
  availability: 'open_ongoing',
  visibility: 'public',
};

interface CurrencyStanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the form opens in edit mode; currency is locked. */
  editing?: CurrencyStance | null;
  onSubmit: (values: StanceFormValues) => Promise<void> | void;
  submitting?: boolean;
}

export function CurrencyStanceForm({
  open,
  onOpenChange,
  editing,
  onSubmit,
  submitting,
}: CurrencyStanceFormProps) {
  const { isMobile } = useMobile();
  const [values, setValues] = useState<StanceFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagDraft, setTagDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setValues({
        currency: editing.currency,
        title: editing.title,
        description: editing.description ?? '',
        tags: editing.tags,
        availability: editing.availability,
        visibility: editing.visibility,
      });
    } else {
      setValues(EMPTY_VALUES);
    }
    setErrors({});
    setTagDraft('');
  }, [open, editing]);

  const update = <K extends keyof StanceFormValues>(key: K, value: StanceFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
  };

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (values.tags.length >= STANCE_TAGS_MAX) return;
    if (values.tags.includes(t)) {
      setTagDraft('');
      return;
    }
    update('tags', [...values.tags, t]);
    setTagDraft('');
  };

  const removeTag = (tag: string) => {
    update(
      'tags',
      values.tags.filter((t) => t !== tag),
    );
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!editing && !AUTHORABLE_CURRENCIES.includes(values.currency)) {
      next.currency = 'Pick a currency.';
    }
    const titleLen = values.title.trim().length;
    if (titleLen < STANCE_TITLE_MIN) {
      next.title = `Add a title of at least ${STANCE_TITLE_MIN} characters.`;
    } else if (titleLen > STANCE_TITLE_MAX) {
      next.title = `Keep the title under ${STANCE_TITLE_MAX} characters.`;
    }
    if (values.description.length > STANCE_DESCRIPTION_MAX) {
      next.description = `Keep the description under ${STANCE_DESCRIPTION_MAX} characters.`;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSubmit({ ...values, title: values.title.trim() });
  };

  const Body = (
    <div className="space-y-5 px-4 pb-6">
      {/* Currency selector */}
      <div>
        <span className="block text-xs uppercase tracking-wide text-muted-foreground mb-2">
          Currency
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
                <span className="text-sm font-medium" style={{ color: selected ? visual.labelHex : undefined }}>{visual.label}</span>
              </button>
            );
          })}
          {/* Capital - disabled */}
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
            <Badge variant="outline" className="text-[10px]">
              Coming soon
            </Badge>
          </div>
        </div>
        <FieldError field="currency" errors={errors} />
      </div>

      {/* Title */}
      <div>
        <label htmlFor="stance-title" className="block text-sm font-medium mb-1.5">
          Title
        </label>
        <Input
          id="stance-title"
          value={values.title}
          maxLength={STANCE_TITLE_MAX + 20}
          onChange={(e) => update('title', e.target.value)}
          placeholder={CURRENCY_VISUALS[values.currency].placeholderTitle}
        />
        <FieldError field="title" errors={errors} />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="stance-description" className="block text-sm font-medium mb-1.5">
          Description
        </label>
        <Textarea
          id="stance-description"
          value={values.description}
          maxLength={STANCE_DESCRIPTION_MAX + 20}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Add depth - experience level, scope, conditions, cultural or regional context."
          className="min-h-24"
        />
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {values.description.length} / {STANCE_DESCRIPTION_MAX}
        </div>
        <FieldError field="description" errors={errors} />
      </div>

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
            disabled={values.tags.length >= STANCE_TAGS_MAX}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addTag}
            disabled={!tagDraft.trim() || values.tags.length >= STANCE_TAGS_MAX}
          >
            Add
          </Button>
        </div>
        {values.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {values.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="font-normal gap-1 pr-1"
              >
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
          Up to {STANCE_TAGS_MAX} tags. These help DIA recognise you in the right rooms.
        </p>
      </div>

      {/* Availability */}
      <div>
        <span className="block text-sm font-medium mb-1.5">Availability</span>
        <div className="space-y-1.5">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex items-start gap-2 px-3 py-2.5 min-h-[44px] rounded-lg border cursor-pointer"
              style={{
                borderColor: values.availability === opt ? '#4A8D77' : undefined,
                background: values.availability === opt ? '#4A8D7708' : undefined,
              }}
            >
              <input
                type="radio"
                name="availability"
                value={opt}
                checked={values.availability === opt}
                onChange={() => update('availability', opt)}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="block text-sm font-medium">
                  {AVAILABILITY_LABELS[opt].short}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {AVAILABILITY_LABELS[opt].helper}
                </span>
              </span>
            </label>
          ))}
        </div>
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
                <span className="block text-sm font-medium">
                  {VISIBILITY_LABELS[opt].short}
                </span>
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
          {submitting ? 'Saving...' : editing ? 'Save changes' : 'Add stance'}
        </Button>
      </div>
    </div>
  );

  const title = editing ? 'Edit stance' : 'Add a stance';

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

// Re-export to silence unused-import warnings if currency is consumed downstream.
export type { ContributionCurrency };
