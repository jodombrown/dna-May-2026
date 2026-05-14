import { offlineQueueService } from '@/services/offlineQueueService';
import { messageService } from '@/services/messageService';
import { groupMessageService } from '@/services/groupMessageService';
import type { OfflineQueueItem } from '@/types/messagingPRD';

let initialized = false;

/**
 * Initialise the offline queue once and register processors so queued chat
 * messages flush automatically when connectivity returns.
 */
export function initOfflineQueue() {
  if (initialized) return;
  initialized = true;

  offlineQueueService.init();

  offlineQueueService.registerProcessor('send_message', async (item: OfflineQueueItem) => {
    const { conversationId, content, isGroup, mediaUrls, replyToId, payload } =
      item.payload as {
        conversationId: string;
        content: string;
        isGroup?: boolean;
        mediaUrls?: string[];
        replyToId?: string;
        payload?: Record<string, unknown>;
      };

    if (isGroup) {
      await groupMessageService.sendMessage(conversationId, content, {
        replyToId,
        payload,
      });
    } else {
      await messageService.sendMessage(conversationId, content);
    }
  });
}
