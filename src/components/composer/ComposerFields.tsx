/**
 * ComposerFields — the fields each verb needs, and nothing more
 *
 * One component, five verbs. Fields appear only when the verb needs them.
 *
 * DIA-filled fields are marked and fully editable. The mark clears the moment
 * the member touches the field, and from then on it is theirs — DIA will never
 * write over it again (enforced in useDIACompose).
 *
 * SPACE COMPOSES HERE. The member never leaves the composer to start a
 * collaboration; on submit, the Spaces substrate is called. Navigation is not a
 * compose path (reversal of the earlier deep-link decision — see BD087).
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
import { ComposerMode } from '@/config/composerModes';
import { cn } from '@/lib/utils';

export interface ComposerFieldsProps {
  mode: ComposerMode;
  values: Record<string, string>;
  /** Field keys DIA filled that the member has not yet touched. */
  diaFilled: Set<string>;
  /** Patch a field. Marks it as the author's from now on. */
  onChange: (key: string, value: string) => void;
}

const KINDS = ['Expertise', 'Time', 'Network', 'Knowledge', 'Mentorship', 'Partnership', 'Resources'];
const FORMATS = ['In person', 'Virtual', 'Hybrid'];
const SPACE_TYPES = ['Initiative', 'Project', 'Venture', 'Working group', 'Campaign'];

const DiaMark: React.FC = () => (
  <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-bevel-opportunity/15 px-1.5 py-0.5 text-[9px] font-bold text-bevel-opportunity">
    <Sparkles className="h-2.5 w-2.5" />
    DIA
  </span>
);

// Field and Choice live at module scope: defining them inside ComposerFields
// would mint a new component type every render, remounting the input and
// dropping keyboard focus mid-word.

interface FieldProps {
  k: string;
  label: string;
  placeholder: string;
  values: Record<string, string>;
  isDia: boolean;
  onChange: (key: string, value: string) => void;
}

const Field: React.FC<FieldProps> = ({ k, label, placeholder, values, isDia, onChange }) => (
  <div className="min-w-0 flex-1">
    <Label className="mb-1 flex items-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      {label}
      {isDia && <DiaMark />}
    </Label>
    <Input
      value={values[k] ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(k, e.target.value)}
      className={cn('h-9 text-sm', isDia && 'border-bevel-opportunity/50 bg-bevel-opportunity/5')}
    />
  </div>
);

interface ChoiceProps extends FieldProps {
  options: string[];
}

const Choice: React.FC<ChoiceProps> = ({ k, label, options, placeholder, values, isDia, onChange }) => (
  <div className="min-w-0 flex-1">
    <Label className="mb-1 flex items-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
      {label}
      {isDia && <DiaMark />}
    </Label>
    <Select value={values[k] ?? ''} onValueChange={(v) => onChange(k, v)}>
      <SelectTrigger
        className={cn('h-9 text-sm', isDia && 'border-bevel-opportunity/50 bg-bevel-opportunity/5')}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
);

export const ComposerFields: React.FC<ComposerFieldsProps> = ({
  mode,
  values,
  diaFilled,
  onChange,
}) => {
  const common = (k: string) => ({
    k,
    values,
    isDia: diaFilled.has(k),
    onChange,
  });

  // ---- CONVEY -------------------------------------------------------------
  if (mode === 'story') {
    return (
      <div className="flex gap-2">
        <Field {...common('title')} label="Headline" placeholder="From London to Lagos" />
      </div>
    );
  }

  // ---- CONNECT ------------------------------------------------------------
  if (mode === 'connect') {
    return (
      <div className="flex gap-2">
        <Field {...common('intent')} label="Who you need" placeholder="Co-founder" />
        <Field {...common('where')} label="Where" placeholder="Kigali" />
      </div>
    );
  }

  // ---- CONVENE ------------------------------------------------------------
  if (mode === 'event') {
    return (
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Field {...common('title')} label="Event name" placeholder="African Tech Summit" />
        </div>
        <div className="flex gap-2">
          <Field {...common('when')} label="When" placeholder="Sat, Mar 15 · 6:00pm" />
          <Field {...common('where')} label="Where" placeholder="Lagos, Nigeria" />
        </div>
        <div className="flex gap-2">
          <Choice {...common('format')} label="Format" options={FORMATS} placeholder="In person" />
        </div>
      </div>
    );
  }

  // ---- COLLABORATE — composes here, never navigates away -------------------
  if (mode === 'space') {
    return (
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Field {...common('title')} label="Space name" placeholder="Solar Education Initiative" />
        </div>
        <div className="flex gap-2">
          <Field {...common('roles')} label="Roles you need" placeholder="Solar engineer, Market lead" />
          <Choice {...common('type')} label="Type" options={SPACE_TYPES} placeholder="Initiative" />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Posting creates the Space and shares it to the feed. You stay right here.
        </p>
      </div>
    );
  }

  // ---- CONTRIBUTE — the triple (BD084) ------------------------------------
  const isNeed = values.direction === 'need';

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        {(['offer', 'need'] as const).map((d) => {
          const active = (values.direction ?? 'offer') === d;
          return (
            <button
              key={d}
              type="button"
              onClick={() => onChange('direction', d)}
              className={cn(
                'flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors',
                active
                  ? 'border-bevel-opportunity bg-bevel-opportunity/10 text-bevel-opportunity'
                  : 'border-border text-muted-foreground hover:bg-muted/60'
              )}
            >
              {d === 'offer' ? 'I’m offering' : 'I need'}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Choice
          {...common('kind')}
          label="What kind"
          options={KINDS}
          placeholder="Expertise, time, network…"
        />
      </div>

      <div className="rounded-lg bg-muted/40 p-3">
        <p className="mb-2.5 text-[11px] text-muted-foreground">
          The flow — this is what people see, and what makes them act
        </p>
        <div className="flex items-end gap-1.5">
          <Field
            {...common('give')}
            label={isNeed ? 'Need' : 'Give'}
            placeholder={isNeed ? 'Marketing lead' : '4 hrs/week'}
          />
          <ArrowRight className="mb-2.5 h-4 w-4 flex-shrink-0 text-bevel-opportunity" />
          <Field {...common('to')} label={isNeed ? 'For' : 'To'} placeholder="Open to match" />
          <ArrowRight className="mb-2.5 h-4 w-4 flex-shrink-0 text-bevel-opportunity" />
          <Field {...common('impact')} label="Impact" placeholder="Ship faster" />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          The impact is what makes someone act. Name the consequence, not the task.
        </p>
      </div>
    </div>
  );
};
