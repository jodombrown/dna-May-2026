import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Link2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { messageService } from '@/services/messageService';
import { offlineQueueService } from '@/services/offlineQueueService';
import { cn } from '@/lib/utils';
import { EntitySharePicker } from '@/components/messaging/EntitySharePicker';
import { useMessageDraft } from '@/hooks/messaging/useMessageDraft';

interface MessageComposerProps {
  conversationId: string;
  currentUserId: string;
  onMessageSent?: () => void;
}

/**
 * Apple Messages-inspired composer
 * - Pill-shaped input field
 * - Inline send button
 * - Auto-expanding textarea
 * - Entity share button to share events/spaces/opportunities in chat
 */
export function MessageComposer({
  conversationId,
  currentUserId,
  onMessageSent,
}: MessageComposerProps) {
  const { draft, setDraft, clear: clearDraft } = useMessageDraft(conversationId);
  const message = draft;
  const setMessage = setDraft;
  const [isSending, setIsSending] = useState(false);
  const [showEntityPicker, setShowEntityPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const maxLength = 5000;

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [message]);

  const handleSend = async () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || trimmedMessage.length === 0) {
      return;
    }

    if (trimmedMessage.length > maxLength) {
      toast({
        title: 'Message too long',
        description: `Messages must be ${maxLength} characters or less`,
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);
    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await offlineQueueService.enqueue('send_message', {
          conversationId,
          content: trimmedMessage,
          isGroup: false,
        });
        toast({ title: 'Queued', description: 'Message will send when you are back online.' });
      } else {
        await messageService.sendMessage(conversationId, trimmedMessage);
      }
      clearDraft();
      onMessageSent?.();
      textareaRef.current?.focus();
    } catch (error) {
      // Fallback to queue on transient network failure
      try {
        await offlineQueueService.enqueue('send_message', {
          conversationId,
          content: trimmedMessage,
          isGroup: false,
        });
        clearDraft();
        toast({ title: 'Queued', description: 'Network failed, message will retry.' });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to send message',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur-sm px-4 py-3 safe-area-bottom">
      <div className="flex items-end gap-2">
        {/* Share entity button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full flex-shrink-0"
          onClick={() => setShowEntityPicker(true)}
          title="Share an event, space, or opportunity"
        >
          <Link2 className="h-4 w-4" />
        </Button>

        {/* Pill-shaped input container */}
        <div className="flex-1 flex items-end bg-muted rounded-xl border border-border/50 px-4 py-2">
          <textarea
            ref={textareaRef}
            placeholder="iMessage"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            disabled={isSending}
            rows={1}
            className={cn(
              'flex-1 bg-transparent border-0 resize-none focus:outline-none focus:ring-0',
              'text-[15px] placeholder:text-muted-foreground/60',
              'min-h-[24px] max-h-[120px] py-0'
            )}
          />
        </div>

        {/* Send button - only shows when there's content */}
        <Button
          onClick={handleSend}
          disabled={isSending || !message.trim()}
          size="icon"
          className={cn(
            'h-9 w-9 rounded-full flex-shrink-0 transition-all',
            message.trim()
              ? 'bg-primary hover:bg-primary/90 text-primary-foreground scale-100 opacity-100'
              : 'bg-muted text-muted-foreground scale-90 opacity-50'
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Entity share picker */}
      <EntitySharePicker
        open={showEntityPicker}
        onOpenChange={setShowEntityPicker}
        conversationId={conversationId}
        onEntitySent={onMessageSent}
      />
    </div>
  );
}
