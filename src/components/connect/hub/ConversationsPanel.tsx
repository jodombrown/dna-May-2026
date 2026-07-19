import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  MessageSquare,
  UserPlus,
  Check,
  X,
  Calendar,
  Lightbulb,
  Handshake,
  ChevronRight,
  Clock,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { NetworkActivityFeed } from './NetworkActivityFeed';
import { logger } from '@/lib/logger';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import { connectionService } from '@/services/connectionService';
import { useUniversalComposer } from '@/contexts/ComposerContext';

interface ConversationsPanelProps {
  onSelectConversation?: (conversationId: string) => void;
  onExpandChat?: () => void;
  selectedConversationId?: string | null;
  className?: string;
}

interface Conversation {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_headline: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_online: boolean;
}

interface ConnectionRequest {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  mutual_connections: number;
  created_at: string;
}

/**
 * ConversationsPanel - Right column of CONNECT hub
 *
 * PRD Components:
 * 1. Search Messages Input - Quick search through conversation history
 * 2. Active Conversations List - Recent threads with unread indicators
 * 3. Connection Requests - Pending requests with Accept/Decline
 * 4. Quick Actions Panel - Entry points to other C's
 * 5. Network Activity Feed - What your connections are doing across Five C's
 */
export function ConversationsPanel({
  onSelectConversation,
  onExpandChat,
  selectedConversationId,
  className,
}: ConversationsPanelProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const composer = useUniversalComposer();
  const [searchQuery, setSearchQuery] = useState('');
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());

  // Fetch conversations with robust error handling
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations-panel', user?.id],
    queryFn: async (): Promise<Conversation[]> => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            id,
            user_a,
            user_b,
            last_message_at,
            messages(content, created_at, sender_id)
          `)
          .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
          .order('last_message_at', { ascending: false })
          .limit(10);

        if (error || !data) {
          logger.warn('ConversationsPanel', 'Failed to fetch conversations:', error);
          return [];
        }

        // Fetch other user profiles
        const otherUserIds = data.map((c) =>
          c.user_a === user.id ? c.user_b : c.user_a
        );

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, headline')
          .in('id', otherUserIds);

        if (profilesError) {
          logger.warn('ConversationsPanel', 'Failed to fetch profiles:', profilesError);
        }

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        // Get unread counts using conversation_participants.last_read_at
        const conversationIds = data.map((c) => c.id);
        const { data: participations, error: participationsError } = await supabase
          .from('conversation_participants')
          .select('conversation_id, last_read_at')
          .eq('user_id', user.id)
          .in('conversation_id', conversationIds);

        if (participationsError) {
          logger.warn('ConversationsPanel', 'Failed to fetch participations:', participationsError);
        }

        const unreadCounts = new Map<string, number>();
        
        // For each participation, count messages after last_read_at
        for (const p of participations || []) {
          try {
            let query = supabase
              .from('messages')
              .select('id', { count: 'exact' })
              .eq('conversation_id', p.conversation_id)
              .neq('sender_id', user.id);
            
            if (p.last_read_at) {
              query = query.gt('created_at', p.last_read_at);
            }
            
            const { count, error: countError } = await query;
            if (countError) {
              logger.warn('ConversationsPanel', 'Failed to count unread:', countError);
            }
            unreadCounts.set(p.conversation_id, count || 0);
          } catch (countErr) {
            logger.warn('ConversationsPanel', 'Error counting unread:', countErr);
            unreadCounts.set(p.conversation_id, 0);
          }
        }

        return data.map((conv: { id: string; user_a: string; user_b: string; last_message_at: string | null; messages: { content: string; created_at: string; sender_id: string }[] }) => {
          const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;
          const profile = profileMap.get(otherId);
          const messages = conv.messages as { content: string; created_at: string; sender_id: string }[];
          const lastMessage = messages?.[messages.length - 1];

          return {
            id: conv.id,
            other_user_id: otherId,
            other_user_name: profile?.full_name || 'Member',
            other_user_avatar: profile?.avatar_url || null,
            other_user_headline: profile?.headline || null,
            last_message: lastMessage?.content || null,
            last_message_at: lastMessage?.created_at || conv.last_message_at,
            unread_count: unreadCounts.get(conv.id) || 0,
            is_online: false,
          };
        });
      } catch (error) {
        logger.warn('ConversationsPanel', 'Error fetching conversations:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch connection requests with robust error handling
  const { data: connectionRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['connection-requests-panel', user?.id],
    queryFn: async (): Promise<ConnectionRequest[]> => {
      if (!user) return [];

      try {
        const { data, error } = await supabase
          .from('connections')
          .select('id, requester_id, created_at')
          .eq('recipient_id', user.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error || !data) {
          logger.warn('ConversationsPanel', 'Failed to fetch connection requests:', error);
          return [];
        }

        // Fetch requester profiles
        const requesterIds = data.map((r: { requester_id: string }) => r.requester_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, headline')
          .in('id', requesterIds);

        if (profilesError) {
          logger.warn('ConversationsPanel', 'Failed to fetch requester profiles:', profilesError);
        }

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        return data.map((req: { id: string; requester_id: string; created_at: string }) => {
          const profile = profileMap.get(req.requester_id);
          return {
            id: req.id,
            user_id: req.requester_id,
            full_name: profile?.full_name || 'Member',
            avatar_url: profile?.avatar_url || null,
            headline: profile?.headline || null,
            mutual_connections: 0,
            created_at: req.created_at,
          };
        });
      } catch (error) {
        logger.warn('ConversationsPanel', 'Error fetching connection requests:', error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 30000,
    retry: 2,
    retryDelay: 1000,
  });

  // Filter conversations by search
  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!searchQuery) return conversations;

    return conversations.filter(
      (conv) =>
        conv.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  // Handle accept/decline connection request
  const handleAcceptRequest = async (requestId: string) => {
    setProcessingRequests((prev) => new Set(prev).add(requestId));

    try {
      await connectionService.acceptConnectionRequest(requestId);

      toast({
        title: 'Connection accepted',
        description: 'You are now connected',
      });

      refetchRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept request',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequests((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setProcessingRequests((prev) => new Set(prev).add(requestId));

    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'declined' })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request declined',
      });

      refetchRequests();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline request',
        variant: 'destructive',
      });
    } finally {
      setProcessingRequests((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleConversationClick = (conversationId: string) => {
    onSelectConversation?.(conversationId);
    onExpandChat?.();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Sticky Search Header - aligned with center column */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">

        {/* Active Conversations */}
        <Card>
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </span>
              {conversations && conversations.filter((c) => c.unread_count > 0).length > 0 && (
                <Badge variant="default" className="h-5 px-1.5 text-xs">
                  {conversations.filter((c) => c.unread_count > 0).length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {conversationsLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              <div className="divide-y">
                {filteredConversations.slice(0, 5).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleConversationClick(conv.id)}
                    className={cn(
                      'w-full p-3 text-left hover:bg-muted/50 transition-colors flex items-start gap-3',
                      selectedConversationId === conv.id && 'bg-muted'
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.other_user_avatar || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(conv.other_user_name)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.is_online && (
                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'text-sm font-medium truncate',
                            conv.unread_count > 0 && 'text-foreground'
                          )}
                        >
                          {conv.other_user_name}
                        </span>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(conv.last_message_at), {
                              addSuffix: false,
                            })}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p
                          className={cn(
                            'text-xs truncate mt-0.5',
                            conv.unread_count > 0
                              ? 'text-foreground font-medium'
                              : 'text-muted-foreground'
                          )}
                        >
                          {conv.last_message}
                        </p>
                      )}
                    </div>

                    {conv.unread_count > 0 && (
                      <Badge variant="default" className="h-5 w-5 p-0 text-[10px] justify-center">
                        {conv.unread_count}
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            )}

            {filteredConversations.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={() => navigate('/dna/messages')}
              >
                View all messages
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Connection Requests */}
        {connectionRequests && connectionRequests.length > 0 && (
          <Card>
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Connection Requests
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                  {connectionRequests.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {connectionRequests.map((req) => (
                  <div key={req.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={req.avatar_url || ''} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {getInitials(req.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{req.full_name}</p>
                        {req.headline && (
                          <p className="text-xs text-muted-foreground truncate">
                            {req.headline}
                          </p>
                        )}
                        {req.mutual_connections > 0 && (
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {req.mutual_connections} mutual connection
                            {req.mutual_connections !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={processingRequests.has(req.id)}
                      >
                        {processingRequests.has(req.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Accept
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-8"
                        onClick={() => handleDeclineRequest(req.id)}
                        disabled={processingRequests.has(req.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-muted/30">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start h-10 text-sm"
              onClick={() => composer.open('need')}
            >
              <Lightbulb className="h-4 w-4 mr-2 text-dna-ochre" />
              Post an Opportunity
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-10 text-sm"
              onClick={() => composer.open('event')}
            >
              <Calendar className="h-4 w-4 mr-2 text-dna-sunset" />
              Host an Event
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start h-10 text-sm"
              onClick={() => composer.open('space')}
            >
              <Handshake className="h-4 w-4 mr-2 text-dna-mint" />
              Start a Collaboration
            </Button>
          </CardContent>
        </Card>

        {/* Network Activity Feed */}
        <NetworkActivityFeed />
      </div>

      {/* Universal Composer */}
      </ScrollArea>
    </div>
  );
}

export default ConversationsPanel;
