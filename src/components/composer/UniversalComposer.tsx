/**
 * DNA Universal Composer — Phase C rebuild (BD085/BD087)
 *
 * The member writes first. Everything else follows the writing:
 *
 *   ┌──────────────────────────────┬──────────────────┐
 *   │  Verb rail (arrows)          │                  │
 *   │  Textarea — always first     │   LIVE CARD      │
 *   │  DIA line (quiet, one line)  │   PREVIEW        │
 *   │  Fields for this verb        │                  │
 *   │  Tools · Draft · POST        │                  │
 *   └──────────────────────────────┴──────────────────┘
 *
 * Desktop: two columns. Mobile: the preview collapses to a "See your card"
 * toggle below the fields — never a second scroll region competing with the
 * writing surface.
 *
 * DIA ACTS. IT DOES NOT ASK. It reads the draft (dia-compose-read), flips the
 * verb, and fills the fields — reporting on one quiet line. The member can
 * always override via the rail, and any field they touch is theirs forever.
 *
 * SPACE COMPOSES INLINE (reversal of BD087): picking Start a Collaboration
 * renders fields right here; submit calls the Spaces substrate. No navigation.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useDIACompose } from '@/hooks/useDIACompose';
import { ComposerMode, ComposerContext, ComposerFormData } from '@/hooks/useUniversalComposer';
import type { ComposerSuccessData } from '@/hooks/useUniversalComposer';
import { DEFAULT_MODE, modeConfig } from '@/config/composerModes';
import { MODE_HANDLERS } from './modeHandlers';
import { ComposerVerbRail } from './ComposerVerbRail';
import { ComposerFields } from './ComposerFields';
import { ComposerCardPreview } from './ComposerCardPreview';
import { MediaUploadButton } from './fields/MediaUploadButton';
import { parseNaturalWhen } from '@/lib/parseNaturalWhen';
import { cn } from '@/lib/utils';

interface UniversalComposerProps {
  isOpen: boolean;
  mode: ComposerMode;
  context: ComposerContext;
  isSubmitting: boolean;
  successData: ComposerSuccessData | null;
  onClose: () => void;
  onModeChange: (mode: ComposerMode) => void;
  onSubmit: (formData: ComposerFormData) => void;
  onDismissSuccess: () => void;
}

/** Post button fill per verb — literal classes, legible on every fill. */
const POST_FILL: Record<ComposerMode, string> = {
  connect: 'bg-bevel-connect hover:bg-bevel-connect/90 text-white',
  event: 'bg-bevel-event hover:bg-bevel-event/90 text-white',
  space: 'bg-bevel-space hover:bg-bevel-space/90 text-white',
  need: 'bg-bevel-opportunity hover:bg-bevel-opportunity/90 text-[#3d2f05]',
  story: 'bg-bevel-story hover:bg-bevel-story/90 text-white',
};

const FORMAT_TO_DB: Record<string, 'in_person' | 'virtual' | 'hybrid'> = {
  'In person': 'in_person',
  Virtual: 'virtual',
  Hybrid: 'hybrid',
};

interface DraftV2 {
  mode: ComposerMode;
  body: string;
  fields: Record<string, string>;
  mediaUrl?: string;
  savedAt: number;
}

const draftKey = (userId: string) => `dna.composer.v2.${userId}`;

export const UniversalComposer = ({
  isOpen,
  mode,
  context,
  isSubmitting,
  successData,
  onClose,
  onModeChange,
  onSubmit,
  onDismissSuccess,
}: UniversalComposerProps) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const userId = user?.id ?? '';

  const [body, setBody] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [mediaUrl, setMediaUrl] = useState<string | undefined>(undefined);
  const [userPickedVerb, setUserPickedVerb] = useState(false);
  const [ownedByAuthor, setOwnedByAuthor] = useState<Set<string>>(new Set());
  const [previewOpenMobile, setPreviewOpenMobile] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);

  const hydratedRef = useRef(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const { proposal, isReading, diaFilled, releaseField, reset } = useDIACompose({
    text: body,
    userPickedVerb,
    ownedByAuthor,
    enabled: isOpen && !successData,
  });

  // DIA acts. It does not ask. (The member can always override via the rail.)
  useEffect(() => {
    if (!proposal) return;
    if (!userPickedVerb && proposal.verb !== mode) onModeChange(proposal.verb);
    setFields((prev) => {
      const next = { ...prev };
      Object.entries(proposal.fields).forEach(([k, v]) => {
        if (!ownedByAuthor.has(k)) next[k] = v;
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposal]);

  // The author touches a field → it is theirs forever.
  const editField = useCallback(
    (k: string, v: string) => {
      setFields((f) => ({ ...f, [k]: v }));
      setOwnedByAuthor((s) => new Set(s).add(k));
      releaseField(k);
    },
    [releaseField]
  );

  const pickVerb = useCallback(
    (m: ComposerMode) => {
      setUserPickedVerb(true);
      onModeChange(m);
    },
    [onModeChange]
  );

  // "not this?" — revert to Convey and let the member drive.
  const rejectProposal = useCallback(() => {
    setUserPickedVerb(true);
    onModeChange(DEFAULT_MODE);
  }, [onModeChange]);

  const clearAll = useCallback(() => {
    setBody('');
    setFields({});
    setMediaUrl(undefined);
    setUserPickedVerb(false);
    setOwnedByAuthor(new Set());
    setPreviewOpenMobile(false);
    setDraftSavedAt(null);
    reset();
  }, [reset]);

  // ---- Draft: refresh-safe, quiet, one per member -------------------------
  useEffect(() => {
    if (!isOpen || !userId || successData) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey(userId));
      if (!raw) return;
      const draft = JSON.parse(raw) as DraftV2;
      if (!draft?.body?.trim()) return;
      setBody(draft.body);
      setFields(draft.fields ?? {});
      setMediaUrl(draft.mediaUrl);
      setDraftSavedAt(draft.savedAt ?? null);
      // Restored fields are the author's — DIA does not overwrite a draft.
      setOwnedByAuthor(new Set(Object.keys(draft.fields ?? {})));
      if (draft.mode && draft.mode !== mode) onModeChange(draft.mode);
    } catch {
      // Unreadable draft — start clean.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, userId, successData]);

  useEffect(() => {
    if (!isOpen) hydratedRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !userId || successData) return;
    clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        if (body.trim()) {
          const draft: DraftV2 = { mode, body, fields, mediaUrl, savedAt: Date.now() };
          localStorage.setItem(draftKey(userId), JSON.stringify(draft));
          setDraftSavedAt(draft.savedAt);
        } else {
          localStorage.removeItem(draftKey(userId));
          setDraftSavedAt(null);
        }
      } catch {
        // Storage full/blocked — drafting is best-effort.
      }
    }, 600);
    return () => clearTimeout(draftTimerRef.current);
  }, [body, fields, mediaUrl, mode, isOpen, userId, successData]);

  // ---- Success: DIA doesn't ceremonize. Close, toast, clear. ---------------
  useEffect(() => {
    if (!successData) return;
    if (userId) {
      try {
        localStorage.removeItem(draftKey(userId));
      } catch {
        // best-effort
      }
    }
    clearAll();
    onDismissSuccess(); // closes the composer and shows the verb's toast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successData]);

  // ---- Submit: route by verb to the substrate ------------------------------
  const buildFormData = useCallback((): ComposerFormData | null => {
    const base: ComposerFormData = { content: body, mediaUrl };

    switch (mode) {
      case 'story':
        return { ...base, title: fields.title?.trim() || undefined };

      case 'connect':
        return {
          ...base,
          intent: fields.intent?.trim() || undefined,
          where: fields.where?.trim() || undefined,
        };

      case 'need':
        return {
          ...base,
          direction: fields.direction === 'need' ? 'need' : 'offer',
          category: fields.kind || undefined,
          giveWhat: fields.give || undefined,
          giveTo: fields.to || undefined,
          intendedImpact: fields.impact || undefined,
        };

      case 'space':
        return {
          ...base,
          title: fields.title?.trim() || undefined,
          spaceCategory: fields.type || undefined,
          skillsNeeded: fields.roles
            ? fields.roles.split(',').map((r) => r.trim()).filter(Boolean)
            : [],
        };

      case 'event': {
        const parsed = fields.when ? parseNaturalWhen(fields.when) : null;
        if (fields.when && !parsed) {
          toast('DIA couldn’t read that date', {
            description: 'Try something like "Mar 15, 6:00pm" or "Saturday at 6pm".',
          });
          return null;
        }
        return {
          ...base,
          title: fields.title?.trim() || undefined,
          eventDate: parsed?.date,
          eventTime: parsed?.time,
          location: fields.where || undefined,
          format: FORMAT_TO_DB[fields.format] ?? 'in_person',
        };
      }
    }
  }, [mode, body, fields, mediaUrl]);

  const handleSubmit = useCallback(() => {
    const formData = buildFormData();
    if (!formData) return;
    onSubmit(formData);
  }, [buildFormData, onSubmit]);

  // ---- DIA line ------------------------------------------------------------
  const diaLine = useMemo(() => {
    if (isReading) {
      return <span className="text-muted-foreground">DIA is reading…</span>;
    }
    if (userPickedVerb) {
      const cfg = modeConfig(mode);
      return (
        <span className="text-muted-foreground">
          Posting as <span className="font-semibold text-foreground">{cfg.label}</span>
          {' · '}
          {cfg.cName}
        </span>
      );
    }
    if (proposal) {
      const cfg = modeConfig(proposal.verb);
      return (
        <span className="text-muted-foreground">
          DIA read this as <span className="font-semibold text-foreground">{cfg.label}</span>
          {' · '}
          {cfg.cName}
          <button
            type="button"
            onClick={rejectProposal}
            className="ml-2 underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            not this?
          </button>
        </span>
      );
    }
    return null;
  }, [isReading, userPickedVerb, proposal, mode, rejectProposal]);

  const handler = MODE_HANDLERS[mode];
  const canPost = body.trim().length > 0 && !isSubmitting;

  const disabledModes: ComposerMode[] = [
    ...(context.eventId ? (['event'] as ComposerMode[]) : []),
    ...(context.spaceId ? (['space'] as ComposerMode[]) : []),
  ];

  const author = {
    name: profile?.display_name || profile?.username || 'You',
    avatarUrl: profile?.avatar_url,
  };

  const preview = (
    <ComposerCardPreview
      mode={mode}
      body={body}
      fields={fields}
      author={author}
      mediaPreviewUrl={mediaUrl}
    />
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose]
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-[96vw] max-w-[96vw] flex-col gap-0 p-0 sm:w-[860px] sm:max-w-[860px]"
        style={{ height: '100dvh', maxHeight: '100dvh' }}
      >
        <SheetHeader className="flex-shrink-0 border-b bg-background px-4 pb-3 pt-4 text-left sm:px-6">
          <SheetTitle className="font-serif text-xl font-semibold tracking-tight text-dna-emerald sm:text-2xl">
            Share something with the diaspora
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 py-4 sm:px-6">
          <div className="flex w-full items-start gap-5">
            {/* ---- Writing column ---- */}
            <div className="min-w-0 flex-1 space-y-3">
              <ComposerVerbRail mode={mode} onPick={pickVerb} disabledModes={disabledModes} />

              {/* Textarea — always first. Writing is the whole point. */}
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={modeConfig(mode).placeholder}
                autoFocus
                className="min-h-[120px] resize-y text-[15px] leading-relaxed"
              />

              {/* The DIA line — it reports; it does not interrupt. */}
              <div className="flex min-h-[18px] items-center gap-1.5 text-xs" aria-live="polite">
                {diaLine && <Sparkles className="h-3 w-3 flex-shrink-0 text-bevel-opportunity" />}
                {diaLine}
              </div>

              <ComposerFields
                mode={mode}
                values={fields}
                diaFilled={diaFilled}
                onChange={editField}
              />

              {/* Mobile: the card is a toggle, never a second scroll region. */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setPreviewOpenMobile((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground"
                >
                  See your card
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', previewOpenMobile && 'rotate-180')}
                  />
                </button>
                {previewOpenMobile && <div className="mt-2">{preview}</div>}
              </div>
            </div>

            {/* ---- Live card preview (desktop) ---- */}
            <div className="sticky top-0 hidden w-[300px] flex-shrink-0 lg:block">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                Your card, as the diaspora sees it
              </p>
              {preview}
            </div>
          </div>
        </div>

        {/* ---- Tools · Draft · POST ---- */}
        <div
          className="flex-shrink-0 border-t bg-background px-4 pt-3 sm:px-6"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}
        >
          <div className="flex items-center gap-2">
            <MediaUploadButton
              label=""
              onUpload={setMediaUrl}
              currentMediaUrl={mediaUrl}
              onRemove={() => setMediaUrl(undefined)}
            />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
              {draftSavedAt ? 'Draft saved' : ''}
            </span>
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {/* Every verb has one. Labeled for what it does. */}
            <Button
              onClick={handleSubmit}
              disabled={!canPost}
              className={cn('min-h-[44px] min-w-[130px] font-semibold', POST_FILL[mode])}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? handler.submittingLabel : handler.submitLabel}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
