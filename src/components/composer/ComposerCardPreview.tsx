/**
 * ComposerCardPreview — you see what you're making
 *
 * The composer's differentiator. The member writes, and the card they are
 * creating assembles in front of them: the bevel takes the C's color, the proof
 * block fills, the actions appear.
 *
 * This is not decoration. It is the reason the structured fields are worth
 * filling — the member can see what each field *does*, so "Impact" stops being
 * a form field and becomes the line that will make someone act.
 *
 * Mirrors the real feed cards (BD083 palette, BD085 card standard: numbers only
 * in the proof block, engagement row always four verbs).
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Calendar, MapPin, MessageCircle, Bookmark, Repeat2, Smile, Zap } from 'lucide-react';
import { ComposerMode, modeConfig } from '@/config/composerModes';
import { cn } from '@/lib/utils';

interface ComposerCardPreviewProps {
  mode: ComposerMode;
  body: string;
  fields: Record<string, string>;
  author: { name: string; avatarUrl?: string | null };
  mediaPreviewUrl?: string | null;
}

const SUBTITLE: Record<ComposerMode, (f: Record<string, string>) => string> = {
  connect: () => 'Seeking',
  event: () => 'Hosting',
  space: () => 'Recruiting',
  need: (f) => (f.direction === 'need' ? 'Need' : 'Offering'),
  story: () => 'Story',
};

const ACTIONS: Record<ComposerMode, (f: Record<string, string>) => [string, string]> = {
  connect: () => ['I can help', 'Introduce'],
  event: () => ['RSVP', 'Details'],
  space: () => ['Request to join', 'View Space'],
  need: (f) => [f.direction === 'need' ? 'I can fill this' : 'Request this', 'Refer'],
  story: () => ['', ''],
};

export const ComposerCardPreview: React.FC<ComposerCardPreviewProps> = ({
  mode,
  body,
  fields,
  author,
  mediaPreviewUrl,
}) => {
  const cfg = modeConfig(mode);
  const token = cfg.bevelToken; // e.g. 'bevel-story'
  const isNeed = fields.direction === 'need';
  const [primary, secondary] = ACTIONS[mode](fields);

  return (
    <div
      className={cn(
        'rounded-xl border-4 bg-card px-4 py-3 transition-colors duration-300',
        `border-${token}`
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2.5">
        <Avatar className="h-9 w-9">
          <AvatarImage src={author.avatarUrl || ''} />
          <AvatarFallback className="text-xs">
            {author.name[0]?.toUpperCase() ?? 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{author.name}</p>
          <p className="text-xs text-muted-foreground">
            <span className={cn('font-semibold', `text-${token}`)}>{cfg.cName}</span>
            {' · '}
            {SUBTITLE[mode](fields)}
            {' · now'}
          </p>
        </div>
      </div>

      {/* Kicker */}
      {mode === 'need' && fields.kind && (
        <span
          className={cn(
            'mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            `bg-${token}/15 text-${token}`
          )}
        >
          {fields.kind}
          {isNeed ? ' needed' : ''}
        </span>
      )}
      {mode === 'space' && fields.type && (
        <span
          className={cn(
            'mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            `bg-${token}/10 text-${token}`
          )}
        >
          {fields.type}
        </span>
      )}
      {mode === 'connect' && fields.intent && (
        <span
          className={cn(
            'mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            `bg-${token}/10 text-${token}`
          )}
        >
          {fields.intent}
        </span>
      )}

      {/* Title */}
      {fields.title && (
        <p
          className={cn(
            'mb-1.5 font-semibold leading-snug',
            mode === 'story' ? 'font-serif text-lg' : 'text-[15px]'
          )}
        >
          {fields.title}
        </p>
      )}

      {/* Body */}
      <p
        className={cn(
          'whitespace-pre-wrap break-words text-sm leading-relaxed',
          body ? 'text-muted-foreground' : 'italic text-muted-foreground/60'
        )}
      >
        {body || 'Start writing, and your card builds itself…'}
      </p>

      {mediaPreviewUrl && (
        <div className="mt-3 h-32 overflow-hidden rounded-lg">
          <img src={mediaPreviewUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Convene facts */}
      {mode === 'event' && (fields.when || fields.where) && (
        <div className="mt-2.5 flex flex-col gap-1 text-xs text-muted-foreground">
          {fields.when && (
            <span className="flex items-center gap-2">
              <Calendar className={cn('h-3.5 w-3.5', `text-${token}`)} />
              {fields.when}
            </span>
          )}
          {fields.where && (
            <span className="flex items-center gap-2">
              <MapPin className={cn('h-3.5 w-3.5', `text-${token}`)} />
              {fields.where}
            </span>
          )}
        </div>
      )}

      {/* PROOF — Contribute's give → to → impact (BD084) */}
      {mode === 'need' && (
        <div className="mt-2.5 flex items-stretch gap-1.5 rounded-lg bg-muted/50 p-2.5">
          {[
            { label: isNeed ? 'Need' : 'Give', value: fields.give },
            { label: isNeed ? 'For' : 'To', value: fields.to },
            { label: 'Impact', value: fields.impact },
          ].map((step, i) => (
            <React.Fragment key={step.label}>
              {i > 0 && (
                <div className={cn('flex items-center', `text-${token}`)}>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="min-w-0 flex-1 text-center">
                <p className="text-[9.5px] uppercase tracking-wide text-muted-foreground">
                  {step.label}
                </p>
                <p
                  className={cn(
                    'mt-0.5 truncate text-[11.5px] leading-tight',
                    step.value ? 'font-semibold' : 'text-muted-foreground'
                  )}
                >
                  {step.value || '—'}
                </p>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Collaborate roles */}
      {mode === 'space' && fields.roles && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {fields.roles.split(',').map((r) => (
            <span
              key={r}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px]',
                `bg-${token}/10 text-${token}`
              )}
            >
              <Zap className="h-3 w-3" />
              {r.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      {primary && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled
            className={cn(
              'flex-1 rounded-md py-1.5 text-xs font-semibold text-white',
              `bg-${token}`,
              mode === 'need' && 'text-[#3d2f05]'
            )}
          >
            {primary}
          </button>
          <button
            type="button"
            disabled
            className={cn(
              'rounded-md border px-3 py-1.5 text-xs font-semibold',
              `border-${token} text-${token}`
            )}
          >
            {secondary}
          </button>
        </div>
      )}

      {/* Engagement — always four verbs (BD085) */}
      <div className="mt-3 flex items-center justify-between border-t pt-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Smile className="h-3.5 w-3.5" />
          React
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          Comment
        </span>
        <span className="flex items-center gap-1">
          <Repeat2 className="h-3.5 w-3.5" />
          Reshare
        </span>
        <span className="flex items-center gap-1">
          <Bookmark className="h-3.5 w-3.5" />
          Save
        </span>
      </div>
    </div>
  );
};
