/**
 * DNA | DIA Core Engine — Extended Type System
 *
 * Comprehensive types for the DIA intelligence layer:
 * - Network Graph (edges, relationship signals)
 * - People Matching (People ↔ People)
 * - Opportunity Matching (Opportunities ↔ Profiles)
 * - Space Matching (Spaces ↔ Skills)
 * - Event Matching (Events ↔ Interests)
 * - Nudge Engine (triggers, suppression, delivery)
 * - DIA Chat Interface (intent, entities, handlers)
 *
 * Builds on the foundational types in @/types/dia.ts
 */

import type { CModule } from './composer';

// ============================================================
// NETWORK GRAPH
// ============================================================

export interface NetworkEdge {
  userId: string;
  connectedUserId: string;
  connectionStatus: ConnectionStatus;
  relationshipStrength: number; // 0-1 composite score
  strengthSignals: RelationshipSignals;
  connectionDate: Date;
  lastInteractionDate: Date;
  mutualConnectionCount: number;
  sharedSpaceCount: number;
  sharedEventCount: number;
  communicationFrequency: CommunicationFrequency;
}

export enum ConnectionStatus {
  CONNECTED = 'connected',
  PENDING_SENT = 'pending_sent',
  PENDING_RECEIVED = 'pending_received',
  FOLLOWING = 'following',
  SUGGESTED = 'suggested',
  BLOCKED = 'blocked',
}

export interface RelationshipSignals {
  // Interaction signals (0-1 each)
  messagingFrequency: number;
  messagingRecency: number;
  contentEngagement: number;
  eventCoAttendance: number;
  spaceCollaboration: number;
  profileViewFrequency: number;
  mentionFrequency: number;

  // Structural signals (0-1 each)
  mutualConnectionDensity: number;
  sharedInterestOverlap: number;
  sharedSkillOverlap: number;
  regionalProximity: number;
  diasporaHeritageMatch: number;

  // Reciprocity signals (0-1 each)
  bidirectionalEngagement: number;
  responseRate: number;
}

export type CommunicationFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'inactive';

/** Raw data used to compute relationship signals */
export interface RawRelationshipData {
  messageCount90Days: number;
  lastMessageDate: Date | null;
  mutualLikes: number;
  mutualComments: number;
  mutualReshares: number;
  sharedEventCount: number;
  totalEventsAttended: number;
  sharedSpaces: SharedSpaceData[];
  profileViewCount90Days: number;
  mentionCount90Days: number;
  mutualConnectionCount: number;
  userConnectionCount: number;
  connectedUserConnectionCount: number;
  userInterests: string[];
  connectedUserInterests: string[];
  userSkills: string[];
  connectedUserSkills: string[];
  userRegion: string | null;
  connectedUserRegion: string | null;
  userHeritage: string | null;
  connectedUserHeritage: string | null;
  userToConnectedActions: number;
  connectedToUserActions: number;
  responseCount: number;
  messagesSent: number;
}

export interface SharedSpaceData {
  spaceId: string;
  sharedTaskCount: number;
  totalTasks: number;
  mutualCommentCount: number;
  totalComments: number;
}

// ============================================================
// PEOPLE MATCHING (People ↔ People)
// ============================================================

export interface PeopleMatchResult {
  userId: string;
  matchedUserId: string;
  matchScore: number; // 0-1 composite score
  matchType: PeopleMatchType;
  matchReasons: MatchReason[];
  signals: PeopleMatchSignals;
  surfacedVia: MatchSurface[];
  priority: MatchPriority;
  createdAt: Date;
  expiresAt: Date | null;
  status: MatchStatus;
}

export enum PeopleMatchType {
  SHOULD_CONNECT = 'should_connect',
  SIMILAR_PROFESSIONAL = 'similar_professional',
  REGIONAL_PEER = 'regional_peer',
  COLLABORATION_FIT = 'collaboration_fit',
  EVENT_NETWORK = 'event_network',
  MUTUAL_BRIDGE = 'mutual_bridge',
  HERITAGE_CONNECTION = 'heritage_connection',
}

export interface PeopleMatchSignals {
  // Network proximity
  mutualConnectionCount: number;
  mutualConnectionStrength: number;
  networkOverlap: number;
  degreeOfSeparation: number;

  // Professional alignment
  skillComplementarity: number;
  interestOverlap: number;
  industryAlignment: number;
  experienceLevelMatch: number;

  // Diaspora alignment
  heritageMatch: number;
  regionalProximity: number;
  diasporaEngagementSimilarity: number;

  // Behavioral alignment
  eventCoAttendancePotential: number;
  spaceInterestOverlap: number;
  contentTopicOverlap: number;
  onlineTimeOverlap: number;
}

export interface MatchReason {
  type: MatchReasonType;
  text: string;
  strength: number;
  icon: string;
}

export type MatchReasonType =
  | 'mutual_connections'
  | 'shared_skills'
  | 'shared_interests'
  | 'same_region'
  | 'same_heritage'
  | 'complementary_skills'
  | 'event_overlap'
  | 'space_overlap'
  | 'content_alignment'
  | 'collaboration_potential';

export enum MatchSurface {
  FEED_CARD = 'feed_card',
  CONNECT_SUGGESTIONS = 'connect_suggestions',
  PROFILE_RECOMMENDATIONS = 'profile_recommendations',
  NOTIFICATION = 'notification',
  DIA_CHAT = 'dia_chat',
  COMPOSER_MENTION = 'composer_mention',
  EVENT_NETWORKING = 'event_networking',
  SPACE_RECRUITMENT = 'space_recruitment',
}

export enum MatchPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum MatchStatus {
  ACTIVE = 'active',
  ACTED_ON = 'acted_on',
  DISMISSED = 'dismissed',
  EXPIRED = 'expired',
  CONNECTED = 'connected',
}

// ============================================================
// OPPORTUNITY MATCHING (Opportunities ↔ Profiles)
// ============================================================

export interface OpportunityMatchResult {
  opportunityId: string;
  userId: string;
  matchScore: number;
  matchType: OpportunityMatchType;
  matchReasons: MatchReason[];
  signals: OpportunityMatchSignals;
  surfacedVia: MatchSurface[];
  priority: MatchPriority;
  createdAt: Date;
  status: MatchStatus;
}

export enum OpportunityMatchType {
  SKILL_MATCH = 'skill_match',
  INTEREST_MATCH = 'interest_match',
  REGIONAL_MATCH = 'regional_match',
  NETWORK_MATCH = 'network_match',
  HISTORY_MATCH = 'history_match',
  COMPLEMENTARY = 'complementary',
}

export interface OpportunityMatchSignals {
  skillOverlap: number;
  categoryAlignment: number;
  locationFit: number;
  compensationFit: number;
  durationFit: number;
  networkProximity: number;
  engagementHistory: number;
  needOfferComplementarity: number;
}

// ============================================================
// SPACE MATCHING (Spaces ↔ Skills)
// ============================================================

export interface SpaceMatchResult {
  spaceId: string;
  userId: string;
  matchScore: number;
  matchType: SpaceMatchType;
  matchedRoles: string[];
  matchReasons: MatchReason[];
  signals: SpaceMatchSignals;
  surfacedVia: MatchSurface[];
  priority: MatchPriority;
  createdAt: Date;
  status: MatchStatus;
}

export enum SpaceMatchType {
  ROLE_FIT = 'role_fit',
  INTEREST_ALIGNMENT = 'interest_alignment',
  NETWORK_PRESENCE = 'network_presence',
  REGIONAL_FIT = 'regional_fit',
  COMPLEMENTARY_EXPERTISE = 'complementary_expertise',
}

export interface SpaceMatchSignals {
  roleSkillOverlap: number;
  topicInterestOverlap: number;
  connectionMemberCount: number;
  connectionMemberStrength: number;
  regionalAlignment: number;
  spaceTypePreference: number;
  availabilityFit: number;
}

// ============================================================
// EVENT MATCHING (Events ↔ Interests)
// ============================================================

export interface EventMatchResult {
  eventId: string;
  userId: string;
  matchScore: number;
  matchType: EventMatchType;
  matchReasons: MatchReason[];
  signals: EventMatchSignals;
  surfacedVia: MatchSurface[];
  priority: MatchPriority;
  createdAt: Date;
  status: MatchStatus;
}

export enum EventMatchType {
  TOPIC_MATCH = 'topic_match',
  NETWORK_ATTENDING = 'network_attending',
  REGIONAL_EVENT = 'regional_event',
  ORGANIZER_CONNECTION = 'organizer_connection',
  HISTORY_PATTERN = 'history_pattern',
  SPACE_EVENT = 'space_event',
}

export interface EventMatchSignals {
  topicInterestOverlap: number;
  connectionAttendeeCount: number;
  connectionAttendeeStrength: number;
  organizerRelationship: number;
  eventTypePreference: number;
  timezoneCompatibility: number;
  pastAttendancePattern: number;
  relatedSpaceMembership: number;
  regionalAlignment: number;
}

// ============================================================
// NUDGE ENGINE (Extended)
// ============================================================

export interface Nudge {
  id: string;
  userId: string;
  nudgeType: NudgeType;
  category: NudgeCategory;
  cModule: CModule;
  headline: string;
  body: string;
  action: NudgeAction;
  priority: NudgePriority;
  deliveryChannel: NudgeDeliveryChannel;
  timing: NudgeTiming;
  triggerEvent: string;
  matchId: string | null;
  status: NudgeStatus;
  deliveredAt: Date | null;
  actedOnAt: Date | null;
  dismissedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
}

export enum NudgeType {
  // CONNECT nudges
  CONNECTION_SUGGESTION = 'connection_suggestion',
  RECONNECT = 'reconnect',
  PROFILE_COMPLETION = 'profile_completion',
  NETWORK_MILESTONE = 'network_milestone',

  // CONVENE nudges
  EVENT_RECOMMENDATION = 'event_recommendation',
  EVENT_REMINDER = 'event_reminder',
  POST_EVENT_FOLLOWUP = 'post_event_followup',
  EVENT_CREATION_PROMPT = 'event_creation_prompt',

  // COLLABORATE nudges
  SPACE_RECOMMENDATION = 'space_recommendation',
  SPACE_STALL_ALERT = 'space_stall_alert',
  TASK_REMINDER = 'task_reminder',
  ROLE_MATCH_ALERT = 'role_match_alert',

  // CONTRIBUTE nudges
  OPPORTUNITY_MATCH = 'opportunity_match',
  OFFER_PROMPT = 'offer_prompt',
  DEADLINE_APPROACHING = 'deadline_approaching',
  MATCH_FOLLOWUP = 'match_followup',

  // CONVEY nudges
  STORY_PROMPT = 'story_prompt',
  ENGAGEMENT_MILESTONE = 'engagement_milestone',
  CONTENT_SERIES_REMINDER = 'content_series_reminder',
  TRENDING_TOPIC_PROMPT = 'trending_topic_prompt',

  // CROSS-C nudges
  FIVE_C_ACTIVATION = 'five_c_activation',
  WEEKLY_DIGEST = 'weekly_digest',
  IMPACT_SNAPSHOT = 'impact_snapshot',
}

export enum NudgeCategory {
  DISCOVERY = 'discovery',
  ENGAGEMENT = 'engagement',
  CREATION = 'creation',
  RETENTION = 'retention',
  GROWTH = 'growth',
  CELEBRATION = 'celebration',
}

export interface NudgeAction {
  type: 'navigate' | 'open_composer' | 'inline_action' | 'open_chat' | 'expand';
  label: string;
  payload: Record<string, unknown>;
}

export enum NudgePriority {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum NudgeDeliveryChannel {
  FEED_CARD = 'feed_card',
  NOTIFICATION_CENTER = 'notification_center',
  PUSH_NOTIFICATION = 'push_notification',
  EMAIL_DIGEST = 'email_digest',
  COMPOSER_SUGGESTION = 'composer_suggestion',
  DIA_CHAT = 'dia_chat',
  PROFILE_BANNER = 'profile_banner',
}

export interface NudgeTiming {
  optimalDeliveryWindow: TimeWindow;
  frequency: NudgeFrequency;
  cooldownMinutes: number;
  expiresAfterMinutes: number | null;
}

export interface TimeWindow {
  startHour: number; // 0-23, in user's timezone
  endHour: number;
  daysOfWeek: number[]; // 0=Sunday, 6=Saturday
}

export enum NudgeFrequency {
  ONCE = 'once',
  DAILY_MAX = 'daily_max',
  WEEKLY_MAX = 'weekly_max',
  ON_TRIGGER = 'on_trigger',
}

export enum NudgeStatus {
  QUEUED = 'queued',
  DELIVERED = 'delivered',
  SEEN = 'seen',
  ACTED_ON = 'acted_on',
  DISMISSED = 'dismissed',
  EXPIRED = 'expired',
  SUPPRESSED = 'suppressed',
}

export interface UserNudgeState {
  userId: string;
  nudgesToday: number;
  nudgesTodayResetAt: Date;
  lastNudgeByType: Record<string, Date>;
  dismissCountByType: Record<string, number>;
  diaFrequency: 'frequent' | 'normal' | 'minimal' | 'off';
  timezone: string;
}

// ============================================================
// DIA CHAT INTERFACE
// ============================================================

export interface DIAChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'dia';
  content: string;
  contentType: DIAChatContentType;
  attachedResults: DIAChatResult[];
  suggestedActions: DIAChatAction[];
  createdAt: Date;
}

export type DIAChatContentType = 'text' | 'results_list' | 'insight' | 'action_confirmation';

export interface DIAChatResult {
  type: 'person' | 'event' | 'space' | 'opportunity' | 'story';
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string | null;
  matchScore: number | null;
  matchReasons: string[];
  actionLabel: string;
  actionPayload: Record<string, unknown>;
}

export interface DIAChatAction {
  label: string;
  type: 'navigate' | 'search' | 'create' | 'connect' | 'follow_up';
  payload: Record<string, unknown>;
}

export interface DIAChatQuery {
  text: string;
  intent: DIAChatIntent;
  entities: DIAChatEntity[];
  context: DIAChatContext;
}

export enum DIAChatIntent {
  // Network queries
  FIND_PEOPLE = 'find_people',
  NETWORK_ANALYSIS = 'network_analysis',
  INTRODUCTION_REQUEST = 'introduction_request',

  // Discovery queries
  FIND_EVENTS = 'find_events',
  FIND_SPACES = 'find_spaces',
  FIND_OPPORTUNITIES = 'find_opportunities',

  // Insight queries
  NETWORK_INSIGHTS = 'network_insights',
  PERSONAL_ANALYTICS = 'personal_analytics',
  REGIONAL_INSIGHTS = 'regional_insights',

  // Action queries
  CREATE_CONTENT = 'create_content',
  OPTIMIZE_PROFILE = 'optimize_profile',
  PLAN_STRATEGY = 'plan_strategy',

  // General
  GENERAL_QUESTION = 'general_question',
  PLATFORM_HELP = 'platform_help',
}

export interface DIAChatEntity {
  type: 'skill' | 'location' | 'industry' | 'person' | 'event' | 'space' | 'topic' | 'timeframe';
  value: string;
  confidence: number;
}

export interface DIAChatContext {
  userId: string;
  conversationId: string;
  currentView: string;
  recentActivity: string[];
  activeConversation: string | null;
  selectedContent: string | null;
}

// ============================================================
// NETWORK STATS (for DIA Chat network analysis)
// ============================================================

export interface NetworkStats {
  connectionCount: number;
  strongConnectionCount: number;
  countryCount: number;
  regionCount: number;
  topCluster: { name: string; count: number };
  skillMatchCount: number;
  growthOpportunity: string | null;
  weakArea: string | null;
}

// ============================================================
// DIA FEATURE TIERS
// ============================================================

export interface DIAFeatureTier {
  peopleMatchesPerDay: number;
  matchScoreVisible: boolean;
  matchReasonsVisible: boolean;
  opportunityMatchesPerDay: number;
  spaceRecommendations: 'basic' | 'full';
  eventRecommendations: 'basic' | 'full';
  nudgesPerDay: number;
  chatQueriesPerDay: number;
  networkAnalysis: 'count_only' | 'full' | 'org';
  weeklyDigest: 'basic' | 'detailed' | 'team';
}
