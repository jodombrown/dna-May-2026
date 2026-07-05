import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MemberCard } from '@/components/connect/MemberCard';
import { DiscoverSearchHeader } from '@/components/connect/DiscoverSearchHeader';
import { DiscoverFilterPills } from '@/components/connect/DiscoverFilterPills';
import { DiscoverFilterSheet } from '@/components/connect/DiscoverFilterSheet';
import { MemberCardSkeletonGrid } from '@/components/connect/MemberCardSkeleton';
import { Loader2, Users, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ProfileCompletionNudge } from '@/components/profile/ProfileCompletionNudge';
import { useMobile } from '@/hooks/useMobile';
import { logger } from '@/lib/logger';
import { originNameToCode } from '@/lib/memberHeritage';
import { CaughtUpNotice } from '@/components/shared/CaughtUpNotice';

interface FilterState {
  primary_origin_country?: string;
  current_country?: string;
  focus_areas?: string[];
  regional_expertise?: string[];
  industries?: string[];
  skills?: string[];
}

interface DiscoverOutletContext {
  mobileSearchQuery: string;
  showMobileFilters: boolean;
  setShowMobileFilters: (show: boolean) => void;
  setMobileActiveFilterCount: (count: number) => void;
}

// Animation variants for staggered cards
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

export default function Discover() {
  const { user } = useAuth();
  const { isMobile } = useMobile();
  const context = useOutletContext<DiscoverOutletContext>();
  
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({});
  const [desktopSearchQuery, setDesktopSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const { trackEvent } = useAnalytics();

  // Use mobile search from parent context, or desktop local state
  const searchQuery = isMobile && context?.mobileSearchQuery !== undefined 
    ? context.mobileSearchQuery 
    : desktopSearchQuery;

  // Sync mobile filter sheet state from parent
  useEffect(() => {
    if (context?.showMobileFilters && isMobile) {
      setIsFilterSheetOpen(true);
      context.setShowMobileFilters(false);
    }
  }, [context?.showMobileFilters, isMobile]);

  // Check for reduced motion preference
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.primary_origin_country) count++;
    if (filters.current_country) count++;
    if (filters.focus_areas?.length) count += filters.focus_areas.length;
    if (filters.regional_expertise?.length) count += filters.regional_expertise.length;
    if (filters.industries?.length) count += filters.industries.length;
    if (filters.skills?.length) count += filters.skills.length;
    return count;
  }, [filters]);

  // Sync filter count to parent for mobile header
  useEffect(() => {
    context?.setMobileActiveFilterCount?.(activeFilterCount);
  }, [activeFilterCount, context]);

  useEffect(() => {
    if (user) {
      setPage(0);
      setMembers([]);
      setHasMore(true);
      loadMembers(true, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters, searchQuery]);

  const loadMembers = async (reset = false, pageOverride?: number) => {
    if (!user) return;
    try {
      setLoading(true);
      const effectivePage = pageOverride !== undefined ? pageOverride : page;
      const offset = reset ? 0 : effectivePage * 20;

      let rows: any[] = [];

      try {
        // Primary: call RPC for smart discovery
        // IMPORTANT: Empty arrays must be passed as null to avoid filtering bugs
        const { data, error } = await supabase.rpc('discover_members', {
          p_current_user_id: user.id,
          p_focus_areas: filters.focus_areas?.length ? filters.focus_areas : null,
          p_regional_expertise: filters.regional_expertise?.length ? filters.regional_expertise : null,
          p_industries: filters.industries?.length ? filters.industries : null,
          p_country_of_origin: filters.primary_origin_country ? (originNameToCode(filters.primary_origin_country) || filters.primary_origin_country) : null,
          p_location_country: filters.current_country || null,
          p_skills: filters.skills?.length ? filters.skills : null,
          p_search_query: searchQuery || null,
          p_sort_by: 'match',
          p_limit: 20,
          p_offset: offset,
        });

        if (!error && data) {
          rows = data as any[];
        } else {
          throw error || new Error('No data returned');
        }
      } catch (rpcError) {
        logger.warn('Discover', 'RPC failed, using fallback query', rpcError);
        try {
          let q = supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url, headline, profession, location, current_country, focus_areas, industries, skills, languages, available_for, regional_expertise, updated_at')
            .neq('id', user.id)
            .eq('is_public', true);

          if (filters?.focus_areas?.length) q = q.overlaps('focus_areas', filters.focus_areas);
          if (filters?.regional_expertise?.length) q = q.overlaps('regional_expertise', filters.regional_expertise);
          if (filters?.industries?.length) q = q.overlaps('industries', filters.industries);
          if (filters?.skills?.length) q = q.overlaps('skills', filters.skills);
          if (filters?.current_country) q = q.eq('current_country_name', filters.current_country);
          if (searchQuery) {
            q = q.or(
              `full_name.ilike.%${searchQuery}%,headline.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
            );
          }

          q = q.order('updated_at', { ascending: false }).range(offset, offset + 19);

          const { data: fbData, error: fbError } = await q;
          if (fbError) {
            logger.warn('Discover', 'Fallback query also failed:', fbError);
            rows = [];
          } else {
            rows = (fbData || []).map((p: any) => ({ ...p, match_score: 0 }));
          }
        } catch (fallbackError) {
          logger.warn('Discover', 'All queries failed:', fallbackError);
          rows = [];
        }
      }

      if (reset) {
        setMembers(rows);
      } else {
        // Dedupe against existing members to avoid repopulation if RPC returns overlap
        setMembers(prev => {
          const seen = new Set(prev.map((m: any) => m.id));
          const fresh = rows.filter((r: any) => !seen.has(r.id));
          return [...prev, ...fresh];
        });
      }
      setHasMore(rows.length === 20);
    } catch (error) {
      logger.warn('Discover', 'Unexpected error in loadMembers:', error);
      if (reset) {
        setMembers([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadMembers(false, nextPage);
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    trackEvent('connect_discovery_filter_applied', { filter_count: Object.keys(newFilters).length });
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const handleSearchChange = (value: string) => {
    setDesktopSearchQuery(value);
  };

  const handleSearchClear = () => {
    setDesktopSearchQuery('');
  };

  if (!user) return null;

  return (
    <div className="space-y-1 md:space-y-4 overflow-x-hidden">
      {/* Profile Completion Nudge */}
      <ProfileCompletionNudge variant="compact" threshold={40} showMissingFields={true} />

      {/* iOS-Style Sticky Search Header - Desktop only */}
      <div className="hidden md:block">
        <DiscoverSearchHeader
          value={desktopSearchQuery}
          onChange={(value) => setDesktopSearchQuery(value)}
          onClear={() => setDesktopSearchQuery('')}
          isLoading={loading && members.length > 0}
        />
      </div>

      {/* Horizontal Filter Pills - Desktop only */}
      <div className="hidden md:block">
        <DiscoverFilterPills
          filters={filters}
          onOpenSheet={() => setIsFilterSheetOpen(true)}
          activeCount={activeFilterCount}
        />
      </div>

      {/* Filter Bottom Sheet */}
      <DiscoverFilterSheet
        open={isFilterSheetOpen}
        onOpenChange={setIsFilterSheetOpen}
        filters={filters}
        onApply={handleFilterChange}
        onClear={handleClearFilters}
      />

      {/* Content */}
      {loading && members.length === 0 ? (
        <MemberCardSkeletonGrid count={4} />
      ) : members.length === 0 ? (
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>No members found. Try adjusting your filters.</AlertDescription>
        </Alert>
      ) : (
        <>
          <motion.div
            className="grid gap-2 md:gap-3"
            variants={prefersReducedMotion ? undefined : containerVariants}
            initial="hidden"
            animate="visible"
            key={`${searchQuery}-${JSON.stringify(filters)}`}
          >
            <AnimatePresence mode="popLayout">
              {members.map((m, index) => (
                <motion.div
                  key={m.id}
                  variants={prefersReducedMotion ? undefined : cardVariants}
                  layout
                >
                  <MemberCard
                    member={m}
                    onConnectionSent={() => loadMembers(true)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {hasMore ? (
            <div className="flex justify-center pt-4 pb-2">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load More'}
              </button>
            </div>
          ) : (
            members.length > 0 && (
              <div className="flex flex-col items-center justify-center pt-6 pb-2 text-center">
                <div className="text-sm font-medium text-foreground">You're all caught up</div>
                <p className="text-xs text-muted-foreground mt-1">
                  You've seen every member matching your filters. Try adjusting them to discover more.
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
