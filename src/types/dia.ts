/**
 * DNA | DIA Core Engine — Type System
 *
 * DIA (Diaspora Intelligence Agent) is DNA's AI-powered intelligence layer.
 * It operates across all Five C's simultaneously, learning from every
 * interaction and surfacing insights no single module could produce alone.
 *
 * Three operational modes:
 * - Ambient: Invisible intelligence (smart defaults, auto-suggestions, ranking)
 * - Proactive: Visible nudges and insights (feed cards, suggestions, recommendations)
 * - Reactive: Explicit invocation (DIA Chat, in-Composer agent, Search)
 */

// =====================================================
// CORE ENUMS & UNIONS
// =====================================================

/** The Five C pillars plus system contexts */
export type FiveCModule = 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';

/** DIA's three operational modes */
export type DIAOperationalMode = 'ambient' | 'proactive' | 'reactive';

/** User subscription tier — gates DIA capabilities */
export type SubscriptionTier = 'free' | 'pro' | 'org';

/** DIA suggestion tracking states */
export type SuggestionInteraction = 'shown' | 'accepted' | 'dismissed' | 'snoozed';

/** Trust boundary for data sharing */
export type TrustBoundary = 'self' | 'connections' | 'network' | 'public';

// =====================================================
// DIA SERVICE TYPES
// =====================================================

/**
 * Profile Intelligence — Analyzes user profiles, skill gaps, network position.
 * Consumers: Composer (audience suggestions), Feed (skill matching), Profile (completion nudges)
 */
export interface ProfileIntelligenceInput {
  user_id: string;
  include_skill_gaps?: boolean;
  include_network_position?: boolean;
  include_completion_analysis?: boolean;
}

export interface ProfileIntelligenceResult {
  user_id: string;
  completeness_score: number; // 0-100
  missing_fields: ProfileField[];
  skill_gaps: SkillGap[];
  network_position: NetworkPosition;
  recommended_actions: ProfileAction[];
  computed_at: string;
}

export type ProfileField =
  | 'avatar'
  | 'headline'
  | 'bio'
  | 'skills'
  | 'interests'
  | 'location'
  | 'languages'
  | 'diaspora_heritage'
  | 'professional_background'
  | 'education';

export interface SkillGap {
  skill: string;
  demand_score: number; // How in-demand this skill is on the platform
  opportunity_count: number; // Opportunities that match this skill
  recommendation: string;
}

export interface NetworkPosition {
  total_connections: number;
  cluster_memberships: string[]; // Community clusters user belongs to
  bridge_score: number; // How much user bridges different clusters (0-100)
  influence_reach: number; // Estimated reach of user's content
  regional_presence: RegionalPresence[];
}

export interface RegionalPresence {
  region: string;
  connection_count: number;
  engagement_score: number;
}

export interface ProfileAction {
  action_type: 'add_field' | 'expand_network' | 'join_space' | 'attend_event' | 'create_content';
  field?: ProfileField;
  title: string;
  description: string;
  value_proposition: string;
  priority: 'high' | 'medium' | 'low';
}

// =====================================================
// NETWORK INTELLIGENCE
// =====================================================

/**
 * Network Intelligence — Maps connection graph, relationship strength, community clusters.
 * Consumers: Feed (ranking), Composer (co-host suggestions), Messaging (smart introductions)
 */
export interface ConnectionStrength {
  user_a_id: string;
  user_b_id: string;
  overall_score: number; // 0-100
  factors: ConnectionStrengthFactors;
  last_computed: string;
}

export interface ConnectionStrengthFactors {
  message_frequency: number; // Weight: 0.25
  mutual_engagements: number; // Weight: 0.20
  shared_spaces: number; // Weight: 0.15
  shared_events: number; // Weight: 0.15
  profile_views: number; // Weight: 0.10
  response_time_score: number; // Weight: 0.15 — Faster responses = stronger signal
}

export interface CommunityCluster {
  cluster_id: string;
  name: string;
  description: string;
  member_count: number;
  primary_skills: string[];
  primary_regions: string[];
  density_score: number; // How tightly connected the cluster is
}

export interface SmartIntroduction {
  suggested_user_id: string;
  suggested_user_name: string;
  suggested_user_avatar: string | null;
  mutual_connections: number;
  shared_interests: string[];
  shared_skills: string[];
  introduction_reason: string; // Human-readable: "You both work in supply chain"
  relevance_score: number;
  source_module: FiveCModule;
}

// =====================================================
// CONTENT INTELLIGENCE
// =====================================================

/**
 * Content Intelligence — Analyzes content for topics, sentiment, quality signals.
 * Consumers: Composer (mode detection, tag suggestions), Feed (content quality score)
 */
export interface ContentAnalysis {
  content_id: string;
  detected_mode: FiveCModule | null;
  topics: string[];
  sentiment: ContentSentiment;
  quality_score: number; // 0-100
  suggested_tags: string[];
  suggested_audience: TrustBoundary;
  language: string;
  reading_time_minutes: number;
}

export type ContentSentiment = 'positive' | 'neutral' | 'negative' | 'mixed' | 'inspiring';

export interface ContentQualitySignals {
  length_score: number;
  formatting_score: number;
  media_richness: number;
  engagement_prediction: number;
  originality_score: number;
}

// =====================================================
// MATCHING ENGINE
// =====================================================

/**
 * Matching Engine — Matches Opportunities ↔ Profiles, Events ↔ Interests, Spaces ↔ Skills.
 * Consumers: Feed (match scores), Notifications (match alerts), Contribute Hub
 */
export interface MatchRequest {
  user_id: string;
  match_type: MatchType;
  filters?: MatchFilters;
  limit?: number;
}

export type MatchType =
  | 'opportunity_to_profile'
  | 'profile_to_opportunity'
  | 'event_to_interests'
  | 'space_to_skills'
  | 'profile_to_profile';

export interface MatchFilters {
  regions?: string[];
  skills?: string[];
  interests?: string[];
  min_score?: number;
  module?: FiveCModule;
}

export interface MatchResult {
  entity_id: string;
  entity_type: 'profile' | 'opportunity' | 'event' | 'space';
  match_score: number; // 0-100
  match_factors: MatchFactor[];
  match_reason: string; // Human-readable summary
  tier_gated: boolean; // Whether score visibility is gated behind Pro
}

export interface MatchFactor {
  factor: string;
  weight: number;
  score: number;
  detail: string;
}

// =====================================================
// TREND INTELLIGENCE
// =====================================================

/**
 * Trend Intelligence — Identifies what's trending in the network, region, or globally.
 * Consumers: Feed (trending sort), DIA Insight Cards, Convey Hub
 */
export interface TrendItem {
  trend_id: string;
  trend_type: TrendType;
  title: string;
  description: string;
  score: number; // Trending intensity
  velocity: number; // Rate of change (acceleration)
  regions: string[];
  related_modules: FiveCModule[];
  related_entity_ids: string[];
  detected_at: string;
  peak_at: string | null;
}

export type TrendType =
  | 'topic'
  | 'skill'
  | 'region'
  | 'event_category'
  | 'opportunity_type'
  | 'hashtag';

export interface TrendQuery {
  scope: 'network' | 'regional' | 'global';
  region?: string;
  module?: FiveCModule;
  time_window: 'day' | 'week' | 'month';
  limit?: number;
}

// =====================================================
// NUDGE ENGINE
// =====================================================

/**
 * Nudge Engine — Generates timely, contextual nudges based on user behavior patterns.
 * Consumers: Notifications, Composer (proactive suggestions), Feed (DIA Cards)
 */
export interface DIANudge {
  nudge_id: string;
  user_id: string;
  nudge_type: NudgeType;
  source_module: FiveCModule | 'system';
  title: string;
  message: string;
  action_url?: string;
  action_label?: string;
  priority: NudgePriority;
  trigger: NudgeTrigger;
  interaction: SuggestionInteraction;
  created_at: string;
  expires_at?: string;
}

export type NudgeType =
  | 'profile_completion'
  | 'connection_suggestion'
  | 'event_recommendation'
  | 'opportunity_match'
  | 'space_invitation'
  | 'content_prompt'
  | 'engagement_milestone'
  | 'weekly_digest'
  | 'stall_detection'
  | 'reactivation';

export type NudgePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NudgeTrigger {
  trigger_type: string;
  trigger_entity_id?: string;
  trigger_context: Record<string, unknown>;
}

// =====================================================
// CONVERSATION INTELLIGENCE
// =====================================================

/**
 * Conversation Intelligence — Analyzes messaging metadata for relationship strength signals.
 * DIA only accesses metadata (frequency, timing, participants) — never message content.
 */
export interface ConversationMetadata {
  conversation_id: string;
  participant_ids: string[];
  message_frequency: MessageFrequency;
  response_patterns: ResponsePattern;
  initiation_ratio: number; // Who initiates more (0 = all user_a, 1 = all user_b)
  last_activity: string;
}

export interface MessageFrequency {
  daily_average: number;
  weekly_average: number;
  trend: 'increasing' | 'stable' | 'decreasing' | 'dormant';
}

export interface ResponsePattern {
  average_response_minutes: number;
  response_rate: number; // 0-1, what % of messages get replies
  peak_hours: number[]; // Hours of day with most activity
}

// =====================================================
// REGIONAL INTELLIGENCE
// =====================================================

/**
 * Regional Intelligence — Aggregates activity by region, identifies regional patterns.
 * Consumers: Regional Hubs, Feed (regional relevance), Events (attendance prediction)
 */
export interface RegionalInsight {
  region: string;
  active_users: number;
  trending_topics: string[];
  top_skills_demand: string[];
  upcoming_events_count: number;
  active_spaces_count: number;
  open_opportunities_count: number;
  growth_rate: number; // % change in activity
  insights: string[];
  computed_at: string;
}

export interface RegionalQuery {
  region: string;
  include_sub_regions?: boolean;
  time_window?: 'week' | 'month' | 'quarter';
}

// =====================================================
// DIA INSIGHT CARDS (Feed Interleaving)
// =====================================================

/**
 * DIA Insight Cards appear interleaved in the Feed.
 * They surface intelligence that crosses module boundaries.
 */
export interface DIAInsightCard {
  insight_id: string;
  insight_type: InsightType;
  title: string;
  body: string;
  source_modules: FiveCModule[];
  action?: InsightAction;
  relevance_score: number;
  tier_required: SubscriptionTier;
  shown_count: number;
  interaction: SuggestionInteraction | null;
}

export type InsightType =
  | 'network_growth'
  | 'skill_trending'
  | 'opportunity_alert'
  | 'event_suggestion'
  | 'weekly_summary'
  | 'milestone_celebration'
  | 'regional_update'
  | 'content_performance';

export interface InsightAction {
  label: string;
  url: string;
  module: FiveCModule;
}

// =====================================================
// DIA TIER LIMITS
// =====================================================

/**
 * Tier-based limits for DIA capabilities.
 * These are enforced at the service layer.
 */
export interface DIATierLimits {
  tier: SubscriptionTier;
  ambient_intelligence: 'basic' | 'full';
  proactive_suggestions_per_session: number; // free: 2, pro/org: Infinity
  reactive_queries_per_day: number; // free: 5, pro/org: Infinity
  opportunity_match_scores: boolean;
  network_analytics: 'none' | 'personal' | 'team';
  content_performance: boolean | 'branded';
  custom_reports: boolean;
}

// =====================================================
// DIA CORE SERVICE INTERFACE
// =====================================================

/**
 * The DIA Core Service orchestrates all intelligence services.
 * Every action on the platform feeds data into DIA, and DIA
 * returns intelligence to every module.
 */
export interface DIACoreService {
  // Profile Intelligence
  analyzeProfile(input: ProfileIntelligenceInput): Promise<ProfileIntelligenceResult>;

  // Network Intelligence
  computeConnectionStrength(userAId: string, userBId: string): Promise<ConnectionStrength>;
  getSmartIntroductions(userId: string, limit?: number): Promise<SmartIntroduction[]>;
  getCommunityCluster(userId: string): Promise<CommunityCluster[]>;

  // Content Intelligence
  analyzeContent(content: string, contentType?: string): Promise<ContentAnalysis>;

  // Matching Engine
  findMatches(request: MatchRequest): Promise<MatchResult[]>;

  // Trend Intelligence
  getTrends(query: TrendQuery): Promise<TrendItem[]>;

  // Nudge Engine
  generateNudges(userId: string, context?: FiveCModule): Promise<DIANudge[]>;
  trackNudgeInteraction(nudgeId: string, interaction: SuggestionInteraction): Promise<void>;

  // Conversation Intelligence (metadata only — never message content)
  getConversationMetadata(conversationId: string): Promise<ConversationMetadata>;

  // Regional Intelligence
  getRegionalInsight(query: RegionalQuery): Promise<RegionalInsight>;

  // Insight Cards
  getInsightCards(userId: string, limit?: number): Promise<DIAInsightCard[]>;

  // Tier enforcement
  checkTierLimit(userId: string, capability: keyof DIATierLimits): Promise<boolean>;
}

// =====================================================
// DIA EVENT TRACKING
// =====================================================

/**
 * Every DIA suggestion is tracked for learning.
 * This creates a feedback loop: better suggestions → better engagement → smarter DIA.
 */
export interface DIASuggestionEvent {
  event_id: string;
  user_id: string;
  suggestion_type: string;
  suggestion_id: string;
  interaction: SuggestionInteraction;
  context_module: FiveCModule;
  metadata: Record<string, unknown>;
  timestamp: string;
}
