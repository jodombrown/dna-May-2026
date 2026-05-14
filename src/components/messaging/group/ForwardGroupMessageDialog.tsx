/**
 * ForwardGroupMessageDialog - Forward a group message to other group conversations
 *
 * Lists the user's group conversations (conversations_new) and forwards via
 * groupMessageService.forwardMessage. Mirrors ForwardMessageDialog styling.
 */

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { groupMessageService } from '@/services/groupMessageService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Forward, Check, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/useMobile';

interface ForwardGroupMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messageId: string;
  preview: string;
  /** Exclude the current group from the target list */
  excludeConversationId?: string;
}

export const ForwardGroupMessageDialog: React.FC<ForwardGroupMessageDialogProps> = ({
  open,
  onOpenChange,
  messageId,
  preview,
  excludeConversationId,
}) => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ['group-conversations'],
    queryFn: () => groupMessageService.getGroupConversations(),
    enabled: open,
  });

  const filtered = useMemo(() => {
    const base = conversations.filter((c) => c.conversation_id !== excludeConversationId);
    if (!search.trim()) return base;
    const q = search.toLowerCase();
    return base.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [conversations, search, excludeConversationId]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (selectedIds.size === 0) return;
    setSending(true);
    try {
      await groupMessageService.forwardMessage(
        messageId,
        Array.from(selectedIds),
        note.trim() || undefined,
      );
      toast({
        title: 'Forwarded',
        description: `Sent to ${selectedIds.size} group${selectedIds.size > 1 ? 's' : ''}`,
      });
      onOpenChange(false);
      setSelectedIds(new Set());
      setNote('');
      setSearch('');
    } catch {
      toast({
        title: 'Failed to forward',
        description: 'Could not forward to one or more groups',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const body = (
    <>
      <div className="relative px-1">
        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search groups..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8 h-9 text-sm"
        />
      </div>

      <div className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 mx-1">
        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-0.5">
          Forwarding
        </p>
        <p className="text-sm line-clamp-2">{preview || 'Attachment'}</p>
      </div>

      <div
        className="flex-1 overflow-y-auto min-h-0 px-1 space-y-0.5"
        style={{ maxHeight: isMobile ? '40vh' : '300px' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {search ? 'No groups found' : 'No other groups yet'}
          </p>
        ) : (
          filtered.map((conv) => {
            const isSelected = selectedIds.has(conv.conversation_id);
            return (
              <button
                key={conv.conversation_id}
                onClick={() => toggle(conv.conversation_id)}
                type="button"
                className={cn(
                  'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-left transition-colors',
                  isSelected
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/60 border border-transparent',
                )}
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.title || 'Group'}</p>
                  <p className="text-xs text-muted-foreground">
                    {conv.participant_count} members
                  </p>
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

      <div className="px-1">
        <Button onClick={handleSend} disabled={selectedIds.size === 0 || sending} className="w-full">
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Forward className="h-4 w-4 mr-2" />}
          Forward to {selectedIds.size || ''} group{selectedIds.size !== 1 ? 's' : ''}
        </Button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] flex flex-col gap-3 pb-6 px-4">
          <DrawerHeader className="px-0 pb-0">
            <DrawerTitle className="text-base">Forward Message</DrawerTitle>
          </DrawerHeader>
          {body}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle className="text-base">Forward Message</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
};
