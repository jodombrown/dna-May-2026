import React, { createContext, useContext, useState, ReactNode } from 'react';
import MessageOverlay from '@/components/messaging/MessageOverlay';
import { messageService } from '@/services/messageService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { usePresenceHeartbeat } from '@/hooks/usePresence';
import { ConversationOriginType, OriginMetadata } from '@/types/messaging';
import { logger } from '@/lib/logger';

interface OpenMessageOverlayParams {
  recipientId: string;
  originType?: ConversationOriginType;
  originId?: string;
  originMetadata?: OriginMetadata;
}

interface MessageContextType {
  openMessageOverlay: (recipientIdOrParams: string | OpenMessageOverlayParams) => void;
  closeMessageOverlay: () => void;
  isOverlayOpen: boolean;
  currentRecipientId?: string;
  currentConversationId?: string;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

interface MessageProviderProps {
  children: ReactNode;
}

/**
 * MessageProvider - Global messaging context
 * 
 * Enables messaging from anywhere in the app by managing the overlay state.
 * Automatically creates or finds conversations when messaging users.
 * 
 * Usage:
 * ```tsx
 * const { openMessageOverlay } = useMessage();
 * <Button onClick={() => openMessageOverlay(userId)}>Message</Button>
 * ```
 */
export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [currentRecipientId, setCurrentRecipientId] = useState<string | undefined>();
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();

  // Keep user's online presence updated (heartbeat)
  usePresenceHeartbeat();

  const openMessageOverlay = async (recipientIdOrParams: string | OpenMessageOverlayParams) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to send messages',
        variant: 'destructive',
      });
      return;
    }

    // Support both simple string and params object
    const params: OpenMessageOverlayParams = typeof recipientIdOrParams === 'string'
      ? { recipientId: recipientIdOrParams }
      : recipientIdOrParams;

    try {
      // Get or create conversation with this user, including origin context
      const conversation = await messageService.getOrCreateConversation(
        params.recipientId,
        params.originType,
        params.originId,
        params.originMetadata as Record<string, unknown> | undefined
      );

      setCurrentRecipientId(params.recipientId);
      setCurrentConversationId(conversation.id);
      setIsOverlayOpen(true);
    } catch (error: unknown) {
      logger.error('MessageContext', 'Failed to open conversation', error);

      // Handle connection requirement error - now allows message requests
      if (error instanceof Error && error.message?.includes('Cannot message')) {
        toast({
          title: 'Cannot Message',
          description: 'You cannot message this user.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to start conversation',
          description: 'Please try again',
          variant: 'destructive',
        });
      }
    }
  };

  const closeMessageOverlay = () => {
    setIsOverlayOpen(false);
    // Keep IDs for a moment to allow smooth close animation
    setTimeout(() => {
      setCurrentRecipientId(undefined);
      setCurrentConversationId(undefined);
    }, 300);
  };

  return (
    <MessageContext.Provider
      value={{
        openMessageOverlay,
        closeMessageOverlay,
        isOverlayOpen,
        currentRecipientId,
        currentConversationId,
      }}
    >
      {children}
      
      {/* Global Message Overlay */}
      {isOverlayOpen && (
        <MessageOverlay
          isOpen={isOverlayOpen}
          onClose={closeMessageOverlay}
          conversationId={currentConversationId}
          recipientId={currentRecipientId}
        />
      )}
    </MessageContext.Provider>
  );
};
