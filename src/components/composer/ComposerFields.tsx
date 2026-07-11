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

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import { ComposerMode } from '@/config/composerModes';
import { cn } from '@/lib/utils';
import { ComposerDateField, ComposerPlaceField } from './ComposerResolvedFields';
import type { ResolvedDate, ResolvedPlace } from '@/services/composeResolvers';
import { EventCoverUpload } from './fields/EventCoverUpload';
import { StoryImageUpload } from './fields/StoryImageUpload';
import { StoryGalleryUpload } from './fields/StoryGalleryUpload';
import { MultiAttachmentUploader } from './fields/MultiAttachmentUploader';

export interface ComposerFieldsProps {
  mode: ComposerMode;
  values: Record<string, string>;
  /** Field keys DIA filled that the member has not yet touched. */
  diaFilled: Set<string>;
  /** Patch a field. Marks it as the author's from now on. */
  onChange: (key: string, value: string) => void;
  // ---- Resolved fields (BD089) — DIA hands an answer, not a raw string ----
  /** Convene's resolved "when", or null when DIA couldn't read one. */
  resolvedWhen: ResolvedDate | null;
  /** Member cleared DIA's date, or picked their own. */
  onResolvedWhenChange: (resolved: ResolvedDate | null) => void;
  /** Convene's geocoded place — the composer writes lat/lng on submit. */
  place: ResolvedPlace | null;
  onPlaceResolve: (place: ResolvedPlace | null) => void;
  // ---- Collaborate roles — chips, not a comma-string ----
  roles: string[];
  onRolesChange: (roles: string[]) => void;
  // ---- Media — restored uploaders (all four write to the post-media bucket) ----
  /** Single hero/cover image (events.cover_image_url / posts.image_url). */
  mediaUrl?: string;
  onMediaChange: (url: string | undefined) => void;
  /** Gallery / attachments (posts.gallery_urls). */
  galleryUrls: string[];
  onGalleryChange: (urls: string[]) => void;
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

// Roles as chips (Collaborate). Enter — or a comma — commits each role; the
// composer inserts one space_roles row per chip on submit. A comma-string could
// not become rows without guessing where one role ends and the next begins.
interface RolesChipInputProps {
  roles: string[];
  isDia: boolean;
  onChange: (roles: string[]) => void;
}

const RolesChipInput: React.FC<RolesChipInputProps> = ({ roles, isDia, onChange }) => {
  const [draft, setDraft] = useState('');

  const commit = (raw: string) => {
    const parts = raw.split(',').map((r) => r.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...roles];
    for (const p of parts) {
      if (!next.some((r) => r.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft('');
  };

  return (
    <div className="min-w-0 flex-1">
      <Label className="mb-1 flex items-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        Roles you need
        {isDia && <DiaMark />}
      </Label>
      {roles.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {roles.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 rounded-full bg-bevel-space/10 px-2.5 py-1 text-[11px] font-medium text-bevel-space"
            >
              {r}
              <button
                type="button"
                aria-label={`Remove ${r}`}
                onClick={() => onChange(roles.filter((x) => x !== r))}
                className="rounded-full p-0.5 hover:bg-bevel-space/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        placeholder="Solar engineer — press Enter"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit(draft);
          } else if (e.key === 'Backspace' && !draft && roles.length) {
            onChange(roles.slice(0, -1));
          }
        }}
        onBlur={() => draft.trim() && commit(draft)}
        className={cn('h-9 text-sm', isDia && 'border-bevel-opportunity/50 bg-bevel-opportunity/5')}
      />
    </div>
  );
};

export const ComposerFields: React.FC<ComposerFieldsProps> = ({
  mode,
  values,
  diaFilled,
  onChange,
  resolvedWhen,
  onResolvedWhenChange,
  place,
  onPlaceResolve,
  roles,
  onRolesChange,
  mediaUrl,
  onMediaChange,
  galleryUrls,
  onGalleryChange,
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
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Field {...common('title')} label="Headline" placeholder="From London to Lagos" />
        </div>
        <StoryImageUpload
          currentImageUrl={mediaUrl}
          onUpload={onMediaChange}
          onRemove={() => onMediaChange(undefined)}
        />
        <StoryGalleryUpload galleryUrls={galleryUrls} onChange={onGalleryChange} />
      </div>
    );
  }

  // ---- CONNECT ------------------------------------------------------------
  if (mode === 'connect') {
    return (
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <Field {...common('intent')} label="Who you need" placeholder="Co-founder" />
          <Field {...common('where')} label="Where" placeholder="Kigali" />
        </div>
        <MultiAttachmentUploader value={galleryUrls} onChange={onGalleryChange} maxFiles={6} />
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
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start">
          {/* DIA hands over a resolved instant (BD089); dismiss it for a picker. */}
          <div className="min-w-0 flex-1">
            <ComposerDateField
              resolved={resolvedWhen}
              fromDIA={diaFilled.has('when')}
              onChange={onResolvedWhenChange}
            />
          </div>
          {/* Geocode to a real point so the event shows on the map / "near you". */}
          <div className="min-w-0 flex-1">
            <ComposerPlaceField
              city={values.where ?? ''}
              onCityChange={(v) => onChange('where', v)}
              onResolve={onPlaceResolve}
              fromDIA={diaFilled.has('where')}
              purpose={
                values.where?.trim()
                  ? `People browsing ${values.where.trim()} will find this event.`
                  : undefined
              }
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Choice {...common('format')} label="Format" options={FORMATS} placeholder="In person" />
        </div>
        <EventCoverUpload
          currentImageUrl={mediaUrl}
          onUpload={onMediaChange}
          onRemove={() => onMediaChange(undefined)}
        />
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
        <div className="flex items-start gap-2">
          <RolesChipInput roles={roles} isDia={diaFilled.has('roles')} onChange={onRolesChange} />
          <Choice {...common('type')} label="Type" options={SPACE_TYPES} placeholder="Initiative" />
        </div>
        <MultiAttachmentUploader value={galleryUrls} onChange={onGalleryChange} maxFiles={6} />
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
      <div>
        <Label className="mb-1 flex items-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          Direction
          {diaFilled.has('direction') && <DiaMark />}
        </Label>
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

      <MultiAttachmentUploader value={galleryUrls} onChange={onGalleryChange} maxFiles={6} />
    </div>
  );
};
