import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Check, X, Shield, MessageSquare } from 'lucide-react';
import { messageService } from '@/services/messageService';
import { useToast } from '@/hooks/use-toast';
import { MessageRequest, ConversationOriginType, OriginMetadata } from '@/types/messaging';

interface MessageRequestBannerProps {
  conversationId: string;
  requester: {
    id: string;
    full_name: string;
    avatar_url?: string;
    headline?: string;
  };
  previewContent?: string;
  originType?: ConversationOriginType;
  originMetadata?: OriginMetadata;
  onAccept?: () => void;
  onDecline?: () => void;
}

/**
 * MessageRequestBanner - Accept/decline message requests
 *
 * Displays when viewing a conversation with pending status.
 * Shows limited message preview (150 chars) per PRD requirements.
 * Implements silent decline (sender not notified).
 */
const MessageRequestBanner: React.FC<MessageRequestBannerProps> = ({
  conversationId,
  requester,
  previewContent,
  originType,
  originMetadata,
  onAccept,
  onDecline,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getInitials = (name: string) => {
    return name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?';
  };

  const getOriginText = () => {
    if (!originType) return null;
    switch (originType) {
      case 'event':
        return `From event: ${originMetadata?.title || 'Unknown event'}`;
      case 'project':
        return `From project: ${originMetadata?.title || 'Unknown project'}`;
      case 'profile':
        return 'Viewed your profile';
      case 'post':
        return `From your post${originMetadata?.preview ? `: "${originMetadata.preview}"` : ''}`;
      default:
        return null;
    }
  };

  // Accept = move bucket to primary; Decline = move to spam (silent decline).
  const acceptMutation = useMutation({
    mutationFn: async () => {
      await messageService.setConversationBucket(conversationId, 'primary');
    },
    onSuccess: () => {
      toast({ title: 'Request accepted', description: 'Conversation moved to Primary' });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['message-requests'] });
      onAccept?.();
    },
    onError: () => {
      toast({ title: 'Could not accept request', variant: 'destructive' });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      await messageService.setConversationBucket(conversationId, 'spam');
    },
    onSuccess: () => {
      toast({ title: 'Request declined' });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['message-requests'] });
      onDecline?.();
    },
    onError: () => {
      toast({ title: 'Could not decline request', variant: 'destructive' });
    },
  });

  const isPending = acceptMutation.isPending || declineMutation.isPending;
  const originText = getOriginText();

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <MessageSquare className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-3">
        {/* Requester info */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={requester.avatar_url || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(requester.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{requester.full_name}</p>
            {requester.headline && (
              <p className="text-xs text-muted-foreground truncate">
                {requester.headline}
              </p>
            )}
          </div>
        </div>

        {/* Origin context */}
        {originText && (
          <p className="text-xs text-muted-foreground italic">{originText}</p>
        )}

        {/* Message preview (limited per PRD) */}
        {previewContent && (
          <div className="bg-background/50 rounded-md p-2 border">
            <p className="text-sm text-muted-foreground">
              {previewContent.substring(0, 150)}
              {previewContent.length > 150 && '...'}
            </p>
          </div>
        )}

        {/* Privacy notice */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Shield className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <span>
            You're not connected with this person. Accept to see the full message
            and allow them to message you directly.
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => declineMutation.mutate()}
            disabled={isPending}
          >
            {declineMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <X className="h-4 w-4 mr-1" />
            )}
            Decline
          </Button>
          <Button
            size="sm"
            onClick={() => acceptMutation.mutate()}
            disabled={isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Check className="h-4 w-4 mr-1" />
            )}
            Accept
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default MessageRequestBanner;

/**
 * MessageRequestCard - Standalone card for message requests list
 */
export const MessageRequestCard: React.FC<{
  request: MessageRequest;
  onAccept?: () => void;
  onDecline?: () => void;
}> = ({ request, onAccept, onDecline }) => {
  return (
    <MessageRequestBanner
      conversationId={request.conversation_id}
      requester={{
        id: request.requester_id,
        full_name: request.requester_full_name,
        avatar_url: request.requester_avatar_url,
        headline: request.requester_headline,
      }}
      previewContent={request.preview_content || undefined}
      originType={request.origin_type}
      originMetadata={request.origin_metadata}
      onAccept={onAccept}
      onDecline={onDecline}
    />
  );
};
