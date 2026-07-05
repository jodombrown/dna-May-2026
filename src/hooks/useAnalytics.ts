import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export type ConnectEventName =
  | 'connect_profile_completed_40_plus'
  | 'connect_request_sent'
  | 'connect_request_accepted'
  | 'connect_message_sent'
  | 'connect_conversation_started'
  | 'connect_nudge_shown'
  | 'connect_nudge_clicked'
  | 'connect_cross_movement_event_rsvp'
  | 'connect_cross_movement_space_join'
  | 'connect_cross_movement_opportunity_apply'
  | 'connect_discovery_filter_applied'
  | 'connect_profile_viewed'
  | 'connect_user_blocked'
  | 'connect_content_reported'
  | 'event_to_space_created'
  | 'group_to_space_created'
  | 'space_joined_from_event_view'
  | 'space_joined_from_group_view'
  | 'space_joined_from_suggestions'
  | 'convey_item_created'
  | 'convey_item_published'
  | 'convey_item_viewed'
  | 'convey_item_cta_clicked'
  | 'convey_feed_filtered'
  | 'partner_page_cta_clicked'
  | 'partner_sector_cta_clicked'
  | 'partner_models_cta_clicked'
  | 'partner_form_submitted'
  | 'morning_brief_banner_tap'
  | 'morning_brief_banner_dismiss'
  | 'morning_brief_deep_link_open'
  | 'inbox_digest_opened'
  | 'inbox_digest_closed';

/** Typed metadata for analytics events */
export type AnalyticsMetadata = Record<string, string | number | boolean | null | undefined>;

export function useAnalytics() {
  const trackEvent = async (
    eventName: ConnectEventName,
    metadata?: AnalyticsMetadata,
    route?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_name: eventName,
        event_metadata: metadata || null,
        route: route || window.location.pathname,
      });
    } catch (err) {
      logger.warn('Analytics', 'Failed to track event', { eventName, error: err });
    }
  };
  return { trackEvent };
}
