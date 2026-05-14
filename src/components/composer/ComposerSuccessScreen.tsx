/**
 * ComposerSuccessScreen — Post-creation celebration with card preview + DIA suggestion
 *
 * Sprint 3B: Renders INSIDE the existing composer shell (Dialog on desktop,
 * Drawer on mobile). Replaces the form content after successful submission.
 *
 * Three elements:
 * 1. Preview of the card as it will appear in the feed (with correct bevel color)
 * 2. DIA-powered contextual suggestion for what to do next
 * 3. "Done" button that dismisses to the feed
 */

import { CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MODE_HANDLERS } from './modeHandlers';
import { MateMasie } from '@/components/icons/adinkra';
import {
  SUCCESS_HEADLINES,
  getPostCreationSuggestion,
  type PostCreationSuggestion,
} from '@/services/diaPostCreationService';
import type { ComposerMode, ComposerFormData } from '@/hooks/useUniversalComposer';
import { FeedCardBase, type FeedCardBevelType } from '@/components/feed/cards/FeedCardBase';

interface ComposerSuccessScreenProps {
  mode: ComposerMode;
  createdId: string;
  createdTitle: string;
  formData: ComposerFormData;
  onDismiss: () => void;
  onDIAAction: (suggestion: PostCreationSuggestion) => void;
}

const MODE_TO_BEVEL: Record<ComposerMode, FeedCardBevelType> = {
  post: 'post',
  story: 'story',
  event: 'event',
  space: 'space',
  need: 'need',
  community: 'post',
};

export const ComposerSuccessScreen = ({
  mode,
  createdId,
  createdTitle,
  formData,
  onDismiss,
  onDIAAction,
}: ComposerSuccessScreenProps) => {
  const handler = MODE_HANDLERS[mode];
  const headline = SUCCESS_HEADLINES[mode];
  const suggestion = getPostCreationSuggestion(mode, createdId);
  const bevelType = MODE_TO_BEVEL[mode];

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      {/* Success Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${handler.accentColor}15` }}
        >
          <CheckCircle2
            className="h-7 w-7"
            style={{ color: handler.accentColor }}
          />
        </div>
        <h2 className="text-xl font-semibold">{headline}</h2>
      </div>

      {/* Card Preview */}
      <div className="w-full pointer-events-none select-none">
        <div className="transform scale-[0.92] origin-center">
          <CardPreview
            mode={mode}
            bevelType={bevelType}
            accentColor={handler.accentColor}
            formData={formData}
            title={createdTitle}
          />
        </div>
      </div>

      {/* DIA Suggestion */}
      <div
        className="w-full rounded-lg border p-4"
        style={{ borderColor: `${handler.accentColor}30` }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: `${handler.accentColor}15` }}
          >
            <MateMasie
              className="h-4 w-4"
              style={{ color: handler.accentColor }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{suggestion.headline}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {suggestion.body}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                className="text-white"
                style={{ backgroundColor: handler.accentColor }}
                onClick={() => onDIAAction(suggestion)}
              >
                {suggestion.actionLabel}
                <ExternalLink className="h-3 w-3 ml-1.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
                onClick={onDismiss}
              >
                {suggestion.dismissLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Done Button */}
      <Button
        variant="outline"
        className="w-full min-h-[44px]"
        onClick={onDismiss}
      >
        Done - Go to Feed
      </Button>
    </div>
  );
};

// ============================================================
// Card Preview — Lightweight preview using form data
// ============================================================

interface CardPreviewProps {
  mode: ComposerMode;
  bevelType: FeedCardBevelType;
  accentColor: string;
  formData: ComposerFormData;
  title: string;
}

function CardPreview({ mode, bevelType, accentColor, formData, title }: CardPreviewProps) {
  return (
    <FeedCardBase
      bevelType={bevelType}
      className="relative overflow-hidden"
    >
      {/* Subtle pulsing glow overlay */}
      <div
        className="absolute inset-0 rounded-xl opacity-[0.04] animate-pulse"
        style={{ backgroundColor: accentColor }}
      />

      <div className="relative space-y-2">
        {/* Mode badge */}
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: accentColor }}
          >
            {MODE_HANDLERS[mode].label}
          </span>
        </div>

        {/* Title (for modes that have one) */}
        {title && (
          <h3 className="font-semibold text-base leading-snug line-clamp-2">
            {title}
          </h3>
        )}

        {/* Content preview */}
        {formData.content && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {formData.content}
          </p>
        )}

        {/* Media preview */}
        {formData.mediaUrl && (
          <div className="rounded-lg overflow-hidden border border-border mt-2">
            <img
              src={formData.mediaUrl}
              alt="Post media"
              className="w-full h-24 object-cover"
            />
          </div>
        )}

        {/* Mode-specific metadata */}
        <ModeMetadata mode={mode} formData={formData} accentColor={accentColor} />
      </div>
    </FeedCardBase>
  );
}

function ModeMetadata({
  mode,
  formData,
  accentColor,
}: {
  mode: ComposerMode;
  formData: ComposerFormData;
  accentColor: string;
}) {
  switch (mode) {
    case 'event':
      return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-1">
          {formData.eventDate && (
            <span>{formData.eventDate}{formData.eventTime ? ` at ${formData.eventTime}` : ''}</span>
          )}
          {formData.location && <span>{formData.location}</span>}
          {formData.format && (
            <span
              className="px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: accentColor, fontSize: '10px' }}
            >
              {formData.format.replace('_', ' ')}
            </span>
          )}
        </div>
      );
    case 'space':
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          {formData.spaceCategory && <span>{formData.spaceCategory}</span>}
          {formData.visibility && <span>{formData.visibility}</span>}
        </div>
      );
    case 'story':
      return (
        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
          {formData.storyType && <span>{formData.storyType}</span>}
          {formData.content && (
            <span>{formData.content.length.toLocaleString()} characters</span>
          )}
        </div>
      );
    default:
      return null;
  }
}
