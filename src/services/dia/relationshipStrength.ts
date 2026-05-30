/**
 * DIA | Relationship Strength Service
 *
 * Computes and maintains the relationship strength between connected users.
 * Every existing connection gets a continuously updated strength score (0-1)
 * based on interaction, structural, and reciprocity signals.
 *
 * Signal categories:
 * - Interaction signals (60%): messaging, content engagement, co-attendance, collaboration
 * - Structural signals (25%): mutual connections, shared interests/skills, regional proximity
 * - Reciprocity signals (15%): bidirectional engagement, response rate
 */

import { supabase } from '@/integrations/supabase/client';
import { getPrimaryOriginCodes } from '@/lib/memberHeritage';
import type {
  RelationshipSignals,
  RawRelationshipData,
  SharedSpaceData,
  CommunicationFrequency,
} from '@/types/diaEngine';


/** Weights for each relationship signal — sums to 1.0 */
const SIGNAL_WEIGHTS: Record<keyof RelationshipSignals, number> = {
  // Interaction signals (60% total — behavior > structure)
  messagingFrequency: 0.12,
  messagingRecency: 0.10,
  contentEngagement: 0.12,
  eventCoAttendance: 0.08,
  spaceCollaboration: 0.10,
  profileViewFrequency: 0.04,
  mentionFrequency: 0.04,

  // Structural signals (25% total)
  mutualConnectionDensity: 0.06,
  sharedInterestOverlap: 0.05,
  sharedSkillOverlap: 0.04,
  regionalProximity: 0.05,
  diasporaHeritageMatch: 0.05,

  // Reciprocity signals (15% total — mutual > one-sided)
  bidirectionalEngagement: 0.10,
  responseRate: 0.05,
};

/** Region adjacency map for proximity scoring */
const REGION_ADJACENCY: Record<string, string[]> = {
  'West Africa': ['Central Africa', 'North Africa'],
  'East Africa': ['Central Africa', 'Southern Africa'],
  'Central Africa': ['West Africa', 'East Africa', 'Southern Africa'],
  'North Africa': ['West Africa'],
  'Southern Africa': ['East Africa', 'Central Africa'],
};

/**
 * Compute the composite relationship strength from individual signals.
 */
function computeStrength(signals: RelationshipSignals): number {
  let score = 0;
  for (const [key, weight] of Object.entries(SIGNAL_WEIGHTS)) {
    score += (signals[key as keyof RelationshipSignals] || 0) * weight;
  }
  return Math.min(Math.max(score, 0), 1);
}

/**
 * Compute individual signal values from raw interaction data.
 */
function computeSignals(data: RawRelationshipData): RelationshipSignals {
  return {
    // Messaging: frequency normalized over 90-day window
    messagingFrequency: normalizeFrequency(data.messageCount90Days, 0, 100),
    messagingRecency: computeRecency(data.lastMessageDate, 90),

    // Content: mutual engagement normalized
    contentEngagement: normalizeFrequency(
      data.mutualLikes + data.mutualComments * 2 + data.mutualReshares * 3,
      0,
      50,
    ),

    // Events: co-attendance as ratio of total events
    eventCoAttendance: Math.min(
      data.sharedEventCount / Math.max(data.totalEventsAttended, 1),
      1,
    ),

    // Spaces: collaboration intensity
    spaceCollaboration: computeCollaborationScore(data.sharedSpaces),

    // Profile views
    profileViewFrequency: normalizeFrequency(data.profileViewCount90Days, 0, 20),

    // Mentions
    mentionFrequency: normalizeFrequency(data.mentionCount90Days, 0, 15),

    // Structural
    mutualConnectionDensity:
      data.mutualConnectionCount /
      Math.max(Math.min(data.userConnectionCount, data.connectedUserConnectionCount), 1),
    sharedInterestOverlap: jaccardSimilarity(data.userInterests, data.connectedUserInterests),
    sharedSkillOverlap: jaccardSimilarity(data.userSkills, data.connectedUserSkills),
    regionalProximity: computeRegionalProximity(data.userRegion, data.connectedUserRegion),
    diasporaHeritageMatch: data.userHeritage === data.connectedUserHeritage && data.userHeritage != null ? 1.0 : 0.0,

    // Reciprocity
    bidirectionalEngagement: computeBidirectional(
      data.userToConnectedActions,
      data.connectedToUserActions,
    ),
    responseRate: data.messagesSent > 0
      ? Math.min(data.responseCount / data.messagesSent, 1)
      : 0,
  };
}

/**
 * Fetch raw relationship data between two users from the database.
 */
async function fetchRawRelationshipData(
  userId: string,
  connectedUserId: string,
): Promise<RawRelationshipData> {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch data in parallel for performance
  const [
    messageData,
    engagementData,
    sharedEventData,
    sharedSpaceData,
    profileA,
    profileB,
    connectionCounts,
    mutualConnectionData,
    originCodes,
  ] = await Promise.all([

    // Message counts (90-day window)
    fetchMessageData(userId, connectedUserId, ninetyDaysAgo),
    // Content engagement
    fetchEngagementData(userId, connectedUserId),
    // Shared events
    fetchSharedEventData(userId, connectedUserId),
    // Shared spaces
    fetchSharedSpaceData(userId, connectedUserId),
    // Profiles
    // Profiles
    supabase.from('profiles').select('skills, interests, location').eq('id', userId).single() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>,
    supabase.from('profiles').select('skills, interests, location').eq('id', connectedUserId).single() as unknown as Promise<{ data: Record<string, unknown> | null; error: unknown }>,
    // Connection counts
    fetchConnectionCounts(userId, connectedUserId),
    // Mutual connections
    fetchMutualConnectionCount(userId, connectedUserId),
    // BD038/BD039: primary origin (alpha-3) sourced from member_heritage, code-vs-code.
    getPrimaryOriginCodes([userId, connectedUserId]),
  ]);

  const userProfile = (profileA.data || {}) as Record<string, unknown>;
  const connectedProfile = (profileB.data || {}) as Record<string, unknown>;

  return {
    messageCount90Days: messageData.count,
    lastMessageDate: messageData.lastDate,
    mutualLikes: engagementData.likes,
    mutualComments: engagementData.comments,
    mutualReshares: engagementData.reshares,
    sharedEventCount: sharedEventData.count,
    totalEventsAttended: sharedEventData.totalAttended,
    sharedSpaces: sharedSpaceData,
    profileViewCount90Days: 0, // Requires analytics tracking
    mentionCount90Days: 0, // Requires mention tracking
    mutualConnectionCount: mutualConnectionData,
    userConnectionCount: connectionCounts.userCount,
    connectedUserConnectionCount: connectionCounts.connectedCount,
    userInterests: (userProfile.interests || []) as string[],
    connectedUserInterests: (connectedProfile.interests || []) as string[],
    userSkills: (userProfile.skills || []) as string[],
    connectedUserSkills: (connectedProfile.skills || []) as string[],
    userRegion: extractRegion((userProfile.location || '') as string),
    connectedUserRegion: extractRegion((connectedProfile.location || '') as string),
    userHeritage: originCodes.get(userId) ?? null,
    connectedUserHeritage: originCodes.get(connectedUserId) ?? null,

    userToConnectedActions: engagementData.userToConnected,
    connectedToUserActions: engagementData.connectedToUser,
    responseCount: messageData.responseCount,
    messagesSent: messageData.sentCount,
  };
}

/**
 * Compute and persist relationship strength for a connection pair.
 */
async function computeAndStoreStrength(
  userId: string,
  connectedUserId: string,
): Promise<{ strength: number; signals: RelationshipSignals }> {
  const rawData = await fetchRawRelationshipData(userId, connectedUserId);
  const signals = computeSignals(rawData);
  const strength = computeStrength(signals);
  const frequency = classifyCommunicationFrequency(rawData.messageCount90Days);

  // Upsert into network_edges
  await (supabase as any).from('network_edges').upsert(
    {
      user_id: userId,
      connected_user_id: connectedUserId,
      connection_status: 'connected',
      relationship_strength: strength,
      strength_signals: signals,
      last_interaction_date: rawData.lastMessageDate?.toISOString() || null,
      mutual_connection_count: rawData.mutualConnectionCount,
      shared_space_count: rawData.sharedSpaces.length,
      shared_event_count: rawData.sharedEventCount,
      communication_frequency: frequency,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,connected_user_id' },
  );

  return { strength, signals };
}

/**
 * Batch recompute relationship strengths for all connections of a user.
 */
async function recomputeUserStrengths(userId: string): Promise<void> {
  const { data: connections } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .limit(500);

  if (!connections) return;

  const connectedIds = connections.map((c: { requester_id: string; recipient_id: string }) =>
    c.requester_id === userId ? c.recipient_id : c.requester_id,
  );

  // Process in batches of 10 for performance
  for (let i = 0; i < connectedIds.length; i += 10) {
    const batch = connectedIds.slice(i, i + 10);
    await Promise.all(
      batch.map(connectedId => computeAndStoreStrength(userId, connectedId)),
    );
  }
}

/**
 * Get the top N strongest connections for a user.
 */
async function getStrongestConnections(
  userId: string,
  limit = 20,
): Promise<Array<{ connectedUserId: string; strength: number }>> {
  const { data } = await (supabase as any)
    .from('network_edges')
    .select('connected_user_id, relationship_strength')
    .eq('user_id', userId)
    .eq('connection_status', 'connected')
    .order('relationship_strength', { ascending: false })
    .limit(limit);

  return (data || []).map((d: { connected_user_id: string; relationship_strength: number }) => ({
    connectedUserId: d.connected_user_id,
    strength: d.relationship_strength,
  }));
}

// ── Internal helpers ────────────────────────────────────────

function normalizeFrequency(count: number, min: number, max: number): number {
  return Math.min(Math.max((count - min) / (max - min), 0), 1);
}

function computeRecency(lastDate: Date | null, windowDays: number): number {
  if (!lastDate) return 0;
  const daysSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1 - daysSince / windowDays, 0);
}

function jaccardSimilarity(setA: string[], setB: string[]): number {
  const lowerA = setA.map(s => s.toLowerCase());
  const lowerB = setB.map(s => s.toLowerCase());
  const intersection = lowerA.filter(x => lowerB.includes(x)).length;
  const union = new Set([...lowerA, ...lowerB]).size;
  return union === 0 ? 0 : intersection / union;
}

function computeRegionalProximity(regionA: string | null, regionB: string | null): number {
  if (!regionA || !regionB) return 0.3;
  if (regionA === regionB) return 1.0;
  if (REGION_ADJACENCY[regionA]?.includes(regionB)) return 0.5;
  return 0.2;
}

function computeBidirectional(userActions: number, connectedActions: number): number {
  const total = userActions + connectedActions;
  if (total === 0) return 0;
  return Math.min(userActions, connectedActions) / Math.max(userActions, connectedActions);
}

function computeCollaborationScore(sharedSpaces: SharedSpaceData[]): number {
  if (sharedSpaces.length === 0) return 0;
  const scores = sharedSpaces.map(space => {
    const taskInteraction = space.sharedTaskCount / Math.max(space.totalTasks, 1);
    const commentInteraction = space.mutualCommentCount / Math.max(space.totalComments, 1);
    return (taskInteraction + commentInteraction) / 2;
  });
  return Math.min(
    scores.reduce((a, b) => a + b, 0) / scores.length + scores.length * 0.1,
    1,
  );
}

function classifyCommunicationFrequency(messageCount90Days: number): CommunicationFrequency {
  if (messageCount90Days >= 60) return 'daily';
  if (messageCount90Days >= 12) return 'weekly';
  if (messageCount90Days >= 3) return 'monthly';
  if (messageCount90Days >= 1) return 'quarterly';
  return 'inactive';
}

function extractRegion(location: string): string | null {
  if (!location) return null;
  const lower = location.toLowerCase();
  const regionMap: Record<string, string> = {
    'nigeria': 'West Africa', 'ghana': 'West Africa', 'senegal': 'West Africa', 'côte d\'ivoire': 'West Africa',
    'kenya': 'East Africa', 'tanzania': 'East Africa', 'uganda': 'East Africa', 'ethiopia': 'East Africa', 'rwanda': 'East Africa',
    'south africa': 'Southern Africa', 'zimbabwe': 'Southern Africa', 'botswana': 'Southern Africa',
    'cameroon': 'Central Africa', 'drc': 'Central Africa', 'congo': 'Central Africa',
    'egypt': 'North Africa', 'morocco': 'North Africa', 'tunisia': 'North Africa',
    'west africa': 'West Africa', 'east africa': 'East Africa', 'southern africa': 'Southern Africa',
    'central africa': 'Central Africa', 'north africa': 'North Africa',
  };
  for (const [key, region] of Object.entries(regionMap)) {
    if (lower.includes(key)) return region;
  }
  return null;
}

async function fetchMessageData(userId: string, connectedUserId: string, since: string) {
  // Count messages between the pair
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(user_a.eq.${userId},user_b.eq.${connectedUserId}),and(user_a.eq.${connectedUserId},user_b.eq.${userId})`)
    .limit(1);

  if (!conversations || conversations.length === 0) {
    return { count: 0, lastDate: null, responseCount: 0, sentCount: 0 };
  }

  const convId = conversations[0].id;

  const { data: messages } = await supabase
    .from('messages')
    .select('sender_id, created_at')
    .eq('conversation_id', convId)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  const msgs = messages || [];
  const lastDate = msgs.length > 0 ? new Date(msgs[0].created_at) : null;
  const sentByUser = msgs.filter(m => m.sender_id === userId).length;

  // Count responses (sender changes)
  let responseCount = 0;
  for (let i = 1; i < msgs.length; i++) {
    if (msgs[i].sender_id !== msgs[i - 1].sender_id && msgs[i].sender_id === connectedUserId) {
      responseCount++;
    }
  }

  return { count: msgs.length, lastDate, responseCount, sentCount: sentByUser };
}

async function fetchEngagementData(userId: string, connectedUserId: string) {
  // Mutual likes: count where both users liked same posts
  const { data: userLikes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', userId)
    .limit(200);

  const { data: connectedLikes } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('user_id', connectedUserId)
    .limit(200);

  const userLikeSet = new Set((userLikes || []).map(l => l.post_id));
  const mutualLikes = (connectedLikes || []).filter(l => userLikeSet.has(l.post_id)).length;

  // Engagement on each other's posts
  const { count: userToConnected } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const { count: connectedToUser } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', connectedUserId);

  return {
    likes: mutualLikes,
    comments: 0,
    reshares: 0,
    userToConnected: userToConnected || 0,
    connectedToUser: connectedToUser || 0,
  };
}

async function fetchSharedEventData(userId: string, connectedUserId: string) {
  const { data: eventsA } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId);

  const { data: eventsB } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', connectedUserId);

  const setA = new Set((eventsA || []).map(e => e.event_id));
  const shared = (eventsB || []).filter(e => setA.has(e.event_id));

  return {
    count: shared.length,
    totalAttended: (eventsA || []).length + (eventsB || []).length,
  };
}

async function fetchSharedSpaceData(userId: string, connectedUserId: string): Promise<SharedSpaceData[]> {
  const { data: spacesA } = await supabase
    .from('collaboration_memberships')
    .select('space_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  const { data: spacesB } = await supabase
    .from('collaboration_memberships')
    .select('space_id')
    .eq('user_id', connectedUserId)
    .eq('status', 'active');

  const setA = new Set((spacesA || []).map(s => s.space_id));
  const sharedSpaceIds = (spacesB || []).filter(s => setA.has(s.space_id)).map(s => s.space_id);

  return sharedSpaceIds.map(spaceId => ({
    spaceId,
    sharedTaskCount: 0,
    totalTasks: 0,
    mutualCommentCount: 0,
    totalComments: 0,
  }));
}

async function fetchConnectionCounts(userId: string, connectedUserId: string) {
  const { count: userCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

  const { count: connectedCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`requester_id.eq.${connectedUserId},recipient_id.eq.${connectedUserId}`);

  return { userCount: userCount || 0, connectedCount: connectedCount || 0 };
}

async function fetchMutualConnectionCount(userId: string, connectedUserId: string): Promise<number> {
  const { data: connectionsA } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .limit(500);

  const { data: connectionsB } = await supabase
    .from('connections')
    .select('requester_id, recipient_id')
    .or(`requester_id.eq.${connectedUserId},recipient_id.eq.${connectedUserId}`)
    .limit(500);

  const idsA = new Set(
    (connectionsA || []).flatMap((c: { requester_id: string; recipient_id: string }) => [c.requester_id, c.recipient_id]).filter((id: string) => id !== userId),
  );
  const idsB = new Set(
    (connectionsB || []).flatMap((c: { requester_id: string; recipient_id: string }) => [c.requester_id, c.recipient_id]).filter((id: string) => id !== connectedUserId),
  );

  let mutual = 0;
  for (const id of idsA) {
    if (idsB.has(id)) mutual++;
  }
  return mutual;
}

export const relationshipStrengthService = {
  computeStrength,
  computeSignals,
  computeAndStoreStrength,
  recomputeUserStrengths,
  getStrongestConnections,
  fetchRawRelationshipData,
  SIGNAL_WEIGHTS,
};
