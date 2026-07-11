/**
 * Contribute — Opportunity Mode Fields (BD084)
 *
 * The field UI that did not exist. Without it, the Contribute card renders an
 * empty proof block, because nothing collects the give → to → impact triple.
 *
 * DIA proposes; the member owns the final value (BD085). A field DIA filled is
 * marked as such and is fully editable — the mark disappears the moment the
 * member touches it.
 *
 * Capital is NOT a Contribute currency at v0.0 (D048). No money fields here.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OpportunityDirection = 'need' | 'offer';

export interface OpportunityFieldValues {
  direction: OpportunityDirection;
  category?: string;
  giveWhat?: string;
  giveTo?: string;
  intendedImpact?: string;
}

interface OpportunityModeFieldsProps {
  values: OpportunityFieldValues;
  onChange: (patch: Partial<OpportunityFieldValues>) => void;
  /** Field keys DIA proposed and the member has not yet edited. */
  diaProposed?: Set<keyof OpportunityFieldValues>;
  errors?: Partial<Record<keyof OpportunityFieldValues, string>>;
}

/** The currencies of Contribute. Capital is deliberately absent (D048). */
const CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'skills_expertise', label: 'Expertise' },
  { value: 'volunteer_time', label: 'Time' },
  { value: 'network_introductions', label: 'Network' },
  { value: 'knowledge_training', label: 'Knowledge' },
  { value: 'mentorship_guidance', label: 'Mentorship' },
  { value: 'partnership_collaboration', label: 'Partnership' },
  { value: 'physical_resources', label: 'Resources' },
];

const DiaMark: React.FC = () => (
  <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-bevel-opportunity/10 px-1.5 py-0.5 text-[10px] font-medium text-bevel-opportunity">
    <Sparkles className="h-2.5 w-2.5" />
    DIA
  </span>
);

export const OpportunityModeFields: React.FC<OpportunityModeFieldsProps> = ({
  values,
  onChange,
  diaProposed,
  errors,
}) => {
  const isNeed = values.direction !== 'offer';
  const proposed = (k: keyof OpportunityFieldValues) => diaProposed?.has(k) ?? false;

  return (
    <div className="space-y-4">
      {/* Direction — the whole card flips on this */}
      <div className="flex gap-2">
        {(['offer', 'need'] as const).map((d) => {
          const active = values.direction === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange({ direction: d })}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors',
                active
                  ? 'border-bevel-opportunity bg-bevel-opportunity/10 text-bevel-opportunity'
                  : 'border-border text-muted-foreground hover:bg-muted/60'
              )}
            >
              {d === 'offer' ? 'I’m offering' : 'I need'}
              {active && proposed('direction') && <DiaMark />}
            </button>
          );
        })}
      </div>

      {/* Currency */}
      <div>
        <Label className="flex items-center text-xs">
          What kind
          {proposed('category') && <DiaMark />}
        </Label>
        <Select
          value={values.category}
          onValueChange={(v) => onChange({ category: v })}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue placeholder="Expertise, time, network…" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* THE TRIPLE — Contribute's signature (BD084).
          Laid out as the flow it will render as, so the member composes the
          card they will see. */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="mb-3 text-xs font-semibold text-muted-foreground">
          The flow — what you see on the card
        </p>

        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <Label className="flex items-center text-[10px] uppercase tracking-wide text-muted-foreground">
              {isNeed ? 'Need' : 'Give'}
              {proposed('giveWhat') && <DiaMark />}
            </Label>
            <Input
              value={values.giveWhat ?? ''}
              onChange={(e) => onChange({ giveWhat: e.target.value })}
              placeholder={isNeed ? 'Marketing lead' : '4 hrs/week'}
              className="mt-1 h-9 text-sm"
            />
          </div>

          <ArrowRight className="mb-2.5 h-4 w-4 flex-shrink-0 text-bevel-opportunity" />

          <div className="min-w-0 flex-1">
            <Label className="flex items-center text-[10px] uppercase tracking-wide text-muted-foreground">
              {isNeed ? 'For' : 'To'}
              {proposed('giveTo') && <DiaMark />}
            </Label>
            <Input
              value={values.giveTo ?? ''}
              onChange={(e) => onChange({ giveTo: e.target.value })}
              placeholder={isNeed ? 'HealthTech' : 'Open to match'}
              className="mt-1 h-9 text-sm"
            />
          </div>

          <ArrowRight className="mb-2.5 h-4 w-4 flex-shrink-0 text-bevel-opportunity" />

          <div className="min-w-0 flex-1">
            <Label className="flex items-center text-[10px] uppercase tracking-wide text-muted-foreground">
              Impact
              {proposed('intendedImpact') && <DiaMark />}
            </Label>
            <Input
              value={values.intendedImpact ?? ''}
              onChange={(e) => onChange({ intendedImpact: e.target.value })}
              placeholder="100K users"
              className="mt-1 h-9 text-sm"
            />
          </div>
        </div>

        <p className="mt-2.5 text-[11px] text-muted-foreground">
          The impact is what makes someone act. Name the consequence, not the task.
        </p>
        {errors?.intendedImpact && (
          <p className="mt-1 text-[11px] text-destructive">{errors.intendedImpact}</p>
        )}
      </div>
    </div>
  );
};
