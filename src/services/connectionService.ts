import { supabase } from '@/integrations/supabase/client';
import { ConnectionStatus, Connection, ConnectionRequest, ConnectionProfile, ConnectionRecommendation } from '@/types/connections';
import { BlockedUser } from '@/types/blocked';
import { sendNotificationEmail, NOTIFICATION_TYPES } from './notificationService';
import { getAppUrl, getProfileUrl, APP_PATHS } from '@/lib/config';
import { logger } from '@/lib/logger';
import { platformNotifications } from './platformNotificationGenerator';
import { diaEventBus } from '@/services/dia/diaEventBus';

/**
 * Response from get_connection_requests RPC
 */
interface ConnectionRequestRpcResponse {
  connection_id: string;
  requester_id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  headline: string | null;
  location: string | null;
  professional_role: string | null;
  heritage_status?: string | null;
  message: string | null;
  created_at: string;
}

/**
 * Response from rpc_dia_recommend_people RPC
 */
interface DiaRecommendationResponse {
  matched_user_id: string;
  match_score: number;
  match_reason: string | null;
  shared_regions: string[] | null;
  shared_sectors: string[] | null;
}

export const connectionService = {
  async sendConnectionRequest(receiverId: string, message?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check for existing connection
    const { data: existing } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(requester_id.eq.${user.id},recipient_id.eq.${receiverId}),and(requester_id.eq.${receiverId},recipient_id.eq.${user.id})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === 'pending') {
        throw new Error('Connection request already pending');
      } else if (existing.status === 'accepted') {
        throw new Error('Already connected');
      } else if (existing.status === 'declined') {
        throw new Error('Previous connection request was declined');
      }
    }

    const { data, error } = await supabase
      .from('connections')
      .insert({
        requester_id: user.id,
        recipient_id: receiverId,
        status: 'pending',
        message: message?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Connection request already exists');
      } else if (error.code === '42501') {
        throw new Error('Permission denied. Please ensure you are logged in.');
      } else if (error.code === '23503') {
        throw new Error('User not found');
      }
      throw new Error(error.message || 'Failed to send connection request');
    }

    // Get requester's profile for email notification
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .single();

    // Send email notification to recipient (async, don't block)
    sendNotificationEmail({
      user_id: receiverId,
      notification_type: NOTIFICATION_TYPES.CONNECTION_REQUEST,
      title: 'New Connection Request',
      message: message || `${requesterProfile?.full_name || 'Someone'} wants to connect with you on DNA.`,
      action_url: getAppUrl(APP_PATHS.connect.network),
      actor_name: requesterProfile?.full_name,
      actor_avatar_url: requesterProfile?.avatar_url,
    }).catch((err) => { logger.warn('ConnectionService', 'Failed to send connection request notification email', err); });

    // Sprint 4C: In-app notification for connection request
    platformNotifications.connectionRequestReceived(receiverId, user.id)
      .catch(() => { /* non-critical */ });

    // DIA Sprint 4B: Emit connection request event for proactive nudges
    diaEventBus.emit({
      type: 'connection_request_received',
      userId: receiverId,
      fromUserId: user.id,
    });

    return data;
  },

  async acceptConnectionRequest(connectionId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', connectionId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;

    // Send email notification to the requester that their request was accepted
    if (data && user) {
      const { data: accepterProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      sendNotificationEmail({
        user_id: data.requester_id,
        notification_type: NOTIFICATION_TYPES.CONNECTION_ACCEPTED,
        title: 'Connection Request Accepted',
        message: `${accepterProfile?.full_name || 'Someone'} accepted your connection request. You are now connected!`,
        action_url: getProfileUrl(accepterProfile?.full_name || user.id),
        actor_name: accepterProfile?.full_name,
        actor_avatar_url: accepterProfile?.avatar_url,
      }).catch((err) => { logger.warn('ConnectionService', 'Failed to send connection accepted notification email', err); });

      // Sprint 4C: In-app notification for connection accepted
      platformNotifications.connectionRequestAccepted(data.requester_id, user.id)
        .catch(() => { /* non-critical */ });

      // Emit CONNECTION_ACCEPTED event for DIA post-connection nudges
      diaEventBus.emit({
        type: 'connection_accepted',
        userId: user.id,
        connectionId: connectionId,
        connectedUserId: data.requester_id,
        connectedUserName: accepterProfile?.full_name || 'Someone',
        timestamp: new Date().toISOString(),
      });
    }

    return data;
  },

  async rejectConnectionRequest(connectionId: string) {
    const { data, error } = await supabase
      .from('connections')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', connectionId)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPendingRequests(): Promise<ConnectionRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_connection_requests', {
      user_id: user.id,
    });

    if (error) throw error;

    // Map the RPC response to match ConnectionRequest interface
    const requests = (data || []) as ConnectionRequestRpcResponse[];
    return requests.map((item) => ({
      connection_id: item.connection_id,
      id: item.requester_id,
      requester_id: item.requester_id,
      username: item.username,
      full_name: item.full_name,
      avatar_url: item.avatar_url,
      headline: item.headline,
      location: item.location,
      professional_role: item.heritage_status || item.professional_role,
      message: item.message,
      created_at: item.created_at,
    })) as ConnectionRequest[];
  },

  async getSentRequests(): Promise<Array<{
    connection_id: string;
    recipient_id: string;
    recipient_name: string;
    recipient_avatar?: string | null;
    recipient_headline?: string | null;
    created_at: string;
  }>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Get pending connection requests sent by the user
    const { data: connections, error: connectionsError } = await supabase
      .from('connections')
      .select('id, recipient_id, created_at')
      .eq('requester_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (connectionsError) {
      return [];
    }
    
    if (!connections || connections.length === 0) {
      return [];
    }
    
    // Get the recipient IDs
    const recipientIds = connections.map(c => c.recipient_id);
    
    // Fetch the recipient profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, headline')
      .in('id', recipientIds);
    
    // Ignore profile fetch errors - we'll use fallback values
    
    // Create a map for quick lookup
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    
    // Map to expected format
    return connections.map((c) => {
      const profile = profileMap.get(c.recipient_id);
      return {
        connection_id: c.id,
        recipient_id: c.recipient_id,
        recipient_name: profile?.full_name || 'Unknown',
        recipient_avatar: profile?.avatar_url,
        recipient_headline: profile?.headline,
        created_at: c.created_at,
      };
    });
  },

  async getConnections(searchQuery?: string): Promise<ConnectionProfile[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_user_connections', {
      user_id: user.id,
      search_query: searchQuery || null,
      limit_count: 50,
      offset_count: 0,
    });

    if (error) throw error;
    return (data || []) as ConnectionProfile[];
  },

  async getConnectionStatus(userId: string): Promise<ConnectionStatus> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'none';

    const { data, error } = await supabase.rpc('get_connection_status', {
      user1_id: user.id,
      user2_id: userId,
    });

    if (error) {
      return 'none';
    }

    return (data as ConnectionStatus) || 'none';
  },

  /**
   * Remove/disconnect from a user
   * Requires connection ID to ensure user is part of the connection
   */
  async removeConnection(connectionId: string): Promise<void> {
    const { error } = await supabase.rpc('remove_connection', {
      p_connection_id: connectionId,
    });

    if (error) throw error;
  },

  /**
   * Block a user
   * Automatically removes any existing connections
   */
  async blockUser(userId: string, reason?: string): Promise<void> {
    const { error } = await supabase.rpc('block_user', {
      p_blocked_user_id: userId,
      p_reason: reason || null,
    });

    if (error) throw error;
  },

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    const { error } = await supabase.rpc('unblock_user', {
      p_blocked_user_id: userId,
    });

    if (error) throw error;
  },

  /**
   * Get list of blocked users
   */
  async getBlockedUsers(): Promise<BlockedUser[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase.rpc('get_blocked_users', {
      p_user_id: user.id,
    });

    if (error) throw error;
    return (data || []) as BlockedUser[];
  },

  /**
   * Check if a user is blocked (either direction)
   */
  async isUserBlocked(userId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase.rpc('is_user_blocked', {
      p_user_id: user.id,
      p_other_user_id: userId,
    });

    if (error) {
      return false;
    }

    return data || false;
  },

  /**
   * Dismiss a connection recommendation
   * User won't see this person in recommendations again
   */
  async dismissRecommendation(_dismissedUserId: string): Promise<void> {
    // TODO: Implement when dismissed_recommendations table is created
    // For now, no-op - feature will be fully implemented in Phase 2
  },

  /**
   * Undismiss a previously dismissed recommendation
   */
  async undismissRecommendation(_dismissedUserId: string): Promise<void> {
    // TODO: Implement when dismissed_recommendations table is created
  },

  /**
   * Get smart connection recommendations based on DIA algorithm
   * Uses weighted scoring: skills (25%), interests (25%), heritage (20%), mutual connections (20%), region (10%)
   */
  async getConnectionRecommendations(limit: number = 10): Promise<ConnectionRecommendation[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Use rpc_dia_recommend_people which uses auth.uid() internally
    const { data, error } = await supabase.rpc('rpc_dia_recommend_people');

    if (error) {
      return [];
    }

    if (!data || !Array.isArray(data)) return [];

    // Cast to proper type
    const recommendations = data as unknown as DiaRecommendationResponse[];

    // Fetch profile details for the matched users
    const userIds = recommendations.map((item) => item.matched_user_id).filter(Boolean);
    if (userIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, headline, location, profession')
      .in('id', userIds)
      .limit(limit);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return recommendations.slice(0, limit).map((item): ConnectionRecommendation | null => {
      const profile = profileMap.get(item.matched_user_id);
      if (!item.matched_user_id) return null;
      return {
        user_id: item.matched_user_id,
        username: profile?.username || '',
        full_name: profile?.full_name || 'Unknown',
        avatar_url: profile?.avatar_url,
        headline: profile?.headline,
        location: profile?.location,
        profession: profile?.profession,
        match_score: Number(item.match_score) || 0,
        shared_skills_count: 0,
        shared_interests_count: 0,
        mutual_connections_count: 0,
        same_heritage: (item.shared_regions?.length || 0) > 0,
        same_region: (item.shared_sectors?.length || 0) > 0,
        match_reasons: item.match_reason ? [item.match_reason] : [],
      };
    }).filter((rec): rec is ConnectionRecommendation => rec !== null);
  },
};
