/**
 * DNA Platform: Releases & Features Management System
 * TypeScript type definitions
 */

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

export type ReleaseCategory =
  | 'CONNECT'
  | 'CONVENE'
  | 'COLLABORATE'
  | 'CONTRIBUTE'
  | 'CONVEY'
  | 'PLATFORM';

export type ReleaseStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export type ReleaseHeroType =
  | 'gradient'
  | 'image'
  | 'video'
  | 'animation'
  | 'map'
  | 'chat'
  | 'network'
  | 'notification';

export type ReleaseLifecycleStage = 'featured' | 'recent' | 'archived';

export type ChangelogType = 'added' | 'improved' | 'fixed' | 'removed' | 'security';

export type MediaType = 'image' | 'video' | 'gif';

// Category display configuration
export const CATEGORY_CONFIG: Record<ReleaseCategory, {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}> = {
  CONNECT: {
    label: 'Connect',
    icon: '🔗',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  CONVENE: {
    label: 'Convene',
    icon: '📅',
    color: 'text-copper-600',
    bgColor: 'bg-copper-100',
  },
  COLLABORATE: {
    label: 'Collaborate',
    icon: '🤝',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  CONTRIBUTE: {
    label: 'Contribute',
    icon: '💼',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  CONVEY: {
    label: 'Convey',
    icon: '📢',
    color: 'text-copper-600',
    bgColor: 'bg-copper-100',
  },
  PLATFORM: {
    label: 'Platform',
    icon: '⚙️',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
  },
};

// Lifecycle stage configuration
export const LIFECYCLE_CONFIG: Record<ReleaseLifecycleStage, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  featured: {
    label: 'NEW',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
  },
  recent: {
    label: 'RECENT',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
  },
  archived: {
    label: 'ARCHIVED',
    color: 'text-neutral-600',
    bgColor: 'bg-neutral-100',
    borderColor: 'border-neutral-300',
  },
};

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Release media item (image, video, gif in gallery)
 */
export interface ReleaseMedia {
  id: string;
  media_type: MediaType;
  url: string;
  alt_text?: string;
  caption?: string;
}

/**
 * Changelog entry for version updates
 */
export interface ReleaseChangelog {
  id: string;
  change_type: ChangelogType;
  description: string;
  created_at: string;
}

/**
 * Base release type from database
 */
export interface Release {
  id: string;
  slug: string;
  version?: string;
  title: string;
  subtitle?: string;
  description: string;
  category: ReleaseCategory;
  tags: string[];
  release_date: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
  status: ReleaseStatus;
  is_pinned: boolean;
  hero_type: ReleaseHeroType;
  hero_image_url?: string;
  hero_video_url?: string;
  cta_text: string;
  cta_link?: string;
  meta_title?: string;
  meta_description?: string;
  view_count: number;
  created_by?: string;
}

/**
 * Extended release with computed fields from views
 */
export interface ReleaseWithDetails extends Release {
  days_since_release: number;
  lifecycle_stage: ReleaseLifecycleStage;
  features: string[];
  media: ReleaseMedia[];
  changelog: ReleaseChangelog[];
}

/**
 * Simplified release for card display
 */
export interface ReleaseCardData {
  id: string;
  slug: string;
  version?: string;
  title: string;
  subtitle?: string;
  category: ReleaseCategory;
  release_date: string;
  hero_type: ReleaseHeroType;
  hero_image_url?: string;
  lifecycle_stage: ReleaseLifecycleStage;
  features: string[];
}

/**
 * Related release for recommendations
 */
export interface RelatedRelease {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  category: ReleaseCategory;
  release_date: string;
  hero_type: ReleaseHeroType;
  hero_image_url?: string;
}

// =============================================================================
// FILTER & QUERY TYPES
// =============================================================================

export type ReleaseFilterType = 'all' | 'featured' | 'recent' | 'archived';

export interface ReleaseFilters {
  filter?: ReleaseFilterType;
  category?: ReleaseCategory;
  tags?: string[];
  search?: string;
}

export interface ReleasesQueryResult {
  releases: ReleaseWithDetails[];
  total: number;
  hasMore: boolean;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

export type ReleaseCardVariant = 'featured' | 'standard' | 'compact';

export interface NewFeaturePillProps {
  className?: string;
}

export interface ReleaseCardProps {
  release: ReleaseCardData;
  variant?: ReleaseCardVariant;
  className?: string;
}

export interface ReleaseHeroProps {
  heroType: ReleaseHeroType;
  imageUrl?: string;
  videoUrl?: string;
  category: ReleaseCategory;
  title: string;
  className?: string;
}

export interface ReleaseMetaProps {
  release: Release;
  showVersion?: boolean;
  showCategory?: boolean;
  showDate?: boolean;
  className?: string;
}

export interface ReleaseFiltersProps {
  filters: ReleaseFilters;
  onFiltersChange: (filters: ReleaseFilters) => void;
  className?: string;
}

export interface FeatureListProps {
  features: string[];
  title?: string;
  className?: string;
}

export interface StatusBadgeProps {
  stage: ReleaseLifecycleStage;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface CategoryTagProps {
  category: ReleaseCategory;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// =============================================================================
// ADMIN TYPES
// =============================================================================

export interface ReleaseFormData {
  slug?: string;
  version?: string;
  title: string;
  subtitle?: string;
  description: string;
  category: ReleaseCategory;
  tags: string[];
  release_date: string;
  status: ReleaseStatus;
  is_pinned: boolean;
  hero_type: ReleaseHeroType;
  hero_image_url?: string;
  hero_video_url?: string;
  cta_text: string;
  cta_link?: string;
  meta_title?: string;
  meta_description?: string;
  features: string[];
}

export interface CreateReleaseInput extends ReleaseFormData {
  features: string[];
}

export interface UpdateReleaseInput extends Partial<ReleaseFormData> {
  id: string;
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

export interface UseReleasesReturn {
  releases: ReleaseWithDetails[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  hasMore: boolean;
  loadMore: () => void;
}

export interface UseFeaturedCountReturn {
  count: number;
  isLoading: boolean;
  error: Error | null;
}

export interface UseReleaseReturn {
  release: ReleaseWithDetails | null;
  relatedReleases: RelatedRelease[];
  isLoading: boolean;
  error: Error | null;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Grouped releases by month/year for timeline display
 */
export interface ReleasesGroupedByMonth {
  month: string; // e.g., "December 2025"
  releases: ReleaseWithDetails[];
}

/**
 * Get lifecycle stage from release date and status
 */
export function getLifecycleStage(
  releaseDate: string,
  status: ReleaseStatus,
  archivedAt?: string
): ReleaseLifecycleStage {
  if (status === 'archived' || archivedAt) {
    return 'archived';
  }

  const now = new Date();
  const release = new Date(releaseDate);
  const daysSince = Math.floor(
    (now.getTime() - release.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSince <= 30) {
    return 'featured';
  } else if (daysSince <= 90) {
    return 'recent';
  }

  return 'archived';
}

/**
 * Group releases by month for timeline display
 */
export function groupReleasesByMonth(
  releases: ReleaseWithDetails[]
): ReleasesGroupedByMonth[] {
  const grouped = releases.reduce((acc, release) => {
    const date = new Date(release.release_date);
    const monthYear = date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    acc[monthYear].push(release);
    return acc;
  }, {} as Record<string, ReleaseWithDetails[]>);

  return Object.entries(grouped).map(([month, releases]) => ({
    month,
    releases,
  }));
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
