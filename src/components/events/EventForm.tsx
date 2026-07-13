/**
 * EventForm — the ONE event form.
 *
 * Renders eventFormSchema at two levels of disclosure:
 *   level="compact" — THE INVITATION: title, cover, description, type,
 *     format, when, where, tags. "More options" expands IN PLACE to full.
 *   level="full" — adds THE DOOR (visibility, seats, approval, guests) and
 *     THE PROGRAMME (subtitle, short description, agenda, speakers, dress
 *     code), written as consequences, not booleans.
 *
 * Replaces EventFormFields, EventModeFields, EventSettingsPage, and the form
 * body of EditEventPage. Fields that don't apply are ABSENT, not disabled:
 * virtual events have no location block, in-person events no meeting link.
 * The organizer never types a timezone or coordinates — both are derived.
 */

import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, ChevronDown, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useEventForm, type SubmitIntent } from '@/hooks/useEventForm';
import type { EventStatus } from '@/lib/events/state';
import {
  EVENT_TYPES,
  type EventFormValues,
  type AgendaItem,
  type Speaker,
} from '@/lib/events/eventFormSchema';
import { EventCoverUpload } from '@/components/composer/fields/EventCoverUpload';

export interface EventFormProps {
  level: 'compact' | 'full';
  mode?: 'create' | 'edit';
  eventId?: string;
  initialValues?: Partial<EventFormValues>;
  /** The status the event already has (edit mode). */
  currentStatus?: EventStatus;
  onSuccess?: (result: { eventId: string | null; status: EventStatus }) => void;
  /** Called after a confirmed delete (edit mode). */
  onDeleted?: () => void;
  className?: string;
}

const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  conference: 'Conference',
  workshop: 'Workshop',
  meetup: 'Meetup',
  webinar: 'Webinar',
  networking: 'Networking',
  social: 'Social',
  other: 'Other',
};

const FORMAT_OPTIONS = [
  { value: 'in_person', label: 'In person', hint: 'A room, a city' },
  { value: 'virtual', label: 'Virtual', hint: 'A link, anywhere' },
  { value: 'hybrid', label: 'Hybrid', hint: 'Both at once' },
] as const;

const DRESS_CODES = [
  { value: 'casual', label: 'Casual' },
  { value: 'business_casual', label: 'Business casual' },
  { value: 'formal', label: 'Formal' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'other', label: 'Other' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Anyone on the web can see this' },
  { value: 'community', label: 'Only signed-in Members' },
  { value: 'private', label: 'Only people you invite' },
] as const;

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p data-field-error className="mt-1 text-xs text-destructive">
      {message}
    </p>
  ) : null;

/** Human names for the error summary — falls back to the raw key for fields added later. */
const FIELD_LABELS: Record<string, string> = {
  title: 'Event name',
  description: 'What to expect',
  event_type: 'Kind of gathering',
  format: 'Format',
  startDate: 'Start date',
  startTime: 'Start time',
  endDate: 'End date',
  endTime: 'End time',
  visibility: 'Who can see this event',
  location_name: 'Venue',
  location_address: 'Street address',
  location_city: 'City',
  location_country: 'Country',
  meeting_url: 'Meeting link',
  meeting_platform: 'Platform',
  max_attendees: 'Seats',
  requires_approval: 'Who gets in',
  allow_guests: 'Plus-ones',
  subtitle: 'Subtitle',
  short_description: 'One-line summary',
  cover_image_url: 'Cover image',
  tags: 'Tags',
  agenda: 'Agenda',
  speakers: 'Speakers',
  dress_code: 'Dress code',
  group_id: 'Community',
  timezone: 'Timezone',
  cancellation_reason: 'Cancellation reason',
  is_flagship: 'DNA flagship',
};

/** Two/three exclusive choices rendered as consequences, not booleans. */
function ConsequenceChoice<T extends string | boolean>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="mt-2 grid gap-2">
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-lg border px-3 py-2 text-left text-sm transition-colors',
              value === opt.value
                ? 'border-amber-500 bg-amber-50 font-medium dark:bg-amber-500/10'
                : 'border-border text-muted-foreground hover:border-muted-foreground/50'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [draft, setDraft] = useState('');
  const commit = () => {
    const t = draft.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setDraft('');
  };
  return (
    <div>
      <Label className="text-sm font-medium">Tags</Label>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-sm text-amber-800 dark:bg-amber-500/20 dark:text-amber-300"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(tags.filter((t) => t !== tag))}
              className="hover:text-amber-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Input
          value={draft}
          placeholder="Add tag, press Enter"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={() => draft.trim() && commit()}
          className="h-8 w-40 text-sm"
        />
      </div>
    </div>
  );
}

function AgendaBuilder({
  agenda,
  onChange,
}: {
  agenda: AgendaItem[];
  onChange: (agenda: AgendaItem[]) => void;
}) {
  const update = (i: number, patch: Partial<AgendaItem>) =>
    onChange(agenda.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  return (
    <div>
      <Label className="text-sm font-medium">Agenda</Label>
      <div className="mt-2 space-y-2">
        {agenda.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <Input
              placeholder="6:00 PM"
              value={item.time}
              onChange={(e) => update(i, { time: e.target.value })}
              className="w-24 flex-shrink-0"
            />
            <Input
              placeholder="Registration & networking"
              value={item.title}
              onChange={(e) => update(i, { title: e.target.value })}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove agenda item"
              onClick={() => onChange(agenda.filter((_, idx) => idx !== i))}
              className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...agenda, { time: '', title: '' }])}
          className="w-full border-dashed"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add agenda item
        </Button>
      </div>
    </div>
  );
}

function SpeakersBuilder({
  speakers,
  onChange,
}: {
  speakers: Speaker[];
  onChange: (speakers: Speaker[]) => void;
}) {
  const update = (i: number, patch: Partial<Speaker>) =>
    onChange(speakers.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  return (
    <div>
      <Label className="text-sm font-medium">Speakers</Label>
      <div className="mt-2 space-y-2">
        {speakers.map((s, i) => (
          <div key={i} className="flex items-start gap-2">
            <Input
              placeholder="Ama Mensah"
              value={s.name}
              onChange={(e) => update(i, { name: e.target.value })}
              className="flex-1"
            />
            <Input
              placeholder="Founder, Accra Angels"
              value={s.title ?? ''}
              onChange={(e) => update(i, { title: e.target.value })}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove speaker"
              onClick={() => onChange(speakers.filter((_, idx) => idx !== i))}
              className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...speakers, { name: '', title: '' }])}
          className="w-full border-dashed"
        >
          <Plus className="mr-1 h-3.5 w-3.5" /> Add speaker
        </Button>
      </div>
    </div>
  );
}

const SectionDivider: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-3 pt-2">
    <div className="h-px flex-1 bg-border" />
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
    <div className="h-px flex-1 bg-border" />
  </div>
);

export function EventForm({
  level,
  mode = 'create',
  eventId,
  initialValues,
  currentStatus,
  onSuccess,
  onDeleted,
  className,
}: EventFormProps) {
  const { isAdmin } = useIsAdmin();
  const [expanded, setExpanded] = useState(level === 'full');
  const effectiveLevel = level === 'full' || expanded ? 'full' : 'compact';

  const {
    values,
    setValues,
    errors,
    errorNonce,
    isSubmitting,
    geocodeFailed,
    tzInfo,
    refreshPlace,
    submit,
    cancelEvent,
    deleteEvent,
  } = useEventForm({ mode, eventId, initialValues, currentStatus, onSuccess });

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const showLocation = values.format !== 'virtual';
  const showMeeting = values.format !== 'in_person';
  const isCancelled = currentStatus === 'cancelled';
  const isTerminal = currentStatus === 'cancelled' || currentStatus === 'completed';

  // Every error key with a <FieldError> actually rendered below its field
  // RIGHT NOW (some fields are absent by format or disclosure level). Any key
  // in `errors` that is not in this list — a hidden field, or a field added to
  // the schema later with no inline error — surfaces in the summary banner
  // instead. By construction, no field can fail invisibly.
  const inlineErrorKeys: string[] = [
    'title',
    'description',
    'startDate',
    'startTime',
    'endDate',
    'endTime',
    'cover_image_url',
    ...(showLocation ? ['location_name', 'location_city', 'location_country'] : []),
    ...(showLocation && effectiveLevel === 'full' ? ['location_address'] : []),
    ...(showMeeting ? ['meeting_url'] : []),
    ...(showMeeting && effectiveLevel === 'full' ? ['meeting_platform'] : []),
    ...(effectiveLevel === 'full'
      ? ['max_attendees', 'subtitle', 'short_description', 'dress_code']
      : []),
  ];
  const summaryErrors = Object.entries(errors).filter(
    ([key, message]) => message && !inlineErrorKeys.includes(key)
  );

  // On a failed submit, bring the first visible error into view — the composer
  // is a long scroller and an error above the fold is otherwise invisible.
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (errorNonce === 0) return;
    rootRef.current
      ?.querySelector('[data-field-error]')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [errorNonce]);

  const submitButton = (intent: SubmitIntent, label: string, primary = true) => (
    <Button
      key={label}
      type="button"
      onClick={() => submit(intent)}
      disabled={isSubmitting}
      variant={primary ? 'default' : 'outline'}
      className={cn(primary && 'bg-amber-500 text-white hover:bg-amber-600')}
    >
      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {label}
    </Button>
  );

  // STATUS is a publish control, not a dropdown:
  //   compact composer → posting means publishing.
  //   full create / editing a draft → work before the body watches.
  //   editing a published event → saving does not touch status.
  const actions =
    mode === 'create'
      ? effectiveLevel === 'compact'
        ? [submitButton('publish', isSubmitting ? 'Publishing…' : 'Publish event')]
        : [
            submitButton('draft', 'Save as draft', false),
            submitButton('publish', isSubmitting ? 'Publishing…' : 'Publish'),
          ]
      : currentStatus === 'draft'
        ? [
            submitButton('draft', 'Save draft', false),
            submitButton('publish', isSubmitting ? 'Publishing…' : 'Publish'),
          ]
        : [submitButton('save', isSubmitting ? 'Saving…' : 'Save changes')];

  return (
    <div ref={rootRef} className={cn('space-y-4', className)}>
      {summaryErrors.length > 0 && (
        <div
          data-field-error
          role="alert"
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm"
        >
          <p className="font-medium text-destructive">
            A few fields need attention before this can go out:
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-destructive">
            {summaryErrors.map(([key, message]) => (
              <li key={key}>
                <span className="font-medium">{FIELD_LABELS[key] ?? key}</span> — {message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/20">
          <p className="font-medium">This event is cancelled.</p>
          <p className="mt-1 text-muted-foreground">
            The reason below is shown to attendees — it’s part of the record.
          </p>
          <Textarea
            value={values.cancellation_reason ?? ''}
            onChange={(e) => setValues({ cancellation_reason: e.target.value })}
            className="mt-2 min-h-[60px]"
          />
        </div>
      )}

      {/* ============ THE INVITATION ============ */}
      <div>
        <Label className="text-sm font-medium">Event name</Label>
        <Input
          placeholder="Pan-African Investment Summit 2026"
          value={values.title}
          onChange={(e) => setValues({ title: e.target.value })}
          maxLength={200}
          className="mt-1.5"
        />
        <FieldError message={errors.title} />
      </div>

      <div>
        <Label className="text-sm font-medium">Cover image</Label>
        <EventCoverUpload
          currentImageUrl={values.cover_image_url || undefined}
          onUpload={(url) => setValues({ cover_image_url: url })}
          onRemove={() => setValues({ cover_image_url: '' })}
        />
        <FieldError message={errors.cover_image_url} />
      </div>

      <div>
        <Label className="text-sm font-medium">What to expect</Label>
        <Textarea
          placeholder="What will people experience? Why should they come?"
          value={values.description}
          onChange={(e) => setValues({ description: e.target.value })}
          className="mt-1.5 min-h-[100px] resize-y"
        />
        <FieldError message={errors.description} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label className="text-sm font-medium">Kind of gathering</Label>
          <Select
            value={values.event_type}
            onValueChange={(v) => setValues({ event_type: v as EventFormValues['event_type'] })}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EVENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">Format</Label>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {FORMAT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValues({ format: opt.value })}
                className={cn(
                  'rounded-lg border-2 p-2 text-center text-sm transition-all',
                  values.format === opt.value
                    ? 'border-amber-500 bg-amber-50 font-medium dark:bg-amber-500/10'
                    : 'border-border hover:border-muted-foreground/50'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* When */}
      <div>
        <Label className="text-sm font-medium">When</Label>
        <div className="mt-1.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Doors open</p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={values.startDate}
                onChange={(e) => setValues({ startDate: e.target.value })}
                className="flex-1"
              />
              <Input
                type="time"
                value={values.startTime}
                onChange={(e) => setValues({ startTime: e.target.value })}
                className="w-28"
              />
            </div>
            <FieldError message={errors.startDate ?? errors.startTime} />
          </div>
          <div>
            <p className="mb-1 text-xs text-muted-foreground">Wraps up</p>
            <div className="flex gap-2">
              <Input
                type="date"
                value={values.endDate}
                onChange={(e) => setValues({ endDate: e.target.value })}
                className="flex-1"
              />
              <Input
                type="time"
                value={values.endTime}
                onChange={(e) => setValues({ endTime: e.target.value })}
                className="w-28"
              />
            </div>
            <FieldError message={errors.endDate ?? errors.endTime} />
          </div>
        </div>
        {/* The timezone is a consequence, never an input. */}
        {tzInfo.localStart && (
          <p className="mt-2 text-xs text-muted-foreground">
            {tzInfo.isOrganizerFallback ? (
              <>
                Doors {tzInfo.localStart} ({tzInfo.timezone})
                {values.format === 'virtual'
                  ? ' — virtual events with no venue use the organizer’s clock.'
                  : ' — add a city we recognize and we’ll use the venue’s clock.'}
                {tzInfo.viewerEquivalent && <> That’s {tzInfo.viewerEquivalent} for you.</>}
              </>
            ) : (
              <>
                Doors {tzInfo.localStart} in {tzInfo.cityLabel}.
                {tzInfo.viewerEquivalent && <> That’s {tzInfo.viewerEquivalent} for you.</>}
              </>
            )}
          </p>
        )}
      </div>

      {/* Where — absent, not disabled, when it doesn't apply. */}
      {showLocation && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Where</Label>
            <Input
              placeholder="Venue — Lagos Continental Hotel"
              value={values.location_name}
              onChange={(e) => setValues({ location_name: e.target.value })}
              onBlur={refreshPlace}
              className="mt-1.5"
            />
            <FieldError message={errors.location_name} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Input
                placeholder="City — Lagos"
                value={values.location_city}
                onChange={(e) => setValues({ location_city: e.target.value })}
                onBlur={refreshPlace}
              />
              <FieldError message={errors.location_city} />
            </div>
            <div>
              <Input
                placeholder="Country — Nigeria"
                value={values.location_country}
                onChange={(e) => setValues({ location_country: e.target.value })}
                onBlur={refreshPlace}
              />
              <FieldError message={errors.location_country} />
            </div>
          </div>
          {effectiveLevel === 'full' && (
            <div>
              <Input
                placeholder="Street address (shown to registered attendees)"
                value={values.location_address}
                onChange={(e) => setValues({ location_address: e.target.value })}
              />
              <FieldError message={errors.location_address} />
            </div>
          )}
          {geocodeFailed && (
            <p className="text-xs text-muted-foreground">
              We couldn’t pin this spot on the map — the event still saves fine.
            </p>
          )}
        </div>
      )}

      {showMeeting && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label className="text-sm font-medium">Meeting link</Label>
            <Input
              placeholder="https://zoom.us/j/123456789"
              value={values.meeting_url}
              onChange={(e) => setValues({ meeting_url: e.target.value })}
              className="mt-1.5"
            />
            <FieldError message={errors.meeting_url} />
          </div>
          {effectiveLevel === 'full' && (
            <div>
              <Label className="text-sm font-medium">Platform</Label>
              <Input
                placeholder="Zoom, Meet, Teams…"
                value={values.meeting_platform}
                onChange={(e) => setValues({ meeting_platform: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.meeting_platform} />
            </div>
          )}
        </div>
      )}

      <TagInput tags={values.tags} onChange={(tags) => setValues({ tags })} />

      {/* ============ MORE OPTIONS — expands IN PLACE ============ */}
      {effectiveLevel === 'compact' && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:border-amber-400 hover:text-foreground"
        >
          More options — who gets in, the programme
          <ChevronDown className="h-4 w-4" />
        </button>
      )}

      {effectiveLevel === 'full' && (
        <>
          {/* ============ THE DOOR ============ */}
          <SectionDivider label="The door" />

          <ConsequenceChoice
            label="Who can see this event?"
            options={[...VISIBILITY_OPTIONS]}
            value={values.visibility}
            onChange={(v) => setValues({ visibility: v })}
          />

          <ConsequenceChoice
            label="Who gets in?"
            options={[
              { value: false, label: 'Anyone can join' },
              { value: true, label: 'You approve each person' },
            ]}
            value={values.requires_approval}
            onChange={(v) => setValues({ requires_approval: v })}
          />

          <ConsequenceChoice
            label="Plus-ones?"
            options={[
              { value: true, label: 'Attendees can bring guests' },
              { value: false, label: 'The invitation is personal — no guests' },
            ]}
            value={values.allow_guests}
            onChange={(v) => setValues({ allow_guests: v })}
          />

          <div>
            <Label className="text-sm font-medium">Seats</Label>
            <Input
              type="number"
              min={1}
              placeholder="Unlimited"
              value={values.max_attendees ?? ''}
              onChange={(e) =>
                setValues({
                  max_attendees: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              className="mt-1.5 w-40"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Leave empty and anyone can grab a seat.
            </p>
            <FieldError message={errors.max_attendees} />
          </div>

          {/* ============ THE PROGRAMME ============ */}
          <SectionDivider label="The programme" />

          <div>
            <Label className="text-sm font-medium">Subtitle</Label>
            <Input
              placeholder="Connecting diaspora investors with opportunities"
              value={values.subtitle}
              onChange={(e) => setValues({ subtitle: e.target.value })}
              maxLength={200}
              className="mt-1.5"
            />
            <FieldError message={errors.subtitle} />
          </div>

          <div>
            <Label className="text-sm font-medium">One-line summary</Label>
            <Input
              placeholder="The short version, for cards and previews"
              value={values.short_description}
              onChange={(e) => setValues({ short_description: e.target.value })}
              maxLength={300}
              className="mt-1.5"
            />
            <FieldError message={errors.short_description} />
          </div>

          <AgendaBuilder agenda={values.agenda} onChange={(agenda) => setValues({ agenda })} />
          <SpeakersBuilder
            speakers={values.speakers}
            onChange={(speakers) => setValues({ speakers })}
          />

          <div>
            <Label className="text-sm font-medium">Dress code</Label>
            <Select
              value={values.dress_code || undefined}
              onValueChange={(v) => setValues({ dress_code: v })}
            >
              <SelectTrigger className="mt-1.5 w-56">
                <SelectValue placeholder="No dress code" />
              </SelectTrigger>
              <SelectContent>
                {DRESS_CODES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.dress_code} />
          </div>

          {/* Admin-only — DNA-internal flagship flag (ROADMAP). */}
          {isAdmin && (
            <ConsequenceChoice
              label="DNA flagship (admins only)"
              options={[
                { value: false, label: 'Regular community event' },
                { value: true, label: 'Flagship — featured across DNA' },
              ]}
              value={values.is_flagship}
              onChange={(v) => setValues({ is_flagship: v })}
            />
          )}
        </>
      )}

      {/* ============ ACTIONS ============ */}
      <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
        {mode === 'edit' && !isTerminal && (
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => setShowCancelDialog(true)}
            className="mr-auto text-destructive hover:text-destructive"
          >
            Cancel event…
          </Button>
        )}
        {mode === 'edit' && isTerminal && (
          <Button
            type="button"
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => setShowDeleteDialog(true)}
            className="mr-auto text-destructive hover:text-destructive"
          >
            Delete permanently…
          </Button>
        )}
        {actions}
      </div>

      {/* Cancel dialog — the reason is content; keep it. */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this event?</AlertDialogTitle>
            <AlertDialogDescription>
              Attendees will see the event as cancelled, along with your reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Why is it cancelled? People made plans — tell them."
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Keep the event</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCancelDialog(false);
                void cancelEvent(cancelReason);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Cancel event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete dialog — folded in from the settings page's danger zone. */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the event and everything attached to it — registrations, check-ins,
              analytics. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDeleteDialog(false);
                void deleteEvent().then((ok) => ok && onDeleted?.());
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default EventForm;
