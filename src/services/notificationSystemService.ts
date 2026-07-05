/**
 * DNA | Notification System Service
 *
 * Core notification creation, delivery, batching, and management.
 * Every notification flows through this service: create -> DIA evaluate -> deliver.
 *
 * Flow:
 * 1. Event triggers create() with type, recipient, actor, target
 * 2. Check preferences and mutes
 * 3. Generate content from templates
 * 4. DIA evaluates priority, channels, timing, suppression
 * 5. Check batching thresholds
 * 6. Write to DB and deliver via selected channels
 * 7. Track delivery status for feedback loop
 */

import { supabase } from '@/integrations/supabase/client';
import { typedSupabase } from '@/lib/typedSupabase';
// notificationSystemService uses multiple provisional tables (notification_records,
// notification_batches, push_tokens) plus real supabase methods (.functions, .rpc, .channel).
// Use supabase directly for real methods, provisionalDb for provisional tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
import { logger } from '@/lib/logger';
import type {
  NotificationRecord,
  NotificationType,
  NotificationChannel,
  NotificationCategory,
  NotificationPriority,
  NotificationPreferences,
  NotificationBatch,
  NotificationDisplayConfig,
  NotificationDisplayItem,
  NotificationFilter,
  NotificationAction,
  NotificationTargetType,
  NotificationBatchType,
  CrossCNotificationContext,
  CreateNotificationParams,
  DiaEvaluationResult,
} from '@/types/notificationSystem';
import {
  NotificationStatus,
  NOTIFICATION_DISPLAY_CONFIGS,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '@/types/notificationSystem';
import { CModule } from '@/types/composer';

// ============================================================
// CONTENT TEMPLATES
// ============================================================

type ContentTemplate = (params: Record<string, unknown>) => { headline: string; body: string | null };

const CONTENT_TEMPLATES: Partial<Record<NotificationType, ContentTemplate>> = {
  // CONNECT
  connection_request_received: (p) => ({
    headline: `${p.actorName} wants to connect`,
    body: p.mutualCount ? `${p.mutualCount} mutual connections` : null,
  }),
  connection_request_accepted: (p) => ({
    headline: `${p.actorName} accepted your connection`,
    body: 'You can now message each other directly.',
  }),
  connection_suggestion: (p) => ({
    headline: `DIA found a match: ${p.actorName}`,
    body: p.matchReason as string || null,
  }),
  profile_viewed: (p) => ({
    headline: `${p.actorName} viewed your profile`,
    body: null,
  }),
  profile_endorsed: (p) => ({
    headline: `${p.actorName} endorsed your ${p.skill} skills`,
    body: null,
  }),
  mentioned_in_post: (p) => ({
    headline: `${p.actorName} mentioned you in a post`,
    body: p.postPreview ? (p.postPreview as string).slice(0, 100) : null,
  }),
  mentioned_in_comment: (p) => ({
    headline: `${p.actorName} mentioned you in a comment`,
    body: p.commentPreview ? (p.commentPreview as string).slice(0, 100) : null,
  }),
  post_liked: (p) => ({
    headline: `${p.actorName} affirmed your post`,
    body: null,
  }),
  post_commented: (p) => ({
    headline: `${p.actorName} commented on your post`,
    body: p.commentPreview ? `"${(p.commentPreview as string).slice(0, 80)}"` : null,
  }),
  post_reshared: (p) => ({
    headline: `${p.actorName} reshared your post`,
    body: null,
  }),
  comment_replied: (p) => ({
    headline: `${p.actorName} replied to your comment`,
    body: p.replyPreview ? `"${(p.replyPreview as string).slice(0, 80)}"` : null,
  }),
  network_milestone: (p) => ({
    headline: `You reached ${p.count} connections!`,
    body: p.countryCount ? `Your network spans ${p.countryCount} countries. Keep building.` : null,
  }),

  // CONVENE
  event_invitation: (p) => ({
    headline: `You\u2019re invited to ${p.targetTitle}`,
    body: `${p.actorName} invited you. ${p.eventDate || ''}`,
  }),
  event_rsvp_confirmed: (p) => ({
    headline: `RSVP confirmed for ${p.targetTitle}`,
    body: `${p.eventDate || ''} \u2022 ${p.eventLocation || 'Virtual'}`,
  }),
  event_reminder_24h: (p) => ({
    headline: `${p.targetTitle} is tomorrow`,
    body: `${p.eventTime || ''} \u2022 ${p.eventLocation || 'Virtual'}`,
  }),
  event_reminder_1h: (p) => ({
    headline: `${p.targetTitle} starts in 1 hour`,
    body: p.virtualLink ? 'Tap to join the virtual event.' : `${p.eventLocation || ''}`,
  }),
  event_starting_now: (p) => ({
    headline: `${p.targetTitle} is starting now`,
    body: p.virtualLink ? 'Join now \u2192' : 'The event has begun.',
  }),
  event_updated: (p) => ({
    headline: `${p.targetTitle} has been updated`,
    body: p.updateSummary as string || 'Check the event details for changes.',
  }),
  event_cancelled: (p) => ({
    headline: `${p.targetTitle} has been cancelled`,
    body: p.cancellationReason as string || 'The organizer cancelled this event.',
  }),
  event_cohost_invitation: (p) => ({
    headline: `${p.actorName} invited you to co-host ${p.targetTitle}`,
    body: 'Accept to help organize this event.',
  }),
  event_new_attendee: (p) => ({
    headline: `${p.actorName} is attending ${p.targetTitle}`,
    body: null,
  }),
  event_capacity_warning: (p) => ({
    headline: `${p.targetTitle} is almost full`,
    body: `${p.capacityPercent || 90}% capacity reached.`,
  }),
  event_connections_attending: (p) => ({
    headline: `${p.connectionCount} connections attending ${p.targetTitle}`,
    body: p.connectionNames ? `${(p.connectionNames as string[]).slice(0, 3).join(', ')} and others.` : null,
  }),
  post_event_recap_prompt: (p) => ({
    headline: `Share your ${p.targetTitle} experience`,
    body: 'Write a recap to share insights with your network.',
  }),

  // COLLABORATE
  space_invitation: (p) => ({
    headline: `You\u2019re invited to join ${p.targetTitle}`,
    body: `${p.actorName} thinks your skills would be valuable.`,
  }),
  space_join_request: (p) => ({
    headline: `${p.actorName} wants to join ${p.targetTitle}`,
    body: 'Review their request to join your Space.',
  }),
  space_join_approved: (p) => ({
    headline: `You\u2019ve been accepted to ${p.targetTitle}`,
    body: 'Welcome to the Space! Start collaborating.',
  }),
  space_role_assigned: (p) => ({
    headline: `You\u2019re now ${p.roleName} in ${p.targetTitle}`,
    body: `${p.actorName} assigned you this role.`,
  }),
  task_assigned: (p) => ({
    headline: `New task: ${p.taskTitle || p.targetTitle}`,
    body: `In ${p.spaceName || p.targetTitle} \u2022 ${p.actorName} assigned you`,
  }),
  task_completed: (p) => ({
    headline: `Task completed: ${p.taskTitle || p.targetTitle}`,
    body: `${p.actorName} marked this as done.`,
  }),
  task_due_soon: (p) => ({
    headline: `Task due soon: ${p.taskTitle || p.targetTitle}`,
    body: `Due ${p.dueDate || 'soon'} in ${p.spaceName || ''}`,
  }),
  task_overdue: (p) => ({
    headline: `Task overdue: ${p.taskTitle || p.targetTitle}`,
    body: `Was due ${p.dueDate || 'recently'}. Please update status.`,
  }),
  space_milestone: (p) => ({
    headline: `${p.targetTitle}: ${p.milestoneName || 'Milestone reached'}`,
    body: p.milestoneDescription as string || null,
  }),
  space_stall_alert: (p) => ({
    headline: `${p.targetTitle} needs attention`,
    body: `No activity in ${p.daysSinceActivity || 14} days. Post an update?`,
  }),

  // CONTRIBUTE
  opportunity_match: (p) => ({
    headline: `${p.matchScore ? Math.round(Number(p.matchScore) * 100) + '% match' : 'New match'} for your skills`,
    body: `${p.targetTitle} \u2022 ${p.matchReason || ''}`,
  }),
  opportunity_interest_received: (p) => ({
    headline: `${p.actorName} is interested in your opportunity`,
    body: `${p.targetTitle}`,
  }),
  opportunity_interest_accepted: (p) => ({
    headline: `Your interest in ${p.targetTitle} was accepted`,
    body: `${p.actorName} wants to connect about this opportunity.`,
  }),
  opportunity_deadline_approaching: (p) => ({
    headline: `Deadline approaching: ${p.targetTitle}`,
    body: `${p.daysRemaining || 'A few'} days remaining. ${p.interestCount ? `${p.interestCount} people interested.` : ''}`,
  }),
  opportunity_skills_in_demand: (p) => ({
    headline: `${p.demandCount || 'Several'} people need your ${p.skillName} expertise`,
    body: 'Consider posting an Offer to help the diaspora.',
  }),

  // CONVEY
  story_liked: (p) => ({
    headline: `${p.actorName} affirmed your story`,
    body: p.targetTitle ? `"${p.targetTitle}"` : null,
  }),
  story_commented: (p) => ({
    headline: `${p.actorName} commented on your story`,
    body: p.commentPreview ? `"${(p.commentPreview as string).slice(0, 80)}"` : null,
  }),
  story_reshared: (p) => ({
    headline: `${p.actorName} shared your story`,
    body: p.targetTitle ? `"${p.targetTitle}"` : null,
  }),
  story_new_follower: (p) => ({
    headline: `${p.actorName} started following you`,
    body: null,
  }),
  story_series_update: (p) => ({
    headline: `New part in "${p.seriesTitle || p.targetTitle}"`,
    body: `${p.actorName} published a new installment.`,
  }),
  story_engagement_milestone: (p) => ({
    headline: `Your story reached ${p.count} ${p.metric || 'reads'}`,
    body: p.targetTitle ? `"${p.targetTitle}" is resonating with the diaspora.` : null,
  }),
  story_trending: (p) => ({
    headline: 'Your story is trending',
    body: p.targetTitle ? `"${p.targetTitle}" \u2022 Shared ${p.shareCount || 'many'} times` : null,
  }),

  // DIA
  dia_weekly_digest: () => ({
    headline: 'Your weekly DNA digest is ready',
    body: 'See what happened across your Five C\u2019s this week.',
  }),
  dia_impact_snapshot: (p) => ({
    headline: 'Your impact snapshot is ready',
    body: p.summaryLine as string || 'See how you\u2019ve contributed to the diaspora.',
  }),
  dia_five_c_activation: (p) => ({
    headline: `Explore ${p.moduleName || 'a new C'}`,
    body: p.reason as string || 'DIA found opportunities for you in a new module.',
  }),
  dia_reconnect_suggestion: (p) => ({
    headline: `Reconnect with ${p.actorName}`,
    body: p.reason as string || 'It\u2019s been a while since you connected.',
  }),

  // SYSTEM
  system_security_alert: (p) => ({
    headline: 'New login detected',
    body: `From ${p.location || 'unknown location'} \u2022 ${p.device || 'unknown device'}. Not you? Secure your account.`,
  }),
  system_payment_confirmed: (p) => ({
    headline: 'Payment confirmed',
    body: p.amount ? `${p.amount} processed successfully.` : 'Your payment was processed.',
  }),
  system_payment_failed: (p) => ({
    headline: 'Payment failed',
    body: p.reason as string || 'Please update your payment method.',
  }),
  system_tier_upgraded: (p) => ({
    headline: `Welcome to DNA ${p.tierName || 'Pro'}!`,
    body: 'Enjoy your upgraded features.',
  }),
  system_tier_expiring: (p) => ({
    headline: `Your ${p.tierName || 'Pro'} subscription expires soon`,
    body: `Renew by ${p.expiryDate || 'next billing date'} to keep your features.`,
  }),

  // MESSAGING
  message_received: (p) => ({
    headline: `${p.actorName} sent you a message`,
    body: p.messagePreview ? (p.messagePreview as string).slice(0, 80) : null,
  }),
  message_group_added: (p) => ({
    headline: `${p.actorName} added you to ${p.groupName || 'a group chat'}`,
    body: null,
  }),
};

// ============================================================
// BATCH HEADLINE TEMPLATES
// ============================================================

function generateBatchHeadline(type: NotificationType, count: number, targetTitle: string): string {
  const templates: Record<string, string> = {
    post_liked: `${count} people affirmed your post`,
    post_commented: `${count} people commented on your post`,
    post_reshared: `${count} people reshared your post`,
    story_liked: `${count} people affirmed "${targetTitle}"`,
    story_reshared: `${count} people shared "${targetTitle}"`,
    story_commented: `${count} people commented on "${targetTitle}"`,
    event_new_attendee: `${count} new attendees for ${targetTitle}`,
    opportunity_interest_received: `${count} people interested in ${targetTitle}`,
    profile_viewed: `${count} people viewed your profile`,
    story_new_follower: `${count} new followers`,
    connection_suggestion: `${count} people you should know`,
  };
  return templates[type] || `${count} new notifications`;
}

function getBatchType(type: NotificationType): NotificationBatchType {
  const map: Partial<Record<NotificationType, NotificationBatchType>> = {
    post_liked: 'post_likes',
    post_commented: 'post_comments',
    story_liked: 'story_engagement',
    story_commented: 'story_engagement',
    story_reshared: 'story_engagement',
    event_new_attendee: 'event_attendees',
    task_completed: 'space_activity',
    opportunity_interest_received: 'opportunity_interest',
    profile_viewed: 'profile_views',
    connection_suggestion: 'connection_suggestions',
  };
  return map[type] || 'post_likes';
}

// ============================================================
// ACTION BUILDERS
// ============================================================

function buildPrimaryAction(type: NotificationType, targetType: NotificationTargetType, targetId: string): NotificationAction {
  const routeMap: Partial<Record<string, string>> = {
    profile: `/u/${targetId}`,
    post: `/dna/feed?post=${targetId}`,
    comment: `/dna/feed?post=${targetId}`,
    story: `/dna/convey/stories/${targetId}`,
    event: `/dna/convene/events/${targetId}`,
    space: `/dna/collaborate/spaces/${targetId}`,
    task: `/dna/collaborate/tasks/${targetId}`,
    opportunity: `/dna/contribute/opportunities/${targetId}`,
    message: `/dna/messages/${targetId}`,
    conversation: `/dna/messages/${targetId}`,
    dia_insight: '/dna/dia',
    system: '/dna/settings',
  };

  const labelMap: Partial<Record<NotificationType, string>> = {
    connection_request_received: 'View Request',
    event_invitation: 'RSVP',
    space_invitation: 'View Space',
    task_assigned: 'View Task',
    opportunity_match: 'View Opportunity',
    message_received: 'Reply',
    dia_weekly_digest: 'View Digest',
    system_security_alert: 'Review Activity',
  };

  return {
    type: 'navigate',
    label: labelMap[type] || 'View',
    route: routeMap[targetType] || `/dna/feed`,
    payload: { targetType, targetId },
  };
}

function buildSecondaryAction(type: NotificationType): NotificationAction | null {
  switch (type) {
    case 'connection_request_received':
      return { type: 'inline_dismiss', label: 'Decline', route: null, payload: {} };
    case 'event_invitation':
      return { type: 'inline_dismiss', label: 'Decline', route: null, payload: {} };
    case 'space_invitation':
      return { type: 'inline_dismiss', label: 'Decline', route: null, payload: {} };
    case 'event_cohost_invitation':
      return { type: 'inline_dismiss', label: 'Decline', route: null, payload: {} };
    default:
      return null;
  }
}

// ============================================================
// DB FIELD MAPPING (camelCase <-> snake_case)
// ============================================================

function mapRecordFromDb(row: Record<string, unknown>): NotificationRecord {
  return {
    id: row.id as string,
    recipientId: row.recipient_id as string,
    type: row.type as NotificationType,
    category: row.category as NotificationCategory,
    cModule: row.c_module as CModule,
    priority: row.priority as NotificationPriority,
    headline: row.headline as string,
    body: row.body as string | null,
    imageUrl: row.image_url as string | null,
    iconType: row.icon_type as string,
    actorId: row.actor_id as string | null,
    actorName: row.actor_name as string | null,
    actorAvatarUrl: row.actor_avatar_url as string | null,
    targetType: row.target_type as NotificationTargetType,
    targetId: row.target_id as string,
    targetTitle: row.target_title as string | null,
    primaryAction: (row.primary_action || {}) as NotificationAction,
    secondaryAction: row.secondary_action as NotificationAction | null,
    crossCContext: row.cross_c_context as CrossCNotificationContext | null,
    channels: (row.channels || []) as NotificationChannel[],
    deliveredVia: (row.delivered_via || []) as NotificationChannel[],
    scheduledFor: row.scheduled_for as string | null,
    batchId: row.batch_id as string | null,
    status: row.status as NotificationStatus,
    createdAt: row.created_at as string,
    deliveredAt: row.delivered_at as string | null,
    seenAt: row.seen_at as string | null,
    openedAt: row.opened_at as string | null,
    actedOnAt: row.acted_on_at as string | null,
    dismissedAt: row.dismissed_at as string | null,
    diaScore: row.dia_score as number,
    diaSuppressed: row.dia_suppressed as boolean,
    diaSuppressionReason: row.dia_suppression_reason as string | null,
  } as NotificationRecord;
}

function mapBatchFromDb(row: Record<string, unknown>): NotificationBatch {
  return {
    id: row.id as string,
    recipientId: row.recipient_id as string,
    batchType: row.batch_type as NotificationBatchType,
    headline: row.headline as string,
    itemCount: row.item_count as number,
    representativeActors: (row.representative_actors || []) as { name: string; avatarUrl: string | null }[],
    cModule: row.c_module as CModule,
    targetType: row.target_type as NotificationTargetType,
    targetId: row.target_id as string,
    targetTitle: row.target_title as string | null,
    primaryAction: (row.primary_action || {}) as NotificationAction,
    childNotificationIds: (row.child_notification_ids || []) as string[],
    createdAt: row.created_at as string,
    status: row.status as NotificationStatus,
  };
}

// ============================================================
// NOTIFICATION SYSTEM SERVICE
// ============================================================

export const notificationSystemService = {

  // ============================================
  // CREATE NOTIFICATION
  // ============================================

  async create(params: CreateNotificationParams): Promise<NotificationRecord | null> {
    try {
      const config = NOTIFICATION_DISPLAY_CONFIGS[params.type];
      if (!config) {
        logger.warn('NotificationSystemService', `Unknown notification type: ${params.type}`);
        return null;
      }

      // Step 1: Check if recipient has this type enabled
      const prefs = await this.getPreferences(params.recipientId);
      if (!prefs.globalEnabled) return null;

      const categoryPref = prefs.categoryPreferences[config.category];
      if (categoryPref && !categoryPref.enabled) return null;

      // Step 2: Check for muted entities
      if (params.actorId && prefs.mutedUserIds.includes(params.actorId)) return null;

      // Step 3: Generate headline and body
      const templateParams: Record<string, unknown> = {
        ...params.metadata,
        actorName: '',
        targetTitle: params.targetTitle,
      };

      // Get actor details
      let actorName: string | null = null;
      let actorAvatarUrl: string | null = null;

      if (params.actorId) {
        const { data: actorProfile } = await db
          .from('profiles')
          .select('full_name, username, avatar_url')
          .eq('id', params.actorId)
          .single();

        if (actorProfile) {
          actorName = actorProfile.full_name || actorProfile.username || 'Someone';
          actorAvatarUrl = actorProfile.avatar_url || null;
          templateParams.actorName = actorName;
        }
      }

      let headline = params.customHeadline || '';
      let body = params.customBody || null;

      if (!params.customHeadline) {
        const template = CONTENT_TEMPLATES[params.type];
        if (template) {
          const content = template(templateParams);
          headline = content.headline;
          body = content.body;
        } else {
          headline = 'New notification';
        }
      }

      // Step 4: Determine channels
      const channels = this.determineChannels(config, prefs);

      // Step 5: Check batching
      if (config.batchable && categoryPref?.batchingEnabled !== false) {
        const batched = await this.tryBatch(params, config, actorName, actorAvatarUrl);
        if (batched) return null;
      }

      // Step 6: Build notification record
      const primaryAction = buildPrimaryAction(params.type, params.targetType, params.targetId);
      const secondaryAction = config.inlineActions ? buildSecondaryAction(params.type) : null;

      // Step 7: DIA evaluation
      const diaResult = await this.diaEvaluate(
        params.recipientId,
        params.type,
        config.defaultPriority,
        params.actorId || null,
        prefs
      );

      const status = diaResult.suppress
        ? NotificationStatus.SUPPRESSED
        : diaResult.scheduledFor
          ? NotificationStatus.SCHEDULED
          : NotificationStatus.QUEUED;

      // Step 8: Write to database
      const { data, error } = await db
        .from('notification_records')
        .insert({
          recipient_id: params.recipientId,
          type: params.type,
          category: config.category,
          c_module: config.cModule,
          priority: diaResult.adjustedPriority,
          headline,
          body,
          image_url: actorAvatarUrl,
          icon_type: config.icon,
          actor_id: params.actorId || null,
          actor_name: actorName,
          actor_avatar_url: actorAvatarUrl,
          target_type: params.targetType,
          target_id: params.targetId,
          target_title: params.targetTitle || null,
          primary_action: primaryAction,
          secondary_action: secondaryAction,
          cross_c_context: params.crossCContext || null,
          channels,
          scheduled_for: diaResult.scheduledFor,
          status,
          dia_score: diaResult.relevanceScore,
          dia_suppressed: diaResult.suppress,
          dia_suppression_reason: diaResult.suppressionReason,
        })
        .select()
        .single();

      if (error) {
        logger.error('NotificationSystemService', 'Failed to create notification', error);
        return null;
      }

      const record = mapRecordFromDb(data as Record<string, unknown>);

      // Step 9: Deliver immediately if not suppressed or scheduled
      if (!diaResult.suppress && !diaResult.scheduledFor) {
        this.deliver(record).catch((err) => {
          logger.error('NotificationSystemService', 'Delivery failed', err);
        });
      }

      return record;
    } catch (error) {
      logger.error('NotificationSystemService', 'create() failed', error);
      return null;
    }
  },

  // ============================================
  // CHANNEL DETERMINATION
  // ============================================

  determineChannels(
    config: NotificationDisplayConfig,
    prefs: NotificationPreferences
  ): NotificationChannel[] {
    const channels: NotificationChannel[] = [];
    const categoryPref = prefs.categoryPreferences[config.category];

    if (!categoryPref) {
      return ['in_app', 'badge'] as NotificationChannel[];
    }

    for (const ch of categoryPref.channels) {
      switch (ch) {
        case 'in_app':
          channels.push('in_app' as NotificationChannel);
          break;
        case 'push':
          if (prefs.pushEnabled) channels.push('push' as NotificationChannel);
          break;
        case 'email_immediate':
          if (prefs.emailEnabled) channels.push('email_immediate' as NotificationChannel);
          break;
        case 'badge':
          channels.push('badge' as NotificationChannel);
          break;
      }
    }

    if (channels.length === 0) {
      channels.push('in_app' as NotificationChannel);
    }

    return channels;
  },

  // ============================================
  // DIA EVALUATION
  // ============================================

  async diaEvaluate(
    recipientId: string,
    type: NotificationType,
    defaultPriority: string,
    actorId: string | null,
    prefs: NotificationPreferences
  ): Promise<DiaEvaluationResult> {
    let suppress = false;
    let suppressionReason: string | null = null;
    let scheduledFor: string | null = null;
    let adjustedPriority = defaultPriority as NotificationPriority;
    let relevanceScore = 0.5;

    // 1. Check quiet hours (never suppress CRITICAL)
    if (adjustedPriority !== 'critical' && prefs.quietHoursEnabled) {
      const userHour = this.getUserLocalHour(prefs.timezone);
      const inQuietHours = prefs.quietHoursStart > prefs.quietHoursEnd
        ? (userHour >= prefs.quietHoursStart || userHour < prefs.quietHoursEnd)
        : (userHour >= prefs.quietHoursStart && userHour < prefs.quietHoursEnd);

      if (inQuietHours) {
        if (adjustedPriority === 'urgent') {
          scheduledFor = this.getNextQuietHoursEnd(prefs);
        }
        // Non-urgent during quiet hours: suppress push
      }
    }

    // 2. Check rate limits (simple: max 50 notifications per day)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayCount } = await db
      .from('notification_records')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', recipientId)
      .gte('created_at', todayStart.toISOString())
      .not('status', 'eq', 'suppressed');

    if ((todayCount || 0) >= 50 && adjustedPriority !== 'critical' && adjustedPriority !== 'urgent') {
      suppress = true;
      suppressionReason = 'daily_rate_limit';
    }

    // 3. Check per-type cooldown (most types shouldn't fire more than once per hour)
    if (!suppress && adjustedPriority !== 'critical' && adjustedPriority !== 'urgent') {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count: recentSameType } = await db
        .from('notification_records')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', recipientId)
        .eq('type', type)
        .gte('created_at', oneHourAgo)
        .not('status', 'eq', 'suppressed');

      if ((recentSameType || 0) >= 3) {
        suppress = true;
        suppressionReason = 'type_cooldown';
      }
    }

    // 4. Compute relevance score (simplified)
    if (actorId) {
      const { count: mutualConnections } = await db
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${recipientId},recipient_id.eq.${recipientId}`)
        .or(`requester_id.eq.${actorId},recipient_id.eq.${actorId}`);

      if (mutualConnections && mutualConnections > 5) {
        relevanceScore = Math.min(0.9, 0.5 + mutualConnections * 0.02);
      }
    }

    // 5. Adjust priority based on relevance
    if (relevanceScore > 0.8 && adjustedPriority === 'medium') {
      adjustedPriority = 'high' as NotificationPriority;
    }
    if (relevanceScore < 0.3 && adjustedPriority === 'medium') {
      adjustedPriority = 'low' as NotificationPriority;
    }

    return { adjustedPriority, relevanceScore, scheduledFor, suppress, suppressionReason };
  },

  // ============================================
  // BATCHING
  // ============================================

  async tryBatch(
    params: CreateNotificationParams,
    config: NotificationDisplayConfig,
    actorName: string | null,
    actorAvatarUrl: string | null
  ): Promise<boolean> {
    const { data: existing } = await db
      .from('notification_records')
      .select('id')
      .eq('recipient_id', params.recipientId)
      .eq('type', params.type)
      .eq('target_id', params.targetId)
      .eq('status', 'delivered')
      .gte('created_at', new Date(Date.now() - config.batchWindow * 60000).toISOString());

    if (!existing || existing.length < config.batchThreshold - 1) return false;

    const batchHeadline = generateBatchHeadline(
      params.type,
      existing.length + 1,
      params.targetTitle || ''
    );

    // Mark existing as batched
    await db
      .from('notification_records')
      .update({ status: 'batched' })
      .in('id', existing.map((n: { id: string }) => n.id));

    const primaryAction = buildPrimaryAction(params.type, params.targetType, params.targetId);

    // Upsert batch record
    await db
      .from('notification_batches')
      .upsert({
        recipient_id: params.recipientId,
        batch_type: getBatchType(params.type),
        headline: batchHeadline,
        item_count: existing.length + 1,
        representative_actors: actorName
          ? [{ name: actorName, avatarUrl: actorAvatarUrl }]
          : [],
        c_module: config.cModule,
        target_type: params.targetType,
        target_id: params.targetId,
        target_title: params.targetTitle,
        primary_action: primaryAction,
        child_notification_ids: existing.map((n: { id: string }) => n.id),
        status: 'delivered',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'recipient_id,batch_type,target_id' });

    return true;
  },

  // ============================================
  // DELIVERY
  // ============================================

  async deliver(notification: NotificationRecord): Promise<void> {
    const deliveredVia: string[] = [];

    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case 'in_app':
            await this.deliverInApp(notification);
            deliveredVia.push('in_app');
            break;
          case 'push':
            await this.deliverPush(notification);
            deliveredVia.push('push');
            break;
          case 'email_immediate':
            await this.deliverEmail(notification);
            deliveredVia.push('email_immediate');
            break;
          case 'badge':
            await this.updateBadge(notification);
            deliveredVia.push('badge');
            break;
        }
      } catch (error) {
        logger.error('NotificationSystemService', `Delivery via ${channel} failed`, error);
      }
    }

    await db
      .from('notification_records')
      .update({
        status: 'delivered',
        delivered_via: deliveredVia,
        delivered_at: new Date().toISOString(),
      })
      .eq('id', notification.id);
  },

  async deliverInApp(notification: NotificationRecord): Promise<void> {
    // Supabase real-time broadcast
    const channel = db.channel(`notifications:${notification.recipientId}`);
    await channel.send({
      type: 'broadcast',
      event: 'new_notification',
      payload: notification,
    });
  },

  async deliverPush(notification: NotificationRecord): Promise<void> {
    const { data: tokens } = await db
      .from('push_tokens')
      .select('token, platform')
      .eq('user_id', notification.recipientId);

    if (!tokens || tokens.length === 0) return;

    // Send push via edge function
    await db.functions.invoke('send-push-notification', {
      body: {
        action: 'send',
        tokens: tokens.map((t: { token: string; platform: string }) => ({
          token: t.token,
          platform: t.platform,
        })),
        title: notification.headline,
        body: notification.body || '',
        data: {
          type: notification.type,
          targetType: notification.targetType,
          targetId: notification.targetId,
          notificationId: notification.id,
        },
      },
    });
  },

  async deliverEmail(notification: NotificationRecord): Promise<void> {
    await db.functions.invoke('send-notification-email', {
      body: {
        user_id: notification.recipientId,
        notification_type: notification.type,
        title: notification.headline,
        message: notification.body || '',
        action_url: notification.primaryAction?.route || undefined,
        actor_name: notification.actorName,
        actor_avatar_url: notification.actorAvatarUrl,
      },
    });
  },

  async updateBadge(notification: NotificationRecord): Promise<void> {
    await db.rpc('increment_badge_count', {
      p_user_id: notification.recipientId,
      p_c_module: notification.cModule,
    });
  },

  // ============================================
  // FETCH & FILTER
  // ============================================

  async getNotifications(
    userId: string,
    filter: NotificationFilter,
    cursor: string | null,
    limit: number = 30
  ): Promise<{ notifications: NotificationDisplayItem[]; hasMore: boolean }> {
    let query = db
      .from('notification_records')
      .select('*')
      .eq('recipient_id', userId)
      .in('status', ['delivered', 'seen', 'opened', 'acted_on'])
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (filter.category !== 'all') {
      query = query.eq('category', filter.category);
    }
    if (filter.cModule !== 'all') {
      query = query.eq('c_module', filter.cModule);
    }
    if (filter.readStatus === 'unread') {
      query = query.is('seen_at', null);
    } else if (filter.readStatus === 'read') {
      query = query.not('seen_at', 'is', null);
    }
    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const hasMore = (data?.length || 0) > limit;
    const items = (data || []).slice(0, limit).map((row: Record<string, unknown>) => mapRecordFromDb(row));

    return { notifications: items, hasMore };
  },

  // ============================================
  // STATUS MUTATIONS
  // ============================================

  async markAsSeen(userId: string, notificationIds: string[]): Promise<void> {
    await db
      .from('notification_records')
      .update({ status: 'seen', seen_at: new Date().toISOString() })
      .in('id', notificationIds)
      .eq('recipient_id', userId)
      .eq('status', 'delivered');
  },

  async markAsOpened(userId: string, notificationId: string): Promise<void> {
    const { data: notification } = await db
      .from('notification_records')
      .select('c_module')
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .single();

    await db
      .from('notification_records')
      .update({ status: 'opened', opened_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    // Decrement badge count
    if (notification) {
      await db.rpc('decrement_badge_count', {
        p_user_id: userId,
        p_c_module: notification.c_module,
      });
    }
  },

  async markAsActedOn(userId: string, notificationId: string): Promise<void> {
    await db
      .from('notification_records')
      .update({ status: 'acted_on', acted_on_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('recipient_id', userId);
  },

  async dismiss(userId: string, notificationId: string): Promise<void> {
    const { data: notification } = await db
      .from('notification_records')
      .select('c_module, status')
      .eq('id', notificationId)
      .eq('recipient_id', userId)
      .single();

    await db
      .from('notification_records')
      .update({ status: 'dismissed', dismissed_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('recipient_id', userId);

    if (notification && notification.status === 'delivered') {
      await db.rpc('decrement_badge_count', {
        p_user_id: userId,
        p_c_module: notification.c_module,
      });
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    await db
      .from('notification_records')
      .update({ status: 'seen', seen_at: new Date().toISOString() })
      .eq('recipient_id', userId)
      .eq('status', 'delivered');

    await db.rpc('reset_badge_counts', { p_user_id: userId });
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count } = await db
      .from('notification_records')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('status', 'delivered');

    return count || 0;
  },

  async getUnreadByModule(userId: string): Promise<Record<string, number>> {
    const { data } = await db
      .from('badge_counts')
      .select('c_module, count')
      .eq('user_id', userId);

    const result: Record<string, number> = {};
    for (const row of data || []) {
      result[row.c_module] = row.count;
    }
    return result;
  },

  // ============================================
  // PREFERENCES
  // ============================================

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await db
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return {
        ...DEFAULT_NOTIFICATION_PREFERENCES,
        userId,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      userId: data.user_id,
      globalEnabled: data.global_enabled ?? true,
      quietHoursEnabled: data.quiet_hours_enabled ?? true,
      quietHoursStart: data.quiet_hours_start ?? 22,
      quietHoursEnd: data.quiet_hours_end ?? 8,
      timezone: data.timezone ?? 'Africa/Lagos',
      pushEnabled: data.push_enabled ?? true,
      emailEnabled: data.email_enabled ?? true,
      emailDigestEnabled: data.email_digest_enabled ?? true,
      emailDigestDay: data.email_digest_day ?? 1,
      emailDigestHour: data.email_digest_hour ?? 9,
      categoryPreferences: data.category_preferences || DEFAULT_NOTIFICATION_PREFERENCES.categoryPreferences,
      typeOverrides: data.type_overrides || {},
      diaInsightFrequency: data.dia_insight_frequency ?? 'normal',
      mutedUserIds: data.muted_user_ids || [],
      mutedSpaceIds: data.muted_space_ids || [],
      mutedEventIds: data.muted_event_ids || [],
      updatedAt: data.updated_at,
    };
  },

  async updatePreferences(
    _userId: string,
    _updates: Partial<NotificationPreferences>
  ): Promise<void> {
    // v0.0: the notification_preferences table is not provisioned (the real
    // persistence model is owned by BD059/D064). Short-circuit the write path so
    // we never upsert into an absent table or present a pretend-save to the user.
    // getPreferences() intentionally still resolves to DEFAULT_NOTIFICATION_PREFERENCES
    // so the bell + notification center keep working on defaults.
    return;
  },

  // ============================================
  // REAL-TIME SUBSCRIPTION
  // ============================================

  subscribeToNotifications(
    userId: string,
    callbacks: {
      onNew: (notification: NotificationRecord) => void;
      onBadgeUpdate: (counts: Record<string, number>) => void;
    }
  ) {
    return db
      .channel(`notif_system:${userId}`)
      .on('broadcast', { event: 'new_notification' }, (payload: { payload: unknown }) => {
        callbacks.onNew(payload.payload as NotificationRecord);
      })
      .on('broadcast', { event: 'badge_update' }, (payload: { payload: unknown }) => {
        callbacks.onBadgeUpdate(payload.payload as Record<string, number>);
      })
      .subscribe();
  },

  // ============================================
  // HELPERS
  // ============================================

  getUserLocalHour(timezone: string): number {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone,
      });
      return parseInt(formatter.format(now), 10);
    } catch {
      return new Date().getHours();
    }
  },

  getNextQuietHoursEnd(prefs: NotificationPreferences): string {
    const now = new Date();
    const target = new Date(now);
    target.setHours(prefs.quietHoursEnd, 0, 0, 0);
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    return target.toISOString();
  },
};
