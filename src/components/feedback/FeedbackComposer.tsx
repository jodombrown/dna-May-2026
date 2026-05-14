import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, Loader2, Plus, Paperclip, Mic, Video as VideoIcon, Image as ImageIcon } from 'lucide-react';
import type { UserTag, ContentType } from '@/types/feedback';
import { USER_TAG_LABELS } from '@/types/feedback';
import { feedbackService } from '@/services/feedbackService';
import { useSendFeedbackMessage } from '@/hooks/useFeedbackMessages';
import { FeedbackVoiceRecorder } from './FeedbackVoiceRecorder';
import { FeedbackVideoRecorder } from './FeedbackVideoRecorder';
import { MentionAutocomplete } from '@/components/feed/MentionAutocomplete';
import { MentionSuggestion } from '@/hooks/useMentionAutocomplete';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FeedbackComposerProps {
  channelId: string;
  replyTo?: {
    id: string;
    username: string;
    preview: string;
  } | null;
  onCancelReply?: () => void;
  onSuccess?: () => void;
  initialTag?: UserTag | null;
  composerRef?: React.RefObject<HTMLFormElement>;
}

const TAG_OPTIONS: UserTag[] = ['bug', 'suggestion', 'question', 'praise', 'other'];

const TAG_DESCRIPTIONS: Record<UserTag, string> = {
  bug: 'Report a bug or issue you encountered',
  suggestion: 'Share an idea or feature suggestion',
  question: 'Ask a question about the platform',
  praise: 'Share positive feedback or appreciation',
  other: 'General feedback that doesn\'t fit other categories',
};

interface PendingAttachment {
  file: File | Blob;
  type: 'image' | 'voice' | 'video';
  preview?: string;
  duration?: number;
}

export function FeedbackComposer({
  channelId,
  replyTo,
  onCancelReply,
  onSuccess,
  initialTag,
  composerRef,
}: FeedbackComposerProps) {
  const [content, setContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedTag, setSelectedTag] = useState<UserTag | null>(initialTag || null);
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecorders, setShowRecorders] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeRecorder, setActiveRecorder] = useState<'voice' | 'video' | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const { isMobile } = useMobile();
  
  const sendMessage = useSendFeedbackMessage();

  // Update selected tag when initialTag changes
  useEffect(() => {
    if (initialTag !== undefined) {
      setSelectedTag(initialTag);
    }
  }, [initialTag]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      // Min height ~44px (1 row), max ~120px (~4 rows)
      textarea.style.height = `${Math.min(Math.max(scrollHeight, 44), 120)}px`;
    }
  }, [content]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newAttachments: PendingAttachment[] = files.map((file) => ({
      file,
      type: 'image' as const,
      preview: URL.createObjectURL(file),
    }));
    setPendingAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFilesSelected]);

  const handleRemoveFile = useCallback((index: number) => {
    setPendingAttachments((prev) => {
      const attachment = prev[index];
      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleVoiceRecording = useCallback((blob: Blob, duration: number) => {
    setPendingAttachments((prev) => [
      ...prev,
      { file: blob, type: 'voice', duration },
    ]);
    setShowRecorders(false);
  }, []);

  const handleVideoRecording = useCallback((blob: Blob, duration: number) => {
    setPendingAttachments((prev) => [
      ...prev,
      { file: blob, type: 'video', duration },
    ]);
    setShowRecorders(false);
    setActiveRecorder(null);
  }, []);

  const handleVideoFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setPendingAttachments(prev => [...prev, {
          file,
          type: 'video',
          duration: Math.round(video.duration),
        }]);
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
    if (videoInputRef.current) videoInputRef.current.value = '';
    setIsDrawerOpen(false);
  }, []);

  const determineContentType = (): ContentType => {
    if (pendingAttachments.length === 0) return 'text';
    if (pendingAttachments.length === 1) {
      return pendingAttachments[0].type;
    }
    return 'mixed';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!content.trim() && pendingAttachments.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Use the mutation hook to send the message (this will invalidate the query cache)
      const message = await sendMessage.mutateAsync({
        channelId,
        content: content.trim(),
        contentType: determineContentType(),
        userTag: selectedTag || undefined,
        parentMessageId: replyTo?.id,
      });

      // Then upload attachments if any
      for (const attachment of pendingAttachments) {
        const file = attachment.file instanceof File
          ? attachment.file
          : new File([attachment.file], `${attachment.type}_${Date.now()}.webm`, {
              type: attachment.file.type,
            });

        await feedbackService.uploadAttachment(message.id, file, attachment.type);
      }

      // Reset form
      setContent('');
      setSelectedTag(null);
      setPendingAttachments([]);
      onCancelReply?.();
      onSuccess?.();
      // Note: Toast is handled by the hook
    } catch (error) {
      // Note: Error toast is handled by the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter sends, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = content.trim() || pendingAttachments.length > 0;

  return (
    <div className="border-t border-border bg-card">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={handleVideoFileChange}
        accept="video/*"
        className="hidden"
      />

      {/* Reply Preview */}
      {replyTo && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
            <span className="flex-1 truncate">
              Replying to <span className="font-medium">@{replyTo.username}</span>:{' '}
              <span className="italic">"{replyTo.preview.slice(0, 40)}..."</span>
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-5 w-5 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Attachment Previews */}
      {pendingAttachments.length > 0 && (
        <div className="px-3 pt-3">
          <div className="flex flex-wrap gap-2">
            {pendingAttachments.map((attachment, index) => (
              <div key={index} className="relative group">
                {attachment.type === 'image' && attachment.preview && (
                  <img
                    src={attachment.preview}
                    alt={`Preview ${index + 1}`}
                    className="h-16 w-16 object-cover rounded-lg border"
                  />
                )}
                {attachment.type === 'voice' && (
                  <div className="h-12 px-3 flex items-center gap-2 bg-muted rounded-lg border text-sm">
                    <Mic className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      {Math.floor((attachment.duration || 0) / 60)}:{((attachment.duration || 0) % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                {attachment.type === 'video' && (
                  <div className="h-12 px-3 flex items-center gap-2 bg-muted rounded-lg border text-sm">
                    <VideoIcon className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      {Math.floor((attachment.duration || 0) / 60)}:{((attachment.duration || 0) % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voice/Video Recorders */}
      {showRecorders && (
        <div className="px-3 pt-3">
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Voice:</span>
              <FeedbackVoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Video:</span>
              <FeedbackVideoRecorder
                onRecordingComplete={handleVideoRecording}
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowRecorders(false)}
              className="ml-auto h-7 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Input Area - Conversational Style */}
      <form ref={composerRef} onSubmit={handleSubmit} className="p-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Plus button - Desktop: Dropdown, Mobile: Drawer */}
          {isMobile ? (
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 flex-shrink-0"
                disabled={isSubmitting}
                onClick={() => setIsDrawerOpen(true)}
              >
                <Plus className="h-5 w-5" />
              </Button>
              <DrawerContent>
                <DrawerHeader className="text-left">
                  <DrawerTitle>Add to Feedback</DrawerTitle>
                </DrawerHeader>
                <div className="grid grid-cols-3 gap-4 p-4 pb-8">
                  {/* Attach Screenshot */}
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setIsDrawerOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted active:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <ImageIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium">Screenshot</span>
                  </button>

                  {/* Voice Message */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveRecorder('voice');
                      setShowRecorders(true);
                      setIsDrawerOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted active:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Mic className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm font-medium">Voice</span>
                  </button>

                  {/* Video Upload */}
                  <button
                    type="button"
                    onClick={() => {
                      videoInputRef.current?.click();
                      setIsDrawerOpen(false);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 hover:bg-muted active:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-copper-100 dark:bg-copper-900/30 flex items-center justify-center">
                      <VideoIcon className="h-6 w-6 text-copper-600 dark:text-copper-400" />
                    </div>
                    <span className="text-sm font-medium">Video</span>
                  </button>
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 flex-shrink-0"
                  disabled={isSubmitting}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Attach Screenshot
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowRecorders(true)}>
                  <Mic className="h-4 w-4 mr-2" />
                  Voice Message
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => videoInputRef.current?.click()}>
                  <VideoIcon className="h-4 w-4 mr-2" />
                  Video Upload
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Text Input - Conversational style */}
          <div className="flex-1 min-w-0 relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setCursorPosition(e.target.selectionStart || 0);
              }}
              onSelect={(e) => {
                setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Share your feedback... Use @username to mention"
              disabled={isSubmitting}
              rows={1}
              className={cn(
                "min-h-[44px] max-h-[120px] resize-none tracking-normal",
                "text-base md:text-sm",
                "bg-muted/50 border-0 focus-visible:ring-1 rounded-lg py-3 px-4"
              )}
            />
            {/* Mention Autocomplete */}
            <MentionAutocomplete
              text={content}
              cursorPosition={cursorPosition}
              onSelectMention={(mention: MentionSuggestion, startPos: number, endPos: number) => {
                const before = content.substring(0, startPos);
                const after = content.substring(endPos);
                const newContent = `${before}@${mention.username} ${after}`;
                setContent(newContent);
                // Set cursor position after the mention
                const newCursorPos = startPos + mention.username.length + 2; // +2 for @ and space
                setCursorPosition(newCursorPos);
                // Focus and set cursor
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                  }
                }, 0);
              }}
              textareaRef={textareaRef as React.RefObject<HTMLTextAreaElement>}
            />
          </div>

          {/* Send button - show when there's content */}
          {hasContent && (
            <Button
              type="submit"
              disabled={!hasContent || isSubmitting}
              size="icon"
              className="h-10 w-10 rounded-full flex-shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          )}
        </div>

        {/* Tags - Compact tabs below input with tooltips */}
        <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-1">
          <TooltipProvider delayDuration={300}>
            {TAG_OPTIONS.map((tag) => (
              <Tooltip key={tag}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant={selectedTag === tag ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={cn(
                      "h-7 text-xs px-3 whitespace-nowrap",
                      selectedTag === tag && "bg-primary text-primary-foreground"
                    )}
                    disabled={isSubmitting}
                  >
                    #{USER_TAG_LABELS[tag]}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-center">
                  <p className="text-xs">{TAG_DESCRIPTIONS[tag]}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </form>
    </div>
  );
}
