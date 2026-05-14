import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAutoEmbedDetection } from '@/hooks/useAutoEmbedDetection';
import type { ComposerFormData } from '@/hooks/useUniversalComposer';
import {
  MultiAttachmentUploader,
  type MultiAttachmentUploaderHandle,
} from './MultiAttachmentUploader';
import { MentionAutocomplete } from '@/components/feed/MentionAutocomplete';
import type { MentionSuggestion } from '@/hooks/useMentionAutocomplete';
import { cn } from '@/lib/utils';


interface PostModeFieldsProps {
  formData: ComposerFormData;
  onChange: (updates: Partial<ComposerFormData>) => void;
  validationErrors?: Record<string, string>;
}

const MAX_CHARS = 2000;
const WARN_THRESHOLD = 1800;

export function PostModeFields({ formData, onChange, validationErrors = {} }: PostModeFieldsProps) {
  const { embedData, handleContentChange, loading, clearEmbedData } = useAutoEmbedDetection();
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const uploaderRef = useRef<MultiAttachmentUploaderHandle>(null);
  const [atCap, setAtCap] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  // Combined attachment list: keep mediaUrl as the primary attachment for
  // backward-compatible single-media post submission, plus any extras in
  // galleryUrls. Both flow through the same uploader UI.
  const attachmentUrls = useMemo<string[]>(() => {
    const urls: string[] = [];
    if (formData.mediaUrl) urls.push(formData.mediaUrl);
    if (Array.isArray(formData.galleryUrls)) urls.push(...formData.galleryUrls);
    return urls;
  }, [formData.mediaUrl, formData.galleryUrls]);

  const handleAttachmentsChange = (urls: string[]) => {
    const [first, ...rest] = urls;
    onChange({ mediaUrl: first ?? undefined, galleryUrls: rest });
  };

  const onDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!e.dataTransfer?.types?.includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) uploaderRef.current?.addFiles(files);
  };


  // Auto-grow textarea based on content. Cap relative to the *visual* viewport
  // (which shrinks when the mobile keyboard opens) so the sticky footer
  // (Cancel / Post) always stays reachable.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const resize = () => {
      ta.style.height = 'auto';
      const vv = (typeof window !== 'undefined' && window.visualViewport)
        ? window.visualViewport.height
        : window.innerHeight;
      const reserved = 260;
      const viewportCap = Math.max(140, Math.floor(vv - reserved));
      const ceiling = Math.min(520, viewportCap);
      const desired = ta.scrollHeight;
      const next = Math.min(desired, ceiling);
      ta.style.height = `${Math.max(next, 160)}px`;
      const reachedCap = desired > ceiling;
      setAtCap(reachedCap);
      if (reachedCap) {
        ta.scrollTop = ta.scrollHeight;
      } else {
        ta.scrollIntoView({ block: 'nearest' });
      }
    };
    resize();
    window.addEventListener('resize', resize);
    window.visualViewport?.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      window.visualViewport?.removeEventListener('resize', resize);
    };
  }, [formData.content]);

  // Sync embed data to form when detected (only if not already set)
  useEffect(() => {
    if (embedData && !formData.linkUrl) {
      onChange({
        linkUrl: embedData.url,
        linkTitle: embedData.title || undefined,
        linkDescription: embedData.author_name || undefined,
        linkThumbnail: embedData.thumbnail_url || undefined,
        linkProviderName: embedData.provider_name || undefined,
      });
    }
  }, [embedData, formData.linkUrl]);

  const handleTextChange = (value: string) => {
    // Enforce hard character cap
    const next = value.length > MAX_CHARS ? value.slice(0, MAX_CHARS) : value;
    onChange({ content: next });
    if (!formData.linkUrl) {
      handleContentChange(next);
    }
  };

  const handleSelectionChange = () => {
    const ta = textareaRef.current;
    if (ta) setCursorPos(ta.selectionStart ?? 0);
  };

  const handleSelectMention = (
    mention: MentionSuggestion,
    startPos: number,
    endPos: number,
  ) => {
    const text = formData.content;
    const before = text.substring(0, startPos);
    const after = text.substring(endPos);
    const insert = `@${mention.username} `;
    const newText = `${before}${insert}${after}`;
    const capped = newText.length > MAX_CHARS ? newText.slice(0, MAX_CHARS) : newText;
    onChange({ content: capped });
    // Restore caret right after inserted mention
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      const caret = Math.min(capped.length, before.length + insert.length);
      ta.focus();
      ta.setSelectionRange(caret, caret);
      setCursorPos(caret);
    });
  };

  const handleRemovePreview = () => {
    clearEmbedData();
    onChange({
      linkUrl: undefined,
      linkTitle: undefined,
      linkDescription: undefined,
      linkThumbnail: undefined,
      linkProviderName: undefined,
    });
  };

  const hasPreview = embedData || formData.linkUrl;
  const previewData = embedData || (formData.linkUrl ? {
    url: formData.linkUrl,
    title: formData.linkTitle,
    author_name: formData.linkDescription,
    thumbnail_url: formData.linkThumbnail,
    provider_name: formData.linkProviderName,
  } : null);

  const used = formData.content.length;
  const remaining = MAX_CHARS - used;
  const isWarning = used >= WARN_THRESHOLD && used < MAX_CHARS;
  const isAtMax = used >= MAX_CHARS;

  return (
    <div
      className="relative space-y-3"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-lg border-2 border-dashed border-dna-emerald bg-dna-emerald/5">
          <div className="flex flex-col items-center gap-2 text-dna-emerald">
            <Upload className="h-6 w-6" />
            <p className="text-sm font-medium">Drop to attach</p>
          </div>
        </div>
      )}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          id="composer-field-content"
          placeholder="What's on your mind? Use @ to mention someone."
          value={formData.content}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          onSelect={handleSelectionChange}
          maxLength={MAX_CHARS}
          aria-invalid={validationErrors.content ? true : undefined}
          aria-describedby={
            [validationErrors.content ? 'composer-error-content' : null, 'composer-char-counter']
              .filter(Boolean)
              .join(' ') || undefined
          }
          className="min-h-[160px] resize-none text-base leading-relaxed overflow-y-auto"
        />
        <MentionAutocomplete
          text={formData.content}
          cursorPosition={cursorPos}
          onSelectMention={handleSelectMention}
          textareaRef={textareaRef}
        />
      </div>

      <div className="flex items-center justify-between gap-3 -mt-1 px-1">
        <div className="flex-1">
          {atCap && (
            <p
              aria-live="polite"
              className="text-[11px] text-dna-gray400 italic"
            >
              Max height reached - scroll inside to keep writing
            </p>
          )}
        </div>
        <p
          id="composer-char-counter"
          aria-live="polite"
          className={cn(
            'text-[11px] tabular-nums',
            isAtMax
              ? 'text-destructive font-medium'
              : isWarning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-dna-gray400',
          )}
        >
          {remaining} {remaining === 1 ? 'character' : 'characters'} left
        </p>
      </div>

      {/* Compact inline link preview - never dominates the drawer */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-lg">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span className="text-xs">Detecting link...</span>
        </div>
      )}
      {hasPreview && previewData && !loading && (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 rounded-lg border border-border/50 max-h-[52px] overflow-hidden">
          {previewData.thumbnail_url ? (
            <img src={previewData.thumbnail_url} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />
          ) : (
            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-muted-foreground">🔗</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {previewData.title || previewData.provider_name || new URL(previewData.url).hostname.replace('www.', '')}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {previewData.provider_name || new URL(previewData.url).hostname.replace('www.', '')}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={handleRemovePreview}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <MultiAttachmentUploader
        ref={uploaderRef}
        value={attachmentUrls}
        onChange={handleAttachmentsChange}
      />
    </div>
  );
}
