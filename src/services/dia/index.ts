/**
 * DNA | DIA Core Engine — Service Index
 *
 * The DIA (Diaspora Intelligence Agent) is the nervous system that makes
 * DNA intelligent. It operates across all Five C's simultaneously.
 *
 * Architecture:
 * - Internal data sourced from Supabase (profiles, connections, activity, engagement)
 * - External data sourced from Perplexity API (news, trends, economic data)
 * - Matching algorithms start rule-based, graduate to ML as data accumulates
 * - DIA never shares private user data across trust boundaries
 * - All suggestions are tracked (shown, accepted, dismissed) for learning
 *
 * Service layers:
 * 1. Foundation: Relationship Strength, Network Intelligence
 * 2. Matching: People, Opportunities, Spaces, Events
 * 3. Engagement: Nudge Engine, Content Intelligence
 * 4. Interface: DIA Chat, Trend Intelligence
 */

// ── Foundation Services ──────────────────────────────────
export { profileIntelligenceService } from './profileIntelligence';
export { networkIntelligenceService } from './networkIntelligence';
export { relationshipStrengthService } from './relationshipStrength';

// ── Content & Communication Intelligence ─────────────────
export { contentIntelligenceService } from './contentIntelligence';
export { conversationIntelligenceService } from './conversationIntelligence';

// ── Matching Services ────────────────────────────────────
export { matchingEngineService } from './matchingEngine';
export { peopleMatchingService } from './peopleMatching';
// STUBBED: Phase 2 teardown. opportunityMatching and spaceMatching removed
// while CONTRIBUTE/COLLABORATE are being rebuilt. Restore in Phase 3.
export { eventMatchingService } from './eventMatching';

// ── Nudge & Trend Services ───────────────────────────────
export { trendIntelligenceService } from './trendIntelligence';

// ── Regional & Chat Services ─────────────────────────────
export { regionalIntelligenceService } from './regionalIntelligence';
export { diaChatService } from './diaChat';

// ── DIA Card System (Sprint 4A) ────────────────────────
export { generateConnectCards } from './connectCards';
export { generateConveneCards } from './conveneCards';
export { generateCollaborateCards } from './collaborateCards';
export { generateContributeCards } from './contributeCards';
export { generateConveyCards } from './conveyCards';
export { generateCrossCCards } from './crossCCards';

// ── DIA Proactive Triggers (Sprint 4B) ────────────────
export { diaEventBus } from './diaEventBus';
export { diaNudgeEngine } from './diaNudgeEngine';
export { diaNudgeStorage } from './diaNudgeStorage';
export { diaPeriodicCheck, initDIAPeriodicChecks } from './diaPeriodicCheck';
export type { DIAPlatformEvent, DIAPlatformEventType } from './diaEventTypes';
export type { DIAProactiveNudge, NudgeDeliveryStatus } from './diaNudgeStorage';

// ── Re-export foundational types ─────────────────────────
export type {
  DIACoreService,
  DIAOperationalMode,
  FiveCModule,
  SubscriptionTier,
  DIANudge,
  DIAInsightCard,
  MatchRequest,
  MatchResult,
  SmartIntroduction,
  TrendItem,
  RegionalInsight,
  ProfileIntelligenceResult,
  ConnectionStrength,
  ContentAnalysis,
} from '@/types/dia';

// ── Re-export DIA Engine types ───────────────────────────
export type {
  // Network Graph
  NetworkEdge,
  RelationshipSignals,
  RawRelationshipData,

  // People Matching
  PeopleMatchResult,
  PeopleMatchSignals,
  MatchReason,
  MatchSurface,
  MatchPriority,
  MatchStatus,

  // Opportunity Matching
  OpportunityMatchResult,
  OpportunityMatchSignals,

  // Space Matching
  SpaceMatchResult,
  SpaceMatchSignals,

  // Event Matching
  EventMatchResult,
  EventMatchSignals,

  // Nudge Engine
  Nudge,
  NudgeTiming,
  UserNudgeState,

  // DIA Chat
  DIAChatMessage,
  DIAChatQuery,
  DIAChatContext,
  DIAChatResult,
  DIAChatAction,
  NetworkStats,

  // Feature Tiers
  DIAFeatureTier,
} from '@/types/diaEngine';
