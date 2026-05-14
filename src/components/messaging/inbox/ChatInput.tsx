import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useLinkPreview, extractFirstUrl } from '@/hooks/useLinkPreview';
import { LinkPreview } from './LinkPreview';
import { VoiceMessageRecorder } from './VoiceMessageRecorder';
import { ReplyPreviewBar } from './ReplyPreviewBar';
import type { ReplyToData } from '@/services/messageTypes';

export interface MessageAttachment {
  type: 'image' | 'file';
  url: string;
  filename: string;
  filesize?: number;
  mimetype?: string;
}

export interface MessageLinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

interface ChatInputProps {
  onSend: (content: string, attachment?: MessageAttachment, linkPreview?: MessageLinkPreview) => void;
  onSendVoice?: (audioBlob: Blob, duration: number) => Promise<void>;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyingTo?: ReplyToData | null;
  onCancelReply?: () => void;
  /** Phase 12 - external seed (e.g. DIA smart reply chip). Bumping `seedNonce`
   *  with non-empty `seedText` injects text into the composer. */
  seedText?: string;
  seedNonce?: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  onSendVoice,
  onTyping,
  disabled = false,
  placeholder = "Type a message...",
  replyingTo,
  onCancelReply,
  seedText,
  seedNonce,
}) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [isVoiceRecorderActive, setIsVoiceRecorderActive] = useState(false);

  // Phase 12 - inject DIA suggestion into composer when seedNonce changes
  useEffect(() => {
    if (seedNonce && seedText) {
      setMessage((prev) => (prev ? `${prev} ${seedText}` : seedText));
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedNonce]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { uploadImage, uploading } = useImageUpload();
  const { toast } = useToast();
  
  // Detect links for preview
  const { previews, loading: previewLoading } = useLinkPreview(message);
  const detectedUrl = extractFirstUrl(message);
  const linkPreview = previews[0];

  // Auto-resize textarea - WhatsApp style: grow up to ~100px then scroll internally
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxH = 100; // ~3-4 lines, then internal scroll
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 38), maxH)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxH ? 'auto' : 'hidden';
    }
  }, [message]);

  // Remove URL from message text when sending if link preview exists
  const getCleanedMessage = () => {
    if (linkPreview && detectedUrl) {
      return message.replace(detectedUrl, '').trim();
    }
    return message.trim();
  };

  const handleSend = () => {
    const cleanedMessage = getCleanedMessage();
    if ((cleanedMessage || attachment || linkPreview) && !disabled) {
      // Pass link preview data when sending
      const linkPreviewData: MessageLinkPreview | undefined = linkPreview ? {
        url: linkPreview.url,
        title: linkPreview.title,
        description: linkPreview.description,
        image: linkPreview.image,
        siteName: linkPreview.siteName,
      } : undefined;
      
      onSend(cleanedMessage, attachment || undefined, linkPreviewData);
      setMessage('');
      setAttachment(null);
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = '44px';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      onTyping?.();
    }
    if (e.key === 'Escape' && replyingTo && onCancelReply) {
      e.preventDefault();
      onCancelReply();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const url = await uploadImage(file, 'message-attachments');
      if (url) {
        const isImage = file.type.startsWith('image/');
        setAttachment({
          type: isImage ? 'image' : 'file',
          url,
          filename: file.name,
          filesize: file.size,
          mimetype: file.type,
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive"
      });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  return (
    <div className="border-t border-border/20 bg-muted/30 dark:bg-neutral-900/80 flex-shrink-0">
      {/* Reply Preview Bar */}
      {replyingTo && onCancelReply && (
        <ReplyPreviewBar replyingTo={replyingTo} onCancel={onCancelReply} />
      )}

      {/* Link Preview - shown before sending */}
      {linkPreview && !attachment && (
        <div className="px-2.5 pt-2">
          <div className="relative">
            <LinkPreview preview={linkPreview} isOwn={false} />
            {previewLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attachment Preview */}
      {attachment && (
        <div className="px-2.5 pt-2">
          <div className="relative inline-block">
            {attachment.type === 'image' ? (
              <div className="relative">
                <img 
                  src={attachment.url} 
                  alt={attachment.filename}
                  className="h-16 w-auto rounded-lg object-cover"
                />
                <button
                  onClick={removeAttachment}
                  className="absolute -top-1.5 -right-1.5 p-0.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-1.5 pr-7">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs truncate max-w-[180px]">{attachment.filename}</span>
                <button
                  onClick={removeAttachment}
                  className="absolute -top-1.5 -right-1.5 p-0.5 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {/* File input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
            className="hidden"
          />

          {/* Attachment button */}
          {!isVoiceRecorderActive && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 flex-shrink-0 hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          )}

          {/* Voice Message Recorder */}
          {onSendVoice && !message.trim() && !attachment && (
            <VoiceMessageRecorder 
              onSendVoice={onSendVoice} 
              disabled={disabled}
              onActiveStateChange={setIsVoiceRecorderActive}
            />
          )}

          {/* Input */}
          {!isVoiceRecorderActive && (
            <div className="flex-1 min-w-0">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                className={cn(
                  "min-h-[38px] max-h-[100px] resize-none overflow-y-hidden",
                  "text-[15px] md:text-sm",
                  "bg-background border-border/50 focus-visible:ring-1 focus-visible:ring-primary/40 rounded-lg py-2 px-3"
                )}
              />
            </div>
          )}

          {/* Send button */}
          {(message.trim() || attachment || linkPreview) && !isVoiceRecorderActive && (
            <Button 
              onClick={handleSend}
              disabled={(!message.trim() && !attachment && !linkPreview) || disabled}
              size="icon"
              className="h-9 w-9 rounded-full flex-shrink-0 bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
