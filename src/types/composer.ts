/**
 * DNA Post Composer — TypeScript Types & Interfaces
 *
 * The Post Composer is DNA's unified creation gateway across all Five C's:
 * CONNECT, CONVENE, COLLABORATE, CONTRIBUTE, CONVEY.
 *
 * Zero `any` types. All interfaces fully typed.
 */

// ============================================================
// COMPOSER MODES
// ============================================================

// One union, one source of truth (BD075). ComposerMode lives in the
// composer-mode config and is re-exported here for the PRD type surface.
import type { ComposerMode } from '@/config/composerModes';
export type { ComposerMode };

export enum CModule {
  CONNECT = 'CONNECT',
  CONVENE = 'CONVENE',
  COLLABORATE = 'COLLABORATE',
  CONTRIBUTE = 'CONTRIBUTE',
  CONVEY = 'CONVEY',
}

/** Maps composer modes to their primary C module */
export const MODE_TO_PRIMARY_C: Record<ComposerMode, CModule> = {
  connect: CModule.CONNECT,
  event: CModule.CONVENE,
  space: CModule.COLLABORATE,
  need: CModule.CONTRIBUTE,
  story: CModule.CONVEY,
};

/** C-module accent colors from DNA palette */
export const C_MODULE_COLORS: Record<CModule, string> = {
  [CModule.CONNECT]: '#4A8D77',
  [CModule.CONVENE]: '#C4942A',
  [CModule.COLLABORATE]: '#2D5A3D',
  [CModule.CONTRIBUTE]: '#B87333',
  [CModule.CONVEY]: '#2A7A8C',
};

// ============================================================
// AUDIENCE & VISIBILITY
// ============================================================

export enum AudienceType {
  PUBLIC = 'public',
  CONNECTIONS = 'connections',
  SPACE_MEMBERS = 'space_members',
  REGIONAL_HUB = 'regional_hub',
  PRIVATE = 'private',
}

// ============================================================
// EVENT-SPECIFIC ENUMS
// ============================================================

export enum EventType {
  IN_PERSON = 'in_person',
  VIRTUAL = 'virtual',
  HYBRID = 'hybrid',
}

export enum TicketType {
  FREE = 'free',
  PAID = 'paid',
}

export enum RecurrenceFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

// ============================================================
// SPACE-SPECIFIC ENUMS
// ============================================================

export enum SpaceType {
  PROJECT = 'project',
  WORKING_GROUP = 'working_group',
  COMMUNITY = 'community',
  CAMPAIGN = 'campaign',
}

export enum SpaceVisibility {
  OPEN = 'open',
  REQUEST = 'request',
  INVITE_ONLY = 'invite_only',
}

// ============================================================
// OPPORTUNITY-SPECIFIC ENUMS
// ============================================================

export enum OpportunityDirection {
  NEED = 'need',
  OFFER = 'offer',
}

export enum OpportunityCategory {
  SKILLS = 'skills_expertise',
  FUNDING = 'funding_investment',
  MENTORSHIP = 'mentorship_guidance',
  PARTNERSHIP = 'partnership_collaboration',
  KNOWLEDGE = 'knowledge_training',
  NETWORK = 'network_introductions',
  RESOURCES = 'physical_resources',
  VOLUNTEER = 'volunteer_time',
}

export enum CompensationType {
  PAID = 'paid',
  VOLUNTEER = 'volunteer',
  EXCHANGE = 'exchange',
  EQUITY = 'equity',
  HYBRID = 'hybrid',
}

export enum OpportunityDuration {
  ONE_TIME = 'one_time',
  SHORT_TERM = 'short_term',
  LONG_TERM = 'long_term',
  ONGOING = 'ongoing',
}

export enum LocationRelevance {
  DIASPORA = 'diaspora',
  AFRICA_BASED = 'africa_based',
  GLOBAL = 'global',
  SPECIFIC_REGION = 'specific_region',
}

// ============================================================
// MONETIZATION
// ============================================================

export enum UserTier {
  FREE = 'free',
  PRO = 'pro',
  ORG = 'org',
}

// ============================================================
// BASE FIELDS (shared across all modes)
// ============================================================

export interface ComposerBaseFields {
  body: string;
  media: MediaAttachment[];
  audience: AudienceType;
  audienceTargetId?: string;
  tags: Tag[];
  mentions: Mention[];
  hashtags: string[];
  context?: ContentContext;
}

export interface MediaAttachment {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadProgress: number;
  uploadStatus: 'pending' | 'uploading' | 'complete' | 'failed';
  altText?: string;
  dimensions?: { width: number; height: number };
}

export interface Tag {
  id: string;
  label: string;
  source: 'dia_suggested' | 'user_manual' | 'auto_extracted';
  taxonomyCategory?: string;
}

export interface Mention {
  userId: string;
  displayName: string;
  position: { start: number; end: number };
}

export type ContentContext =
  | 'looking_for'
  | 'celebrating'
  | 'reflecting_on'
  | 'announcing'
  | 'asking_about'
  | 'sharing';

// ============================================================
// POST MODE FIELDS
// ============================================================

export interface PostModeFields {
  poll?: PollConfig;
  linkPreview?: LinkPreview;
}

export interface PollConfig {
  options: string[];
  duration: PollDuration;
  allowMultipleVotes: boolean;
}

export type PollDuration = '1_day' | '3_days' | '1_week';

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
  domain: string;
}

// ============================================================
// STORY MODE FIELDS
// ============================================================

export interface StoryModeFields {
  title: string;
  subtitle?: string;
  coverImage: MediaAttachment | null;
  seriesId?: string;
  seriesName?: string;
  readingTimeMinutes: number;
  scheduledPublishDate?: Date;
  callToAction?: StoryCallToAction;
}

export interface StoryCallToAction {
  type: 'connect' | 'join_space' | 'attend_event' | 'view_opportunity';
  label: string;
  targetId: string;
}

// ============================================================
// EVENT MODE FIELDS
// ============================================================

export interface EventModeFields {
  title: string;
  eventType: EventType;
  startDateTime: Date;
  endDateTime: Date;
  timezone: string;
  timezoneDisplay: TimezoneDisplay[];
  physicalLocation?: PhysicalLocation;
  virtualLink?: string;
  tickets: TicketConfig;
  capacity?: number;
  coHosts: CoHost[];
  recurring?: RecurrenceConfig;
  regionalHub?: string;
  relatedSpaceId?: string;
  rsvpQuestions?: RSVPQuestion[];
  coverImage: MediaAttachment | null;
}

export interface TimezoneDisplay {
  timezone: string;
  label: string;
  displayTime: string;
}

export interface PhysicalLocation {
  address: string;
  city: string;
  country: string;
  coordinates?: { lat: number; lng: number };
  venueName?: string;
}

export interface TicketConfig {
  type: TicketType;
  tiers?: TicketTier[];
}

export interface TicketTier {
  name: string;
  price: number;
  currency: string;
  quantity?: number;
  description?: string;
}

export interface CoHost {
  userId: string;
  displayName: string;
  avatarUrl?: string;
}

export interface RecurrenceConfig {
  frequency: RecurrenceFrequency;
  endDate?: Date;
  occurrences?: number;
}

export interface RSVPQuestion {
  id: string;
  question: string;
  type: 'text' | 'single_choice' | 'multiple_choice';
  options?: string[];
  required: boolean;
}

// ============================================================
// SPACE MODE FIELDS
// ============================================================

export interface SpaceModeFields {
  name: string;
  description: string;
  coverImage: MediaAttachment | null;
  spaceType: SpaceType;
  visibility: SpaceVisibility;
  rolesNeeded: SpaceRole[];
  timeline?: SpaceTimeline;
  maxMembers?: number;
  regionalFocus?: string;
  relatedEventId?: string;
  initialTasks?: InitialTask[];
}

export interface SpaceRole {
  title: string;
  description?: string;
  filled: boolean;
}

export interface SpaceTimeline {
  startDate: Date;
  targetEndDate: Date;
}

export interface InitialTask {
  title: string;
  assignedRole?: string;
}

// ============================================================
// OPPORTUNITY MODE FIELDS
// ============================================================

export interface OpportunityModeFields {
  title: string;
  direction: OpportunityDirection;
  category: OpportunityCategory;
  compensation: CompensationType;
  compensationDetails?: CompensationDetails;
  locationRelevance: LocationRelevance;
  specificRegion?: string;
  specificCountry?: string;
  duration: OpportunityDuration;
  deadline?: Date;
  requirements?: string;
  relatedSpaceId?: string;
  budgetRange?: BudgetRange;
  /** BD084 - the give -> to -> impact triple. DIA proposes; the author owns the final value. */
  giveWhat?: string;
  giveTo?: string;
  intendedImpact?: string;
}

export interface CompensationDetails {
  currency?: string;
  minAmount?: number;
  maxAmount?: number;
  description?: string;
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
  displayAs: 'exact' | 'range' | 'negotiable';
}

// ============================================================
// DIA INTELLIGENCE LAYER
// ============================================================

export interface DIASuggestion {
  id: string;
  type: DIASuggestionType;
  message: string;
  action: DIASuggestionAction;
  confidence: number;
  dismissedAt?: Date;
}

export type DIASuggestionType =
  | 'mode_switch'
  | 'cross_c_link'
  | 'audience_suggestion'
  | 'content_upgrade'
  | 'timing_insight'
  | 'collaboration_prompt'
  | 'field_suggestion';

export interface DIASuggestionAction {
  type: 'switch_mode' | 'add_field' | 'share_with' | 'navigate' | 'dismiss';
  payload: Record<string, unknown>;
}

export interface DIAAssistRequest {
  query: string;
  composerContext: {
    currentMode: ComposerMode;
    currentFields: ComposerBaseFields;
    modeFields: Record<string, unknown>;
  };
}

export interface DIAAssistResponse {
  response: string;
  suggestions?: DIASuggestion[];
  autoFillFields?: Partial<ComposerBaseFields>;
}

export interface DIAAmbientConfig {
  analyzeAfterCharCount: number;
  analyzeDebounceMs: number;
  maxSuggestionsPerSession: number;
  suggestionConfidenceThreshold: number;
}

export const DIA_AMBIENT_DEFAULTS: DIAAmbientConfig = {
  analyzeAfterCharCount: 50,
  analyzeDebounceMs: 1500,
  maxSuggestionsPerSession: 2,
  suggestionConfidenceThreshold: 0.6,
};

// ============================================================
// ATTRIBUTION SYSTEM
// ============================================================

export interface ComposerAttribution {
  id: string;
  createdBy: string;
  createdVia: 'post_composer';
  primaryC: CModule;
  secondaryCs: CModule[];
  composerMode: ComposerMode;
  diaSuggestedMode: boolean;
  diaInteractions: number;
  crossReferences: CrossReference[];
  createdAt: Date;
}

export interface CrossReference {
  targetType: 'event' | 'space' | 'opportunity' | 'story' | 'post' | 'profile';
  targetId: string;
  relationship: CrossReferenceRelationship;
}

export type CrossReferenceRelationship =
  | 'mentioned_in'
  | 'born_from'
  | 'linked_to'
  | 'follow_up_to'
  | 'co_hosted_with'
  | 'shared_to';

// ============================================================
// SUBMISSION OUTPUT
// ============================================================

export interface ComposerSubmission {
  mode: ComposerMode;
  base: ComposerBaseFields;
  modeFields:
    | PostModeFields
    | StoryModeFields
    | EventModeFields
    | SpaceModeFields
    | OpportunityModeFields;
  attribution: Omit<ComposerAttribution, 'id' | 'createdAt'>;
  tier: UserTier;
}

// ============================================================
// COMPOSER STATE
// ============================================================

export interface ComposerState {
  mode: ComposerMode;
  isOpen: boolean;
  isDraft: boolean;
  isSubmitting: boolean;

  base: ComposerBaseFields;

  post: PostModeFields | null;
  story: StoryModeFields | null;
  event: EventModeFields | null;
  space: SpaceModeFields | null;
  opportunity: OpportunityModeFields | null;

  dia: {
    currentSuggestion: DIASuggestion | null;
    suggestedMode: ComposerMode | null;
    isAnalyzing: boolean;
    assistChatOpen: boolean;
  };

  draft: {
    id: string | null;
    lastSaved: Date | null;
    autoSaveEnabled: boolean;
  };

  tier: UserTier;
  tierLimits: TierLimits;
}

// ============================================================
// TIER LIMITS
// ============================================================

export interface TierLimits {
  canCreatePaidEvents: boolean;
  canCreateSeries: boolean;
  canScheduleContent: boolean;
  canLeadSpaces: boolean;
  canPostUnlimitedOpportunities: boolean;
  canAccessFullDIA: boolean;
  canViewCrossCAnalytics: boolean;
  maxOpportunitiesPerMonth: number;
  maxDIASuggestionsPerSession: number;
  maxDIAQueriesPerDay: number;
  maxEventTicketTiers: number;
  maxRSVPQuestions: number;
}

// ============================================================
// ENTRY POINT CONTEXT
// ============================================================

export interface ComposerEntryContext {
  presetMode?: ComposerMode;
  relatedSpace?: string;
  relatedEvent?: string;
  resharedContent?: string;
  prefillCategory?: string;
}
