/**
 * DNA | Platform Notification Generator — Sprint 4C
 *
 * Generates in-app platform notifications for key user actions.
 * Writes to the Supabase `notifications` table (existing infrastructure).
 *
 * Top 5 notification types for alpha:
 * 1. Connection request received
 * 2. Event RSVP (for hosts)
 * 3. New message received (already handled in messageService)
 * 4. Task assigned
 * 5. Opportunity interest expressed
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface PlatformNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  linkUrl?: string;
  entityType?: string;
  entityId?: string;
  actorId?: string;
}

/**
 * Creates an in-app notification in the notifications table.
 * Fire-and-forget — errors are logged but don't throw.
 */
async function createPlatformNotification(
  params: PlatformNotificationParams
): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert([
      {
        user_id: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link_url: params.linkUrl,
        entity_type: params.entityType,
        entity_id: params.entityId,
        read: false,
        payload: params.actorId
          ? { actor_id: params.actorId }
          : {},
      },
    ]);

    if (error) {
      logger.warn(
        'PlatformNotificationGenerator',
        `Failed to create notification: ${error.message}`
      );
    }
  } catch {
    // Non-critical — notification failures should never break user flows
  }
}

/**
 * Fetch a profile name safely (with fallback).
 */
async function getProfileName(userId: string): Promise<string> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();
  return (data?.full_name as string) || 'Someone';
}

// ============================================================
// PUBLIC API — Call these from mutation handlers
// ============================================================

export const platformNotifications = {
  /**
   * 1. Connection request received.
   * Notify the recipient that someone wants to connect.
   */
  async connectionRequestReceived(
    recipientId: string,
    requesterId: string
  ): Promise<void> {
    const name = await getProfileName(requesterId);
    await createPlatformNotification({
      userId: recipientId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${name} wants to connect with you`,
      linkUrl: '/dna/connect/network?tab=requests',
      entityType: 'connection',
      actorId: requesterId,
    });
  },

  /**
   * 1b. Connection request accepted.
   * Notify the requester that their request was accepted.
   */
  async connectionRequestAccepted(
    requesterId: string,
    accepterId: string
  ): Promise<void> {
    const name = await getProfileName(accepterId);
    await createPlatformNotification({
      userId: requesterId,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: `${name} accepted your connection request`,
      linkUrl: '/dna/connect/network',
      entityType: 'connection',
      actorId: accepterId,
    });
  },

  /**
   * 2. Event RSVP notification for host.
   * Notify the event organizer that someone RSVPd.
   */
  async eventRsvp(
    hostId: string,
    attendeeId: string,
    eventId: string,
    eventTitle: string,
    rsvpStatus: string
  ): Promise<void> {
    // Only notify for positive RSVPs
    if (rsvpStatus !== 'going' && rsvpStatus !== 'maybe') return;
    // Don't notify host for their own RSVP
    if (hostId === attendeeId) return;

    const name = await getProfileName(attendeeId);
    const statusLabel = rsvpStatus === 'going' ? 'is going to' : 'might attend';
    await createPlatformNotification({
      userId: hostId,
      type: 'event_invite',
      title: 'New RSVP',
      message: `${name} ${statusLabel} ${eventTitle || 'your event'}`,
      linkUrl: `/dna/convene/events/${eventId}`,
      entityType: 'event',
      entityId: eventId,
      actorId: attendeeId,
    });
  },

  /**
   * 4. Task assigned notification.
   * Notify the assignee that a task was assigned to them.
   */
  async taskAssigned(
    assigneeId: string,
    assignerId: string,
    spaceId: string,
    taskTitle: string
  ): Promise<void> {
    // Don't notify if assigning to yourself
    if (assigneeId === assignerId) return;

    const name = await getProfileName(assignerId);
    await createPlatformNotification({
      userId: assigneeId,
      type: 'group_invite',
      title: 'Task Assigned',
      message: `${name} assigned you "${taskTitle}"`,
      linkUrl: `/dna/collaborate/spaces/${spaceId}`,
      entityType: 'task',
      entityId: spaceId,
      actorId: assignerId,
    });
  },

  /**
   * 5. Opportunity interest notification for owner.
   * Notify the opportunity creator that someone expressed interest.
   */
  async opportunityInterest(
    ownerId: string,
    responderId: string,
    opportunityId: string,
    opportunityTitle: string
  ): Promise<void> {
    // Don't notify owner for their own interest
    if (ownerId === responderId) return;

    const name = await getProfileName(responderId);
    await createPlatformNotification({
      userId: ownerId,
      type: 'reaction',
      title: 'New Interest',
      message: `${name} expressed interest in ${opportunityTitle || 'your opportunity'}`,
      linkUrl: `/dna/contribute/opportunities/${opportunityId}`,
      entityType: 'opportunity',
      entityId: opportunityId,
      actorId: responderId,
    });
  },

  /**
   * 6. Introduction notification for recipients.
   * Richer notification with introducer name and both avatars.
   */
  async introductionReceived(
    recipientId: string,
    introducerId: string,
    otherPersonName: string,
    conversationId: string,
    messagePreview: string
  ): Promise<void> {
    const introducerName = await getProfileName(introducerId);
    await createPlatformNotification({
      userId: recipientId,
      type: 'introduction',
      title: `${introducerName} introduced you to ${otherPersonName}`,
      message: messagePreview.slice(0, 120),
      linkUrl: `/dna/messages?conversation=${conversationId}`,
      entityType: 'introduction',
      actorId: introducerId,
    });
  },
};
