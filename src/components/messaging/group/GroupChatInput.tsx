/**
 * GroupChatInput - Message input for group threads
 *
 * Pill-shaped input with send button, paperclip for media, typing broadcast on keydown.
 * Supports multi-file attachments (image/video/audio/docs), drag-and-drop, paste,
 * per-file progress, and remove-before-send.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Send,
  Paperclip,
  X,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileArchive,
  File as FileIcon,
  Music,
  Play,
  RotateCcw,
  AlertCircle,
  Reply,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { mediaUploadService, MAX_ATTACHMENTS_PER_MESSAGE } from '@/services/mediaUploadService';
import { useToast } from '@/hooks/use-toast';
import type { MediaItem, ConversationParticipant } from '@/types/groupMessaging';
import { VoiceMessageRecorder } from '@/components/messaging/inbox/VoiceMessageRecorder';

export interface ReplyContext {
  messageId: string;
  authorName: string;
  /** Short text preview of the original message */
  preview: string;
  /** Optional media snapshot when replying to a specific attachment */
  mediaSnapshot?: MediaItem;
  mediaIndex?: number;
}

interface GroupChatInputProps {
  onSend: (
    content: string,
    mediaUrls?: MediaItem[],
    replyContext?: ReplyContext | null,
    mentionedUserIds?: string[],
  ) => void;
  /** Optional voice-note send. When provided, renders the voice recorder. */
  onSendVoice?: (audioBlob: Blob, duration: number) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  conversationId?: string;
  replyContext?: ReplyContext | null;
  onCancelReply?: () => void;
  /** When the reply banner is clicked, jump to the original message. */
  onJumpToReply?: (messageId: string) => void;
  /** Group participants for @mention picker. */
  participants?: ConversationParticipant[];
  /** ID of the current user, excluded from the mention picker. */
  currentUserId?: string;
  /** Phase 14 - DIA smart-reply seed. Bumping `seedNonce` injects `seedText` into the composer. */
  seedText?: string;
  seedNonce?: number;
}

interface PendingAttachment {
  id: string;
  file: File;
  kind: 'image' | 'video' | 'audio' | 'document';
  /** Local preview (object URL or video poster data URL) */
  previewUrl?: string;
  progress: number; // 0-100
  status: 'uploading' | 'done' | 'error';
  error?: string;
  result?: MediaItem;
}

const ACCEPT_LIST = [
  'image/*',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/*',
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.csv',
  '.txt',
  '.md',
  '.zip',
].join(',');

function pendingIdFor(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`;
}

function PendingThumb({ att }: { att: PendingAttachment }) {
  if (att.kind === 'image' && att.previewUrl) {
    return <img src={att.previewUrl} alt={att.file.name} className="h-full w-full object-cover" />;
  }
  if (att.kind === 'video') {
    return (
      <div className="relative h-full w-full bg-foreground/10">
        {att.previewUrl ? (
          <img src={att.previewUrl} alt={att.file.name} className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center">
          <Play className="h-5 w-5 text-white drop-shadow" />
        </div>
      </div>
    );
  }
  if (att.kind === 'audio') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <Music className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  }
  // document
  const ext = (att.file.name.split('.').pop() || '').toLowerCase();
  const Icon =
    ext === 'pdf'
      ? FileText
      : ['xls', 'xlsx', 'csv'].includes(ext)
        ? FileSpreadsheet
        : ext === 'zip'
          ? FileArchive
          : ['doc', 'docx', 'ppt', 'pptx', 'txt', 'md'].includes(ext)
            ? FileText
            : FileIcon;
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}

export function GroupChatInput({
  onSend,
  onSendVoice,
  onTyping,
  disabled,
  conversationId,
  replyContext,
  onCancelReply,
  onJumpToReply,
  participants = [],
  currentUserId,
  seedText,
  seedNonce,
}: GroupChatInputProps) {
  const [message, setMessage] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** mentionMap: lowercased "@full name" -> user_id, kept as user picks mentions. */
  const mentionMapRef = useRef<Map<string, string>>(new Map());
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionActiveIdx, setMentionActiveIdx] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  /** Tracks attachment IDs cancelled mid-upload so runUpload can short-circuit. */
  const abortedRef = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  // Auto-resize
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [message]);

  // Phase 14 - external seed (DIA smart reply chip) injects text into the composer
  useEffect(() => {
    if (seedNonce && seedText) {
      setMessage((prev) => (prev ? `${prev} ${seedText}` : seedText));
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedNonce]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((a) => {
        if (a.previewUrl && a.previewUrl.startsWith('blob:')) URL.revokeObjectURL(a.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAttachment = useCallback((id: string, patch: Partial<PendingAttachment>) => {
    setAttachments((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  }, []);

  const removeAttachment = useCallback((id: string) => {
    abortedRef.current.add(id);
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const startUploads = useCallback(
    async (files: File[]) => {
      if (!conversationId) {
        toast({ title: 'Error', description: 'No conversation selected', variant: 'destructive' });
        return;
      }

      // Cap total
      const remainingSlots = MAX_ATTACHMENTS_PER_MESSAGE - attachments.length;
      if (remainingSlots <= 0) {
        toast({
          title: 'Attachment limit',
          description: `You can attach up to ${MAX_ATTACHMENTS_PER_MESSAGE} files per message.`,
          variant: 'destructive',
        });
        return;
      }

      const accepted: File[] = [];
      let rejectedCount = 0;
      for (const file of files) {
        if (accepted.length >= remainingSlots) {
          rejectedCount += 1;
          continue;
        }
        const err = mediaUploadService.validateFile(file);
        if (err) {
          rejectedCount += 1;
          toast({ title: file.name, description: err, variant: 'destructive' });
          continue;
        }
        accepted.push(file);
      }

      if (rejectedCount > 0 && accepted.length > 0) {
        toast({
          title: 'Some files were skipped',
          description: `${rejectedCount} file(s) over the limit or unsupported.`,
        });
      }
      if (accepted.length === 0) return;

      // Build pending entries with previews
      const pendings: PendingAttachment[] = accepted.map((file) => {
        const kind = mediaUploadService.getMediaKind(file);
        let previewUrl: string | undefined;
        if (kind === 'image') previewUrl = URL.createObjectURL(file);
        return {
          id: pendingIdFor(file),
          file,
          kind,
          previewUrl,
          progress: 0,
          status: 'uploading',
        };
      });

      setAttachments((prev) => [...prev, ...pendings]);

      // Kick off uploads in parallel
      await Promise.all(pendings.map((p) => runUpload(p)));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attachments.length, conversationId, toast, updateAttachment],
  );

  const runUpload = useCallback(
    async (p: PendingAttachment) => {
      if (!conversationId) return;
      try {
        const item = await mediaUploadService.uploadMessageMedia(
          p.file,
          conversationId,
          (progress) => {
            if (abortedRef.current.has(p.id)) return;
            updateAttachment(p.id, { progress: progress.progress });
          },
        );
        if (abortedRef.current.has(p.id)) return;
        const newPreview =
          p.kind === 'video' && item.posterUrl ? item.posterUrl : p.previewUrl;
        updateAttachment(p.id, {
          status: 'done',
          progress: 100,
          result: item,
          previewUrl: newPreview,
          error: undefined,
        });
      } catch (err) {
        if (abortedRef.current.has(p.id)) return;
        updateAttachment(p.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        });
      }
    },
    [conversationId, updateAttachment],
  );

  const retryAttachment = useCallback(
    (id: string) => {
      const target = attachments.find((a) => a.id === id);
      if (!target) return;
      abortedRef.current.delete(id);
      updateAttachment(id, { status: 'uploading', progress: 0, error: undefined });
      void runUpload({ ...target, status: 'uploading', progress: 0, error: undefined });
    },
    [attachments, runUpload, updateAttachment],
  );

  // Mention candidates: filter by current query, exclude self
  const mentionCandidates = React.useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return participants
      .filter((p) => p.user_id !== currentUserId)
      .filter((p) => (p.full_name || '').toLowerCase().includes(q))
      .slice(0, 6);
  }, [mentionQuery, participants, currentUserId]);

  const closeMentionPicker = () => {
    setMentionQuery(null);
    setMentionStart(null);
    setMentionActiveIdx(0);
  };

  /** Inspect the text around the caret to decide whether to open / update the mention picker. */
  const updateMentionState = (text: string, caret: number) => {
    // Find the last "@" before the caret that is preceded by whitespace or is at index 0
    let i = caret - 1;
    while (i >= 0) {
      const ch = text[i];
      if (ch === '@') {
        const prev = i === 0 ? ' ' : text[i - 1];
        if (/\s/.test(prev) || i === 0) {
          const after = text.slice(i + 1, caret);
          if (/\s/.test(after)) {
            closeMentionPicker();
            return;
          }
          setMentionStart(i);
          setMentionQuery(after);
          setMentionActiveIdx(0);
          return;
        }
        closeMentionPicker();
        return;
      }
      if (/\s/.test(ch)) break;
      i -= 1;
    }
    closeMentionPicker();
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setMessage(next);
    updateMentionState(next, e.target.selectionStart ?? next.length);
  };

  const insertMention = (p: ConversationParticipant) => {
    if (mentionStart === null) return;
    const name = p.full_name || 'Member';
    const before = message.slice(0, mentionStart);
    const afterCaret = textareaRef.current
      ? message.slice(textareaRef.current.selectionStart ?? message.length)
      : '';
    const inserted = `@${name} `;
    const next = `${before}${inserted}${afterCaret}`;
    mentionMapRef.current.set(`@${name}`.toLowerCase(), p.user_id);
    setMessage(next);
    closeMentionPicker();
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      const pos = before.length + inserted.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  /** Resolve user IDs that appear as @mentions in the final text. */
  const resolveMentionedUserIds = (text: string): string[] => {
    const ids = new Set<string>();
    for (const [token, uid] of mentionMapRef.current.entries()) {
      if (text.toLowerCase().includes(token)) ids.add(uid);
    }
    return Array.from(ids);
  };

  const handleSend = () => {
    const trimmed = message.trim();
    const ready = attachments.filter((a) => a.status === 'done' && a.result);
    const hasUploading = attachments.some((a) => a.status === 'uploading');
    if (hasUploading) return;
    if (!trimmed && ready.length === 0) return;

    onSend(
      trimmed,
      ready.length > 0 ? ready.map((a) => a.result!) : undefined,
      replyContext ?? null,
      resolveMentionedUserIds(trimmed),
    );
    setMessage('');
    mentionMapRef.current.clear();
    closeMentionPicker();
    // Revoke previews
    attachments.forEach((a) => {
      if (a.previewUrl && a.previewUrl.startsWith('blob:')) URL.revokeObjectURL(a.previewUrl);
    });
    setAttachments([]);
    onCancelReply?.();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Mention picker keyboard nav
    if (mentionQuery !== null && mentionCandidates.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionActiveIdx((i) => (i + 1) % mentionCandidates.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionActiveIdx((i) => (i - 1 + mentionCandidates.length) % mentionCandidates.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionCandidates[mentionActiveIdx]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMentionPicker();
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping?.();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (files.length === 0) return;
    await startUploads(files);
  };

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      await startUploads(files);
    }
  };

  // Drag and drop on the whole composer shell
  const handleDragEnter = (e: React.DragEvent) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDragging(false);
  };
  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer?.files || []);
    if (files.length > 0) await startUploads(files);
  };

  const uploading = attachments.some((a) => a.status === 'uploading');
  const hasContent = message.trim().length > 0 || attachments.some((a) => a.status === 'done');
  const sendDisabled = disabled || uploading || !hasContent;

  return (
    <div
      className={cn(
        'relative flex-shrink-0 border-t bg-background/95 backdrop-blur-sm px-4 py-3 safe-area-bottom',
        isDragging && 'ring-2 ring-primary/60 ring-inset',
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/80">
          <div className="rounded-lg border-2 border-dashed border-primary px-6 py-4 text-sm font-medium text-primary">
            Drop files to attach
          </div>
        </div>
      )}

      {/* Reply context banner - clickable to jump to the original message */}
      {replyContext && (
        <div className="mb-2 flex items-stretch gap-2 rounded-lg border-l-4 border-primary bg-muted/60 p-2">
          <button
            type="button"
            onClick={() => onJumpToReply?.(replyContext.messageId)}
            className="flex flex-1 items-stretch gap-2 text-left hover:bg-muted/80 rounded -m-1 p-1 min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Jump to message from ${replyContext.authorName}`}
          >
            {replyContext.mediaSnapshot &&
              (replyContext.mediaSnapshot.type === 'image' ||
                replyContext.mediaSnapshot.type === 'video') && (
                <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-background">
                  <img
                    src={
                      replyContext.mediaSnapshot.posterUrl || replyContext.mediaSnapshot.url
                    }
                    alt={replyContext.mediaSnapshot.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                <Reply className="h-3 w-3" />
                Replying to {replyContext.authorName}
                {replyContext.mediaSnapshot && (
                  <span className="font-normal text-muted-foreground">
                    - {replyContext.mediaSnapshot.name}
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {replyContext.preview || (replyContext.mediaSnapshot ? 'Attachment' : '')}
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => onCancelReply?.()}
            aria-label="Cancel reply"
            className="self-start rounded-full p-1 text-muted-foreground hover:bg-background"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className={cn(
                'relative flex w-44 items-center gap-2 overflow-hidden rounded-lg border bg-card p-2',
                att.status === 'error' && 'border-destructive/60',
              )}
            >
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md">
                <PendingThumb att={att} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-foreground">{att.file.name}</p>
                {att.status === 'uploading' && (
                  <>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${att.progress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      aria-label={`Cancel upload of ${att.file.name}`}
                      className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </>
                )}
                {att.status === 'done' && (
                  <p className="text-[10px] text-muted-foreground">Ready to send</p>
                )}
                {att.status === 'error' && (
                  <div className="mt-0.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 text-destructive" />
                    <p className="truncate text-[10px] text-destructive">
                      {att.error || 'Upload failed'}
                    </p>
                    <button
                      type="button"
                      onClick={() => retryAttachment(att.id)}
                      className="ml-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10"
                      aria-label={`Retry uploading ${att.file.name}`}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                aria-label={`Remove ${att.file.name}`}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File input (hidden) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept={ACCEPT_LIST}
          multiple
          className="hidden"
        />

        {/* Paperclip button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 flex-shrink-0 hover:bg-primary/10"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || attachments.length >= MAX_ATTACHMENTS_PER_MESSAGE}
          aria-label="Attach files"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        {/* Voice recorder — replaces text/send when active */}
        {onSendVoice && !message.trim() && attachments.length === 0 && (
          <VoiceMessageRecorder
            onSendVoice={onSendVoice}
            disabled={disabled}
            onActiveStateChange={setIsVoiceActive}
          />
        )}

        {!isVoiceActive && (
          <div className="relative flex flex-1 items-end rounded-xl border border-border/50 bg-muted px-4 py-2">
            {mentionQuery !== null && mentionCandidates.length > 0 && (
              <div className="absolute bottom-full left-0 right-0 mb-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg z-20">
                {mentionCandidates.map((p, idx) => (
                  <button
                    key={p.user_id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      insertMention(p);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                      idx === mentionActiveIdx ? 'bg-muted' : 'hover:bg-muted/60',
                    )}
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {(p.full_name || '?').slice(0, 2).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{p.full_name || 'Member'}</span>
                    {p.username && (
                      <span className="text-xs text-muted-foreground">@{p.username}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={message}
              onChange={handleMessageChange}
              onSelect={(e) => {
                const t = e.currentTarget;
                updateMentionState(t.value, t.selectionStart ?? t.value.length);
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              disabled={disabled}
              rows={1}
              className={cn(
                'flex-1 resize-none border-0 bg-transparent focus:outline-none focus:ring-0',
                'text-[15px] placeholder:text-muted-foreground/60',
                'min-h-[24px] max-h-[100px] py-0',
              )}
            />
          </div>
        )}

        {!isVoiceActive && (
          <Button
            onClick={handleSend}
            disabled={sendDisabled}
            size="icon"
            className={cn(
              'h-9 w-9 rounded-full flex-shrink-0 transition-all',
              !sendDisabled
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground scale-100 opacity-100'
                : 'bg-muted text-muted-foreground scale-90 opacity-50',
            )}
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
