/**
 * DNA Post Composer — Universal Gateway
 *
 * A single, unified creation interface that transforms based on user intent
 * across all Five C's (CONNECT, CONVENE, COLLABORATE, CONTRIBUTE, CONVEY).
 *
 * Mobile: vaul Drawer bottom sheet (swipe to dismiss, drag handle, sticky footer)
 * Desktop: centered modal (600px max width)
 *
 * Sprint 3A:
 * - Replaced Sheet with vaul Drawer for mobile (proper swipe-to-dismiss)
 * - Uses MODE_HANDLERS for validation (replaces switch/case)
 * - Mode switch text preservation (shared content + per-mode field caching)
 * - Inline validation errors with friendly messages
 *
 * Sprint 3B:
 * - Success screen replaces form after publish (celebration + DIA next action)
 * - DIA intent detection suggests mode switch while user types
 * - First-time onboarding tooltips on mode chips
 */

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ComposerMode, ComposerContext, ComposerFormData } from '@/hooks/useUniversalComposer';
import type { ComposerSuccessData } from '@/hooks/useUniversalComposer';
import { ComposerModeSelector } from './ComposerModeSelector';
import { ComposerBody } from './ComposerBody';
import { ComposerFooter } from './ComposerFooter';
import { DIASuggestionBar } from './DIASuggestionBar';
import { DraftStatusIndicator } from './draft/DraftStatusIndicator';
import { DiscardDraftConfirmation } from './draft/DiscardDraftConfirmation';
import { DraftConflictDialog } from './draft/DraftConflictDialog';
import { ComposerSuccessScreen } from './ComposerSuccessScreen';
import { DIAIntentBar } from './DIAIntentBar';
import { ComposerOnboarding, useComposerOnboarding } from './ComposerOnboarding';
import { MODE_HANDLERS } from './modeHandlers';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Hash, Calendar, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';
import { diaComposerService } from '@/services/diaComposerService';
import { detectIntent, type IntentSuggestion } from '@/services/diaIntentDetectionService';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/contexts/AuthContext';
import {
  saveDraft as saveLocalDraft,
  loadDraftWithMeta,
  clearDraft as clearLocalDraft,
} from '@/lib/composerDraftStorage';
import { useDraftStatus, formatRelative } from '@/hooks/composer/useDraftStatus';
import { trackComposerEvent, ageMinutes, type DiscardSource } from '@/lib/composerAnalytics';
import type { PostCreationSuggestion } from '@/services/diaPostCreationService';
import { ComposerMode as PRDComposerMode, type DIASuggestion } from '@/types/composer';
import type { ValidationResult } from './modeHandlers';


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
  // Shared content that persists across mode switches
  const [sharedContent, setSharedContent] = useState('');
  const [sharedMedia, setSharedMedia] = useState<string | undefined>(undefined);

  // Per-mode field cache: preserved when switching away, restored when switching back
  const [modeFieldCache, setModeFieldCache] = useState<Partial<Record<ComposerMode, Partial<ComposerFormData>>>>({});

  // Current form data (composed from shared + mode-specific)
  const [formData, setFormData] = useState<ComposerFormData>({ content: '' });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [diaSuggestion, setDiaSuggestion] = useState<DIASuggestion | null>(null);

  // Draft affordances state (PRD: Universal Composer Draft Affordances)
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [contentVersion, setContentVersion] = useState(0);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [discardSource, setDiscardSource] = useState<DiscardSource>('indicator_menu');
  // Track recent discard to suppress restore toast for 60s after a confirm.
  const lastDiscardAtRef = useRef<number>(0);

  const diaDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const prevModeRef = useRef<ComposerMode>(mode);
  // Remember the element that opened the composer so we can return focus on close
  const triggerElementRef = useRef<HTMLElement | null>(null);


  // Sprint 3B: Intent detection state
  const [intentSuggestion, setIntentSuggestion] = useState<IntentSuggestion | null>(null);
  const [dismissedModes, setDismissedModes] = useState<Set<ComposerMode>>(new Set());
  const debouncedContent = useDebounce(sharedContent, 500);

  // Sprint 3B: Onboarding
  const { isFirstTime, markComplete } = useComposerOnboarding();

  // Navigation for DIA actions - called unconditionally per Rules of Hooks
  const navigate = useNavigate();

  // Local draft persistence (refresh-safe). Per-user + per-mode.
  const { user } = useAuth();
  const userId = user?.id ?? '';
  // Tracks which (user, mode) tuples we have already hydrated this open-session
  const hydratedKeysRef = useRef<Set<string>>(new Set());
  const localDraftDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Mode switch text preservation
  useEffect(() => {
    const prevMode = prevModeRef.current;
    if (prevMode === mode) return;

    // Cache current mode-specific fields before switching
    setModeFieldCache(prev => ({
      ...prev,
      [prevMode]: { ...formData, content: undefined, mediaUrl: undefined },
    }));

    // Restore cached fields for the new mode, or use defaults
    const cachedFields = modeFieldCache[mode];
    const defaults = MODE_HANDLERS[mode].getDefaultValues();

    setFormData({
      ...defaults,
      ...cachedFields,
      content: sharedContent,
      mediaUrl: sharedMedia,
    });

    prevModeRef.current = mode;
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // DIA ambient analysis: analyze content as user types
  useEffect(() => {
    if (!formData.content || formData.content.length < 50) {
      setDiaSuggestion(null);
      return;
    }

    if (diaDebounceRef.current) {
      clearTimeout(diaDebounceRef.current);
    }

    diaDebounceRef.current = setTimeout(async () => {
      const prdMode = mode as unknown as PRDComposerMode;
      const suggestion = await diaComposerService.analyzeContent(
        formData.content,
        prdMode
      );
      setDiaSuggestion(suggestion);
    }, 1500);

    return () => {
      if (diaDebounceRef.current) clearTimeout(diaDebounceRef.current);
    };
  }, [formData.content, mode]);

  // Sprint 3B: Intent detection — runs on debounced content, separate from DIA ambient
  useEffect(() => {
    if (debouncedContent.length < 30) {
      setIntentSuggestion(null);
      return;
    }

    const suggestion = detectIntent(debouncedContent, mode, {
      dismissedModes,
      confidenceThreshold: 0.7,
    });

    setIntentSuggestion(suggestion);
  }, [debouncedContent, mode, dismissedModes]);

  // Reset intent state when composer opens/closes
  useEffect(() => {
    if (!isOpen) {
      setIntentSuggestion(null);
      setDismissedModes(new Set());
      setHasAttemptedSubmit(false);
    }
  }, [isOpen]);

  // Reset submit-attempt flag when switching modes (validation rules differ)
  useEffect(() => {
    setHasAttemptedSubmit(false);
  }, [mode]);

  // Focus management: capture the trigger element when opening, restore focus on close.
  // Honors prefers-reduced-motion implicitly via instant focus().
  useEffect(() => {
    if (isOpen) {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        triggerElementRef.current = active;
      }
    } else if (triggerElementRef.current) {
      // Defer to allow drawer unmount + portal removal
      const target = triggerElementRef.current;
      triggerElementRef.current = null;
      requestAnimationFrame(() => {
        try { target.focus({ preventScroll: true }); } catch { /* element gone */ }
      });
    }
  }, [isOpen]);

  // Local draft hydration: when the composer opens or the active mode changes,
  // restore the last persisted draft for (user, mode) if there is no
  // in-memory work for that mode yet. Surfaces the Draft Restored Toast.
  useEffect(() => {
    if (!isOpen || !userId || successData) return;
    const key = `${userId}:${mode}`;
    if (hydratedKeysRef.current.has(key)) return;
    hydratedKeysRef.current.add(key);

    // Don't clobber an in-flight cache for this mode (e.g. user just switched
    // away and back without refresh).
    if (modeFieldCache[mode]) return;

    const meta = loadDraftWithMeta(userId, mode);
    if (!meta) return;

    setFormData(meta.data);
    if (typeof meta.data.content === 'string') setSharedContent(meta.data.content);
    if ('mediaUrl' in meta.data) setSharedMedia(meta.data.mediaUrl);
    setDraftSavedAt(meta.savedAt);

    // Suppress the toast for 60s after a discard so users don't see it
    // immediately reappear after confirmation.
    const suppressed = Date.now() - lastDiscardAtRef.current < 60_000;
    if (suppressed) return;

    const modeLabel = MODE_LABELS[mode] ?? 'Draft';
    toast(`${modeLabel} draft restored`, {
      description: formatRelative(meta.savedAt),
      duration: 5000,
      action: {
        label: 'Discard',
        onClick: () => {
          setDiscardSource('toast');
          setDiscardOpen(true);
          trackComposerEvent({
            type: 'composer_draft_discard_prompted',
            mode,
            source: 'toast',
          });
        },
      },
    });
    trackComposerEvent({
      type: 'composer_draft_restored',
      mode,
      age_minutes: ageMinutes(meta.savedAt),
    });
  }, [isOpen, userId, mode, successData, modeFieldCache]);

  // Reset hydration tracking each time the composer is closed so the next
  // open re-checks storage for the freshest draft.
  useEffect(() => {
    if (!isOpen) hydratedKeysRef.current.clear();
  }, [isOpen]);

  // Bump content version on every formData change so the status indicator
  // can transition to "saving" immediately.
  useEffect(() => {
    setContentVersion((v) => v + 1);
  }, [formData]);

  // Persist current form data locally (debounced). Storage helper decides
  // whether the data is meaningful enough to keep.
  useEffect(() => {
    if (!isOpen || !userId || successData) return;
    if (localDraftDebounceRef.current) clearTimeout(localDraftDebounceRef.current);
    localDraftDebounceRef.current = setTimeout(() => {
      try {
        saveLocalDraft(userId, mode, formData);
        setDraftSavedAt(Date.now());
      } catch {
        trackComposerEvent({
          type: 'composer_draft_save_failed',
          mode,
          reason: 'unknown',
        });
      }
    }, 600);
    return () => {
      if (localDraftDebounceRef.current) clearTimeout(localDraftDebounceRef.current);
    };
  }, [formData, mode, isOpen, userId, successData]);

  // ---- Cross-tab draft conflict detection ----
  // The 'storage' event only fires for changes made in OTHER tabs/windows, so
  // any matching key change here is a genuine external edit.
  const [conflict, setConflict] = useState<{
    otherData: ComposerFormData;
    otherSavedAt: number;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !userId || successData) return;
    const expectedKey = `dna.composer.draft.v1.${userId}.${mode}`;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== expectedKey || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as { savedAt: number; data: ComposerFormData };
        if (!parsed?.savedAt || !parsed?.data) return;
        // Only flag as conflict if it's newer than our latest save AND content differs
        if (draftSavedAt && parsed.savedAt <= draftSavedAt) return;
        if ((parsed.data.content ?? '') === (formData.content ?? '')
          && parsed.data.mediaUrl === formData.mediaUrl) return;
        setConflict({ otherData: parsed.data, otherSavedAt: parsed.savedAt });
      } catch {
        // Ignore malformed payloads
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isOpen, userId, mode, successData, draftSavedAt, formData.content, formData.mediaUrl]);

  const handleKeepThisTab = useCallback(() => {
    // Overwrite the shared key with our local version so other tabs converge.
    if (userId) {
      try { saveLocalDraft(userId, mode, formData); } catch { /* ignore */ }
      setDraftSavedAt(Date.now());
    }
    setConflict(null);
  }, [userId, mode, formData]);

  const handleUseOtherTab = useCallback(() => {
    if (!conflict) return;
    setFormData(conflict.otherData);
    if (typeof conflict.otherData.content === 'string') setSharedContent(conflict.otherData.content);
    if ('mediaUrl' in conflict.otherData) setSharedMedia(conflict.otherData.mediaUrl);
    setDraftSavedAt(conflict.otherSavedAt);
    setConflict(null);
    toast('Loaded version from other tab', { duration: 3000 });
  }, [conflict]);


  // On successful publish (successData set), drop the persisted draft for
  // that mode so we don't re-hydrate stale content next time.
  useEffect(() => {
    if (successData && userId) {
      clearLocalDraft(userId, successData.mode);
      if (draftSavedAt) {
        trackComposerEvent({
          type: 'composer_published_with_draft',
          mode: successData.mode,
          draft_age_minutes: ageMinutes(draftSavedAt),
        });
      }
      setDraftSavedAt(null);
    }
  }, [successData, userId, draftSavedAt]);

  // Drive the visible status indicator from save signals.
  const hasMeaningfulDraft = useMemo(() => {
    if (formData.content && formData.content.trim().length > 0) return true;
    if (formData.title && formData.title.trim().length > 0) return true;
    if (formData.mediaUrl) return true;
    return false;
  }, [formData.content, formData.title, formData.mediaUrl]);

  const draftStatus = useDraftStatus({
    hasContent: hasMeaningfulDraft,
    contentVersion,
    savedAt: draftSavedAt,
  });

  // When true, after discard we also close the composer (Cancel-with-unsaved flow)
  const closeAfterDiscardRef = useRef(false);

  const handleDiscardConfirm = useCallback(() => {
    if (userId) clearLocalDraft(userId, mode);
    const handler = MODE_HANDLERS[mode];
    setFormData({ ...handler.getDefaultValues(), content: '' });
    setSharedContent('');
    setSharedMedia(undefined);
    setModeFieldCache((prev) => {
      const next = { ...prev };
      delete next[mode];
      return next;
    });
    const ageM = draftSavedAt ? ageMinutes(draftSavedAt) : 0;
    setDraftSavedAt(null);
    setDiscardOpen(false);
    lastDiscardAtRef.current = Date.now();
    toast.success('Draft discarded', { duration: 3000 });
    trackComposerEvent({
      type: 'composer_draft_discarded',
      mode,
      age_minutes: ageM,
      source: discardSource,
    });
    if (closeAfterDiscardRef.current) {
      closeAfterDiscardRef.current = false;
      onClose();
    }
  }, [userId, mode, draftSavedAt, discardSource, onClose]);

  // Cancel button: confirm if there's unsaved content, otherwise close immediately
  const handleCancelClick = useCallback(() => {
    if (hasMeaningfulDraft) {
      closeAfterDiscardRef.current = true;
      setDiscardSource('indicator_menu');
      setDiscardOpen(true);
      trackComposerEvent({
        type: 'composer_draft_discard_prompted',
        mode,
        source: 'indicator_menu',
      });
    } else {
      onClose();
    }
  }, [hasMeaningfulDraft, mode, onClose]);

  const handleDiscardCancel = useCallback(() => {
    setDiscardOpen(false);
    closeAfterDiscardRef.current = false;
    trackComposerEvent({
      type: 'composer_draft_discard_cancelled',
      mode,
      source: discardSource,
    });
  }, [mode, discardSource]);

  const openDiscardFromIndicator = useCallback(() => {
    setDiscardSource('indicator_menu');
    setDiscardOpen(true);
    trackComposerEvent({
      type: 'composer_draft_discard_prompted',
      mode,
      source: 'indicator_menu',
    });
  }, [mode]);

  // Keyboard shortcut: Cmd/Ctrl + Shift + D opens the discard prompt while
  // the composer is open and the user has unsaved content.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const isShortcut =
        (e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'd' || e.key === 'D');
      if (!isShortcut) return;
      if (!hasMeaningfulDraft) return;
      e.preventDefault();
      openDiscardFromIndicator();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, hasMeaningfulDraft, openDiscardFromIndicator]);


  const handleSubmit = () => {
    // Client-side validation via MODE_HANDLERS (replaces switch/case)
    const handler = MODE_HANDLERS[mode];
    const validation: ValidationResult = handler.validate(formData);
    setHasAttemptedSubmit(true);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Scroll to first error field
      const firstErrorField = Object.keys(validation.errors)[0];
      document.getElementById(`composer-field-${firstErrorField}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    // Clear validation errors and submit
    setValidationErrors({});
    onSubmit(formData);
    setDiaSuggestion(null);
    setIntentSuggestion(null);
  };

  // Sprint 3B: Clear form data when success screen is dismissed
  const handleDismissSuccess = useCallback(() => {
    setFormData({ content: '' });
    setSharedContent('');
    setSharedMedia(undefined);
    setModeFieldCache({});
    setDiaSuggestion(null);
    setIntentSuggestion(null);
    onDismissSuccess();
  }, [onDismissSuccess]);

  // Sprint 3B: Handle DIA action from success screen
  const handleDIAAction = useCallback((suggestion: PostCreationSuggestion) => {
    handleDismissSuccess();
    if (suggestion.actionType === 'navigate' && suggestion.actionPayload.route) {
      navigate?.(suggestion.actionPayload.route);
    }
    // share and invite actions can be handled by future infrastructure
  }, [handleDismissSuccess, navigate]);

  const updateFormData = useCallback((updates: Partial<ComposerFormData>) => {
    setFormData(prev => {
      const next = { ...prev, ...updates };
      return next;
    });
    // Keep shared content in sync
    if ('content' in updates && updates.content !== undefined) {
      setSharedContent(updates.content);
    }
    if ('mediaUrl' in updates) {
      setSharedMedia(updates.mediaUrl);
    }
    // Clear specific field errors when the user types
    const fieldKeys = Object.keys(updates);
    if (fieldKeys.length > 0) {
      setValidationErrors(prev => {
        const next = { ...prev };
        for (const key of fieldKeys) {
          delete next[key];
        }
        return next;
      });
    }
  }, []);

  const handleDIASuggestionAccept = useCallback((suggestion: DIASuggestion) => {
    if (suggestion.action.type === 'switch_mode') {
      const targetMode = suggestion.action.payload.targetMode as ComposerMode;
      onModeChange(targetMode);
    }
    setDiaSuggestion(null);
  }, [onModeChange]);

  const handleDIASuggestionDismiss = useCallback(() => {
    setDiaSuggestion(null);
  }, []);

  // Sprint 3B: Intent bar accept — switch mode with text preservation
  const handleIntentAccept = useCallback((suggestedMode: ComposerMode) => {
    onModeChange(suggestedMode);
    setIntentSuggestion(null);
  }, [onModeChange]);

  // Sprint 3B: Intent bar dismiss — track dismissed mode for this session
  const handleIntentDismiss = useCallback(() => {
    if (intentSuggestion) {
      setDismissedModes(prev => new Set([...prev, intentSuggestion.suggestedMode]));
    }
    setIntentSuggestion(null);
  }, [intentSuggestion]);

  // Validation via MODE_HANDLERS (replaces switch/case getValidationMessage)
  const getValidationState = (): { isValid: boolean; message: string | null } => {
    const handler = MODE_HANDLERS[mode];
    const validation = handler.validate(formData);
    if (validation.isValid) return { isValid: true, message: null };
    // Return the first error as the summary message
    const firstError = Object.values(validation.errors)[0];
    return { isValid: false, message: firstError || null };
  };

  const { isValid: formIsValid, message: validationMessage } = getValidationState();

  // Sprint 3B: If success data is present, show success screen instead of form
  const composerContent = successData ? (
    <ComposerSuccessScreen
      mode={successData.mode}
      createdId={successData.createdId}
      createdTitle={successData.createdTitle}
      formData={successData.formDataSnapshot}
      onDismiss={handleDismissSuccess}
      onDIAAction={handleDIAAction}
    />
  ) : null;

  // Separated scrollable body from sticky footer for mobile
  const composerBody = !successData ? (
    <div className="space-y-4 w-full max-w-full min-w-0">
      {/* Header: Mode Selector */}
      <div className="w-full min-w-0 relative">
        <ComposerModeSelector
          currentMode={mode}
          onModeChange={(newMode) => {
            onModeChange(newMode);
            // Sprint 3B: Mark onboarding complete on first mode interaction
            if (isFirstTime) markComplete();
          }}
          context={context}
        />
        {/* Sprint 3B: Onboarding overlay */}
        {isFirstTime && (
          <div className="absolute inset-0 z-10">
            <ComposerOnboarding
              isFirstTime={isFirstTime}
              onComplete={markComplete}
            />
          </div>
        )}
      </div>

      {/* Context Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm text-muted-foreground">
          {getSubheader(mode)}
        </p>
        {getContextBadge(context)}
      </div>

      {/* Body (mode-specific fields) */}
      <ComposerBody
        mode={mode}
        formData={formData}
        context={context}
        onChange={updateFormData}
        validationErrors={validationErrors}
      />

      {/* Sprint 3B: Intent Detection Bar — between text input and DIA suggestions */}
      {intentSuggestion && !diaSuggestion && (
        <DIAIntentBar
          suggestion={intentSuggestion}
          onAccept={handleIntentAccept}
          onDismiss={handleIntentDismiss}
        />
      )}

      {/* DIA Suggestion Bar (Sprint 3A ambient analysis) */}
      {diaSuggestion && (
        <DIASuggestionBar
          suggestion={diaSuggestion}
          onAccept={handleDIASuggestionAccept}
          onDismiss={handleDIASuggestionDismiss}
        />
      )}
    </div>
  ) : null;

  const composerFooter = !successData ? (
    <ComposerFooter
      mode={mode}
      isSubmitting={isSubmitting}
      isValid={formIsValid}
      validationMessage={validationMessage}
      hasAttemptedSubmit={hasAttemptedSubmit}
      onCancel={handleCancelClick}
      onSubmit={handleSubmit}
      leftSlot={
        <DraftStatusIndicator
          status={draftStatus.status}
          relativeTime={draftStatus.relativeTime}
          onDiscardClick={openDiscardFromIndicator}
        />
      }
    />
  ) : null;

  // Handle dismiss for both close and success screen dismiss
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      if (successData) {
        handleDismissSuccess();
      } else {
        onClose();
      }
    }
  }, [successData, handleDismissSuccess, onClose]);

  // Unified slide-in Sheet from the right (full-width on mobile, 480px panel on desktop)
  return (
    <>
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-[92vw] max-w-[92vw] sm:w-[520px] sm:max-w-[520px] p-0 flex flex-col gap-0"
          style={{ height: '100dvh', maxHeight: '100dvh' }}
        >
          <SheetHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 pb-3 border-b text-left bg-background">
            <SheetTitle id="composer-title" className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-dna-emerald">
              {successData ? 'Published!' : 'Share something with the diaspora'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 sm:px-6 py-4 min-h-0 w-full max-w-full">
            {composerContent || composerBody}
          </div>

          {composerFooter && (
            <div
              className="flex-shrink-0 px-4 sm:px-6 pt-3 pb-3 border-t bg-background shadow-[0_-4px_12px_-8px_rgba(0,0,0,0.1)] sticky bottom-0"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)' }}
            >
              {composerFooter}
            </div>
          )}
        </SheetContent>
      </Sheet>
      <DiscardDraftConfirmation
        open={discardOpen}
        mode={mode}
        source={discardSource}
        onConfirm={handleDiscardConfirm}
        onCancel={handleDiscardCancel}
      />
      <DraftConflictDialog
        open={!!conflict}
        thisTabSavedAt={draftSavedAt}
        otherTabSavedAt={conflict?.otherSavedAt ?? null}
        thisTabPreview={(formData.content ?? '').slice(0, 200)}
        otherTabPreview={(conflict?.otherData.content ?? '').slice(0, 200)}
        onKeepThisTab={handleKeepThisTab}
        onUseOtherTab={handleUseOtherTab}
      />
    </>
  );
};

const MODE_LABELS: Record<ComposerMode, string> = {
  post: 'Post',
  story: 'Story',
  event: 'Event',
  need: 'Need',
  space: 'Space',
  community: 'Community',
};

function getSubheader(mode: ComposerMode): string {
  switch (mode) {
    case 'post': return "What's on your mind?";
    case 'story': return 'Tell a longer narrative';
    case 'event': return 'Host something for the community';
    case 'need': return 'Ask for help or offer support';
    case 'space': return 'Start a space or project';
    case 'community': return 'Share with your community';
    default: return '';
  }
}

function getContextBadge(context: ComposerContext): React.ReactNode {
  if (context.spaceId) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Building2 className="h-3 w-3" />
        Posting in Space
      </Badge>
    );
  }
  if (context.eventId) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Calendar className="h-3 w-3" />
        Posting in Event
      </Badge>
    );
  }
  if (context.communityId) {
    return (
      <Badge variant="secondary" className="gap-1.5">
        <Users className="h-3 w-3" />
        Posting in Community
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1.5">
      <Hash className="h-3 w-3" />
      Posting to Home Feed
    </Badge>
  );
}
