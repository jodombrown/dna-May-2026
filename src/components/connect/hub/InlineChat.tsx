import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ArrowLeft,
  Send,
  Paperclip,
  MoreHorizontal,
  Loader2,
  Minimize2,
} from 'lucide-react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { EntityReferenceCard } from '@/components/messaging/inbox/EntityReferenceCard';
import type { EntityReferenceData } from '@/services/messageTypes';

interface InlineChatProps {
  conversationId: string;
  onClose: () => void;
  onMinimize?: () => void;
  className?: string;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  payload?: Record<string, unknown> | null;
}

interface ConversationDetails {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_headline: string | null;
  is_online: boolean;
}

/**
 * InlineChat - Expanded chat view for right column
 */
export function InlineChat({
  conversationId,
  onClose,
  onMinimize,
  className,
}: InlineChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversation details
  const { data: conversationDetails } = useQuery({
    queryKey: ['conversation-details', conversationId],
    queryFn: async (): Promise<ConversationDetails | null> => {
      if (!user || !conversationId) return null;

      const { data: conv, error } = await supabase
        .from('conversations')
        .select('id, user_a, user_b')
        .eq('id', conversationId)
        .single();

      if (error || !conv) return null;

      const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, headline')
        .eq('id', otherId)
        .single();

      return {
        id: conv.id,
        other_user_id: otherId,
        other_user_name: profile?.full_name || 'Member',
        other_user_avatar: profile?.avatar_url || null,
        other_user_headline: profile?.headline || null,
        is_online: false,
      };
    },
    enabled: !!user && !!conversationId,
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async (): Promise<Message[]> => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('id, content, sender_id, created_at, read, payload')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) return [];
      return (data || []) as Message[];
    },
    enabled: !!conversationId,
    refetchInterval: 30_000, // Reduced from 5s — realtime handles live messages
  });

  // Mark messages as read
  useEffect(() => {
    if (!user || !conversationId || !messages) return;

    const unreadMessages = messages.filter(
      (m) => m.sender_id !== user.id && !m.read
    );

    if (unreadMessages.length > 0) {
      supabase
        .from('messages')
        .update({ read: true })
        .in('id', unreadMessages.map((m) => m.id))
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['conversations-panel'] });
        });
    }
  }, [messages, user, conversationId, queryClient]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user || !conversationId) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['conversation-messages', conversationId],
      });
      setMessage('');
      textareaRef.current?.focus();
    },
  });

  const handleSendMessage = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessageMutation.mutateAsync(message.trim());
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    messages.forEach((msg) => {
      const msgDate = format(new Date(msg.created_at), 'yyyy-MM-dd');
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: currentDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  const getDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  };

  return (
    <div className={cn('flex flex-col h-full bg-background', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {conversationDetails && (
          <>
            <Avatar className="h-10 w-10">
              <AvatarImage src={conversationDetails.other_user_avatar || ''} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(conversationDetails.other_user_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {conversationDetails.other_user_name}
              </p>
              {conversationDetails.other_user_headline && (
                <p className="text-xs text-muted-foreground truncate">
                  {conversationDetails.other_user_headline}
                </p>
              )}
            </div>
          </>
        )}

        <div className="flex items-center gap-1">
          {onMinimize && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onMinimize}>
              <Minimize2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messagesLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4">
            {groupMessagesByDate(messages).map((group) => (
              <div key={group.date}>
                {/* Date separator */}
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 border-t border-border/50" />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {getDateLabel(group.date)}
                  </span>
                  <div className="flex-1 border-t border-border/50" />
                </div>

                {/* Messages for this date */}
                {group.messages.map((msg, index) => {
                  const isOwn = msg.sender_id === user?.id;
                  const showAvatar =
                    !isOwn &&
                    (index === 0 ||
                      group.messages[index - 1].sender_id !== msg.sender_id);

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex gap-2 mb-1',
                        isOwn ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isOwn && (
                        <div className="w-8">
                          {showAvatar && conversationDetails && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={conversationDetails.other_user_avatar || ''}
                              />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {getInitials(conversationDetails.other_user_name)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}

                      <div
                        className={cn(
                          'max-w-[75%] px-3 py-2 rounded-lg text-sm',
                          isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted rounded-bl-md'
                        )}
                      >
                        {/* Entity Reference Card */}
                        {(msg.payload as Record<string, unknown> | null)?.entityReference && (
                          <EntityReferenceCard
                            entityReference={(msg.payload as Record<string, unknown>).entityReference as EntityReferenceData}
                            isOwn={isOwn}
                          />
                        )}
                        {/* Text content — hide for entity-only messages */}
                        {msg.content && !(msg.payload as Record<string, unknown> | null)?.entityReference && (
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        )}
                        <p
                          className={cn(
                            'text-[10px] mt-1',
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          )}
                        >
                          {formatMessageDate(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start the conversation!
            </p>
          </div>
        )}
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-end gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[40px] max-h-[120px] resize-none pr-12"
              rows={1}
            />
          </div>

          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSendMessage}
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default InlineChat;