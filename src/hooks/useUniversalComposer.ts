/**
 * DNA Post Composer — Universal Composer Hook
 *
 * Sprint 3A: Replaced switch/case submission with MODE_HANDLERS object map.
 * Extended open() to accept ComposerContext with cross-C attribution fields.
 * Success/error messages now come from MODE_HANDLERS.
 *
 * Sprint 3B: Added success screen state management. On successful publish,
 * the composer shows a success screen instead of closing immediately.
 * dismissSuccess() handles cleanup and modal close.
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { MODE_HANDLERS } from '@/components/composer/modeHandlers';
import type { ComposerSubmitContext } from '@/components/composer/modeHandlers';
import { logHighError } from '@/lib/errorLogger';
import type { UniversalFeedItem } from '@/types/feed';
import { DEFAULT_MODE, type ComposerMode } from '@/config/composerModes';

// Re-exported so existing importers keep resolving ComposerMode from this hook,
// while the single source of truth lives in the composer-mode config (BD075).
export type { ComposerMode };

interface InfiniteFeedData {
  pages: UniversalFeedItem[][];
  pageParams: unknown[];
}

interface ComposerAnalyticsMetadata {
  fromMode?: ComposerMode;
  contentLength?: number;
  hasMedia?: boolean;
  [key: string]: unknown;
}

/**
 * Sprint 3B: Data captured on successful submission for the success screen.
 */
export interface ComposerSuccessData {
  mode: ComposerMode;
  createdId: string;
  createdTitle: string;
  formDataSnapshot: ComposerFormData;
}

export interface ComposerContext {
  spaceId?: string;
  eventId?: string;
  communityId?: string;
  // Sprint 3A: Extended context for cross-C attribution
  relatedSpaceId?: string;
  relatedSpaceName?: string;
  relatedEventId?: string;
  relatedEventTitle?: string;
  relatedOpportunityId?: string;
  resharedContentId?: string;
}

export interface AgendaItem {
  time: string;
  title: string;
}

export interface ComposerFormData {
  content: string;
  title?: string;
  mediaUrl?: string;
  // Link/video preview
  linkUrl?: string;
  linkTitle?: string;
  linkDescription?: string;
  linkThumbnail?: string;
  linkProviderName?: string;
  // Event specific
  eventDate?: string;
  eventTime?: string;
  eventEndDate?: string;
  eventEndTime?: string;
  /** Resolved ISO 8601 instant (BD089) — preferred source for events.start_time. */
  startTime?: string;
  timezone?: string;
  eventType?: 'conference' | 'workshop' | 'meetup' | 'webinar' | 'networking' | 'social' | 'other';
  location?: string;
  locationCity?: string;
  locationCountry?: string;
  locationLat?: number;
  locationLng?: number;
  meetingUrl?: string;
  format?: 'in_person' | 'virtual' | 'hybrid';
  maxAttendees?: number;
  registrationRequired?: boolean;
  agenda?: AgendaItem[];
  dressCode?: string;
  tags?: string[];
  // Connect specific — who they need, and where (DIA whitelist: intent, where)
  intent?: string;
  where?: string;
  sector?: string;
  // Need specific (Contribute)
  needType?: 'funding' | 'expertise' | 'resources' | 'volunteers' | 'partnership';
  targetAmount?: number;
  currency?: string;
  neededBy?: string;
  // Contribute — the give → to → impact triple (BD084). DIA proposes; the
  // member owns the final value (BD085).
  direction?: 'need' | 'offer';
  category?: string;
  giveWhat?: string;
  giveTo?: string;
  intendedImpact?: string;
  // Space specific
  spaceDescription?: string;
  spaceCategory?: string;
  visibility?: 'public' | 'private' | 'invite-only';
  skillsNeeded?: string[];
  // Story specific (subtitle is shared with Event)
  subtitle?: string;
  heroImage?: string;
  storyType?: 'impact' | 'update' | 'spotlight' | 'photo_essay';
  galleryUrls?: string[];
}

/**
 * DR1 step 5: this is now the INTERNAL state implementation. It is called
 * exactly once, by `ComposerProvider`. Consumers use `useUniversalComposer()`
 * from `@/contexts/ComposerContext`, which reads the provider's context.
 *
 * Before DR1 this hook was called at twelve separate mount sites, each holding
 * its own independent open state, so "the composer" was never one thing.
 */
export const useComposerState = (initialContext?: ComposerContext) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<ComposerMode>(DEFAULT_MODE);
  const [context, setContext] = useState<ComposerContext>(initialContext || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sprint 3B: Success screen state
  const [successData, setSuccessData] = useState<ComposerSuccessData | null>(null);

  const open = useCallback((selectedMode?: ComposerMode, ctx?: ComposerContext) => {
    if (selectedMode) setMode(selectedMode);
    if (ctx) setContext(prev => ({ ...prev, ...ctx }));
    setSuccessData(null);
    setIsOpen(true);

    // Track composer open
    trackComposerEvent('open', selectedMode || mode);
  }, [mode]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSuccessData(null);
    trackComposerEvent('cancel', mode);
  }, [mode]);

  // Sprint 3B: Dismiss success screen — closes composer and shows toast
  const dismissSuccess = useCallback(() => {
    if (successData) {
      const handler = MODE_HANDLERS[successData.mode];
      toast({ description: handler.successMessage });
    }
    setSuccessData(null);
    setIsOpen(false);
  }, [successData]);

  const switchMode = useCallback((newMode: ComposerMode) => {
    trackComposerEvent('switch', newMode, { fromMode: mode });
    setMode(newMode);
  }, [mode]);

  const submit = useCallback(async (formData: ComposerFormData) => {
    if (!user) {
      toast({ variant: 'destructive', description: 'You must be logged in' });
      return;
    }

    const handler = MODE_HANDLERS[mode];

    // Validate via MODE_HANDLERS (replaces switch/case validation)
    const validation = handler.validate(formData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      toast({ variant: 'destructive', description: firstError });
      return;
    }

    setIsSubmitting(true);

    try {
      // Build submit context from hook state + user
      const submitContext: ComposerSubmitContext = {
        userId: user.id,
        spaceId: context.spaceId,
        eventId: context.eventId,
        communityId: context.communityId,
        relatedSpaceId: context.relatedSpaceId,
        relatedSpaceName: context.relatedSpaceName,
        relatedEventId: context.relatedEventId,
        relatedEventTitle: context.relatedEventTitle,
        relatedOpportunityId: context.relatedOpportunityId,
        resharedContentId: context.resharedContentId,
      };

      // Submit via MODE_HANDLERS (replaces switch/case)
      const result = await handler.submit(formData, submitContext);

      if (!result.success) {
        throw new Error(result.error || 'Submission failed');
      }

      const createdPost = result.createdPost;

      // TRUST-FIRST: Optimistically inject into ALL relevant feed caches
      if (createdPost) {
        // 1. All Posts feed
        queryClient.setQueryData(
          ['universal-feed-infinite', { viewerId: user.id, tab: 'all', authorId: undefined, spaceId: undefined, eventId: undefined, rankingMode: 'latest' }],
          (old: InfiniteFeedData | undefined) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: [[createdPost, ...(old.pages[0] || [])], ...old.pages.slice(1)]
            };
          }
        );

        // 2. My Posts feed
        queryClient.setQueryData(
          ['universal-feed-infinite', { viewerId: user.id, tab: 'my_posts', authorId: user.id, spaceId: undefined, eventId: undefined, rankingMode: 'latest' }],
          (old: InfiniteFeedData | undefined) => {
            if (!old?.pages) return old;
            return {
              ...old,
              pages: [[createdPost, ...(old.pages[0] || [])], ...old.pages.slice(1)]
            };
          }
        );

        // 3. Context-specific feeds (Space/Event)
        if (context.spaceId) {
          queryClient.setQueryData(
            ['universal-feed-infinite', { viewerId: user.id, tab: 'all', authorId: undefined, spaceId: context.spaceId, eventId: undefined, rankingMode: 'latest' }],
            (old: InfiniteFeedData | undefined) => {
              if (!old?.pages) return old;
              return {
                ...old,
                pages: [[createdPost, ...(old.pages[0] || [])], ...old.pages.slice(1)]
              };
            }
          );
        }

        if (context.eventId) {
          queryClient.setQueryData(
            ['universal-feed-infinite', { viewerId: user.id, tab: 'all', authorId: undefined, spaceId: undefined, eventId: context.eventId, rankingMode: 'latest' }],
            (old: InfiniteFeedData | undefined) => {
              if (!old?.pages) return old;
              return {
                ...old,
                pages: [[createdPost, ...(old.pages[0] || [])], ...old.pages.slice(1)]
              };
            }
          );
        }
      }

      // Invalidate as backup so server state reconciles
      await queryClient.invalidateQueries({ queryKey: ['universal-feed'] });
      await queryClient.invalidateQueries({ queryKey: ['universal-feed-infinite'] });

      // Track submission
      trackComposerEvent('submit', mode, {
        contentLength: formData.content.length,
        hasMedia: !!formData.mediaUrl,
      });

      // Sprint 3B: Show success screen instead of closing immediately
      const createdId = createdPost?.post_id ?? crypto.randomUUID();
      const createdTitle = formData.title ?? '';
      setSuccessData({
        mode,
        createdId,
        createdTitle,
        formDataSnapshot: { ...formData },
      });
      // DON'T close — composer stays open to show success screen
    } catch (error) {
      logHighError(error, 'composer', `Failed to create ${mode}`, { mode, context, formData });

      toast({
        variant: 'destructive',
        title: 'Publishing failed',
        description: handler.errorMessage,
      });

      // DO NOT close composer or clear content - preserve user's work
    } finally {
      setIsSubmitting(false);
    }
  }, [user, mode, context, queryClient]);

  return {
    isOpen,
    mode,
    context,
    isSubmitting,
    successData,
    open,
    close,
    switchMode,
    submit,
    dismissSuccess,
  };
};

function trackComposerEvent(action: 'open' | 'cancel' | 'switch' | 'submit', mode: ComposerMode, metadata?: ComposerAnalyticsMetadata) {
  // Silent tracking - don't block UX
  try {
    supabase.from('analytics_events').insert({
      event_name: `composer_${action}`,
      event_metadata: { mode, ...metadata },
      route: window.location.pathname,
    }).then(() => {});
  } catch {
    // Silently ignore analytics tracking errors
  }
}
