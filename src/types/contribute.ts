/**
 * CONTRIBUTE Module - Phase 1: The Manifest
 *
 * Type contracts for Manifests and Currency Stances. Mirrors the Phase 1
 * SQL schema in 2026_05_11_contribute_phase1_manifest.sql.
 */

export type ContributionCurrency =
  | 'expertise'
  | 'network'
  | 'resources'
  | 'capital';

export type StanceAvailability =
  | 'open_ongoing'
  | 'monthly_hours'
  | 'quarterly'
  | 'project_based'
  | 'limited_capacity';

export type StanceVisibility =
  | 'public'
  | 'connections_only'
  | 'private';

export interface ContributionManifest {
  id: string;
  userId: string;
  headline: string | null;
  isPublished: boolean;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyStance {
  id: string;
  manifestId: string;
  userId: string;
  currency: ContributionCurrency;
  title: string;
  description: string | null;
  tags: string[];
  availability: StanceAvailability;
  visibility: StanceVisibility;
  displayOrder: number;
  isArchived: boolean;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManifestWithStances {
  manifest: ContributionManifest;
  stances: CurrencyStance[];
}

export interface StanceFormValues {
  currency: ContributionCurrency;
  title: string;
  description: string;
  tags: string[];
  availability: StanceAvailability;
  visibility: StanceVisibility;
}

export const STANCE_TITLE_MIN = 4;
export const STANCE_TITLE_MAX = 120;
export const STANCE_DESCRIPTION_MAX = 600;
export const STANCE_TAGS_MAX = 8;
export const HEADLINE_SOFT_MIN = 60;
export const HEADLINE_HARD_MAX = 280;
export const MANIFEST_STANCE_CAP = 5;
export const MANIFEST_STANCE_SOFT_WARN = 3;

/**
 * Authorable currencies for v1. Capital is part of the union for
 * type-completeness but cannot be authored - the database
 * `capital_deferred_v1` constraint backs this up.
 */
export const AUTHORABLE_CURRENCIES: readonly ContributionCurrency[] = [
  'expertise',
  'network',
  'resources',
] as const;

export function isAuthorableCurrency(
  c: ContributionCurrency,
): c is Exclude<ContributionCurrency, 'capital'> {
  return c !== 'capital';
}

// ---------------------------------------------------------------------------
// Phase 2: The Need
// ---------------------------------------------------------------------------

export type NeedStatus =
  | 'draft'
  | 'open'
  | 'matched'
  | 'fulfilled'
  | 'closed'
  | 'expired';

export type NeedScope =
  | 'one_off'
  | 'few_hours'
  | 'short_project'
  | 'extended'
  | 'open_ended';

export interface NeedDeclaration {
  id: string;
  userId: string;
  currency: ContributionCurrency;
  title: string;
  context: string | null;
  scope: NeedScope;
  relatedStanceId: string | null;
  tags: string[];
  visibility: StanceVisibility;
  status: NeedStatus;
  startsAt: string | null;
  endsAt: string | null;
  expiresAt: string | null;
  publishedAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NeedFormValues {
  currency: ContributionCurrency;
  title: string;
  context: string;
  scope: NeedScope;
  relatedStanceId: string | null;
  tags: string[];
  visibility: StanceVisibility;
  startsAt: string | null;
  endsAt: string | null;
}

export const NEED_TITLE_MIN = 4;
export const NEED_TITLE_MAX = 120;
export const NEED_CONTEXT_MAX = 1000;
export const NEED_TAGS_MAX = 8;
export const NEED_ACTIVE_CAP = 10;
export const NEED_ACTIVE_SOFT_WARN = 5;

// ---------------------------------------------------------------------------
// Phase 3: The Room
// ---------------------------------------------------------------------------

export type MatchKind =
  | 'their_stance_my_need'
  | 'their_need_my_stance'
  | 'mutual'
  | 'tag_affinity';

export type ReasoningSource = 'sql' | 'dia';

export interface RoomCuration {
  curationId: string;
  subjectUserId: string;
  kind: MatchKind;
  currency: ContributionCurrency;
  subjectStanceId: string | null;
  subjectStanceTitle: string | null;
  subjectNeedId: string | null;
  subjectNeedTitle: string | null;
  subjectNeedContext: string | null;
  subjectNeedScope: NeedScope | null;
  viewerStanceId: string | null;
  viewerStanceTitle: string | null;
  viewerNeedId: string | null;
  viewerNeedTitle: string | null;
  score: number;
  reasoning: string;
  reasoningSource: ReasoningSource;
  curationDate: string;
}

export interface RoomReadiness {
  hasManifest: boolean;
  manifestPublished: boolean;
  activeStanceCount: number;
  activeNeedCount: number;
  curationCountToday: number;
}

export interface RoomSubjectProfile {
  userId: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
  city: string | null;
  location: string | null;
  headline: string | null;
}

/**
 * Render-level score cutoff. Cards with score < ROOM_SCORE_CUTOFF should not
 * render. The full curation set stays in the database for analytics and
 * matching-engine tuning; the UI displays only the strong-signal matches.
 * Gating happens client-side in useRoom after data is fetched.
 */
export const ROOM_SCORE_CUTOFF = 0.5;
