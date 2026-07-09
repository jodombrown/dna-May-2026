import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';
import type { EntityReferenceData, ConversationListItem } from '@/services/messageTypes';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Send, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/useMobile';

interface ConversationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityReference: EntityReferenceData;
}

export const ConversationPicker: React.FC<ConversationPickerProps> = ({
  open,
  onOpenChange,
  entityReference,
}) => {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => messageService.getConversations(50, 0, false),
    enabled: open,
  });

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(c =>
      c.other_user_full_name.toLowerCase().includes(q) ||
      c.other_user_username.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const toggleSelection = (conversationId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(conversationId)) {
        next.delete(conversationId);
      } else {
        next.add(conversationId);
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) return;
    setIsSending(true);

    try {
      for (const conversationId of selectedIds) {
        await messageService.sendEntityReference(
          conversationId,
          entityReference,
          note.trim() || undefined
        );
      }
      toast({
        title: 'Shared',
        description: `Sent to ${selectedIds.size} conversation${selectedIds.size > 1 ? 's' : ''}`,
      });
      onOpenChange(false);
      setSelectedIds(new Set());
      setNote('');
      setSearch('');
    } catch {
      toast({
        title: 'Failed to share',
        description: 'Could not send to one or more conversations',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const pickerContent = (
    <>
      {/* Search */}
      <div className="relative px-1">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      {/* Entity preview */}
      <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 mx-1">
        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-0.5">
          {entityReference.entityType}
        </p>
        <p className="text-sm font-medium truncate">{entityReference.entityTitle}</p>
        {entityReference.entityPreview && (
          <p className="text-xs text-muted-foreground truncate">{entityReference.entityPreview}</p>
        )}
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto min-h-0 px-1 space-y-0.5" style={{ maxHeight: isMobile ? '40vh' : '300px' }}>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {search ? 'No conversations found' : 'No conversations yet'}
          </p>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = selectedIds.has(conv.conversation_id);
            return (
              <button
                key={conv.conversation_id}
                onClick={() => toggleSelection(conv.conversation_id)}
                className={cn(
                  "flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left transition-colors",
                  isSelected
                    ? "bg-primary/10 border border-primary/30"
                    : "hover:bg-muted/60 border border-transparent"
                )}
                type="button"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={conv.other_user_avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                    {conv.other_user_full_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conv.other_user_full_name}
                  </p>
                  {conv.last_message_content && (
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.last_message_content}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Optional note */}
      {selectedIds.size > 0 && (
        <div className="px-1">
          <Textarea
            placeholder="Add a note (optional)..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="text-sm resize-none"
            maxLength={500}
          />
        </div>
      )}

      {/* Send button */}
      <div className="px-1">
        <Button
          onClick={handleSend}
          disabled={selectedIds.size === 0 || isSending}
          className="w-full"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Send to {selectedIds.size || ''} conversation{selectedIds.size !== 1 ? 's' : ''}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] flex flex-col gap-3 pb-6 px-4">
          <DrawerHeader className="px-0 pb-0">
            <DrawerTitle className="text-base">Share in Chat</DrawerTitle>
          </DrawerHeader>
          {pickerContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange} className="sm:max-w-md max-h-[80vh] flex flex-col gap-3">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="text-base">Share in Chat</ResponsiveModalTitle>
        </ResponsiveModalHeader>
        {pickerContent}
      </ResponsiveModal>
  );
};
