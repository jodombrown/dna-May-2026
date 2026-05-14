/**
 * Releases Index Page
 * Main showcase page for all platform releases
 * Route: /releases
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MateMasie } from '@/components/icons/adinkra';

import { useReleases } from '@/hooks/useReleases';
import {
  ReleaseCard,
  ReleaseFilters,
} from '@/components/releases';
import { Skeleton } from '@/components/ui/skeleton';
import { groupReleasesByMonth, type ReleaseFilters as FiltersType, type ReleaseFilterType, type ReleaseCategory } from '@/types/releases';

const ReleasesIndex: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params
  const initialFilters: FiltersType = useMemo(() => ({
    filter: (searchParams.get('filter') as ReleaseFilterType) || 'all',
    category: (searchParams.get('category') as ReleaseCategory) || undefined,
    search: searchParams.get('search') || undefined,
  }), [searchParams]);

  const [filters, setFilters] = useState<FiltersType>(initialFilters);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.filter && filters.filter !== 'all') {
      params.set('filter', filters.filter);
    }
    if (filters.category) {
      params.set('category', filters.category);
    }
    if (filters.search) {
      params.set('search', filters.search);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Fetch releases
  const { data, isLoading, error } = useReleases(filters);

  // Group releases by month
  const groupedReleases = useMemo(() => {
    if (!data || data.length === 0) return [];
    return groupReleasesByMonth(data as any);
  }, [data]);

  // Count featured releases
  const featuredCount = useMemo(() => {
    return data?.filter(r => r.lifecycle_stage === 'featured').length || 0;
  }, [data]);

  return (
    <>
      <Helmet>
        <title>What&apos;s New | DNA Platform</title>
        <meta
          name="description"
          content="Keep up with the latest DNA features, improvements, and updates. Explore new ways to connect, convene, collaborate, contribute, and convey with the diaspora."
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-amber-50/30 to-white">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Hero Section */}
          <header className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 font-medium text-sm mb-4">
              <MateMasie className="w-4 h-4" />
              {featuredCount > 0 ? (
                <span>{featuredCount} new {featuredCount === 1 ? 'feature' : 'features'} this month</span>
              ) : (
                <span>Platform Updates</span>
              )}
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
              What&apos;s New
            </h1>
            <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
              Keep up with the latest DNA features and improvements.
              Discover new ways to connect with the diaspora.
            </p>
          </header>

          {/* Filters */}
          <div className="mb-8">
            <ReleaseFilters
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-12">
              {[1, 2].map((section) => (
                <div key={section}>
                  <Skeleton className="h-6 w-40 mb-4" />
                  <div className="border-t border-neutral-200 pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[1, 2, 3].map((card) => (
                        <div key={card} className="space-y-4">
                          <Skeleton className="aspect-video rounded-lg" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <span className="text-2xl">!</span>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Unable to load releases
              </h2>
              <p className="text-neutral-600">
                Please try refreshing the page or check back later.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && data?.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neutral-100 mb-6">
                <MateMasie className="w-10 h-10 text-neutral-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                No releases found
              </h2>
              <p className="text-neutral-600 mb-6">
                {filters.search
                  ? `No releases match "${filters.search}"`
                  : filters.category
                  ? `No releases in the ${filters.category} category`
                  : 'No releases available at this time'}
              </p>
              {(filters.search || filters.category || filters.filter !== 'all') && (
                <button
                  onClick={() => setFilters({ filter: 'all' })}
                  className="text-dna-emerald font-medium hover:underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Releases Grid - Grouped by Month */}
          {!isLoading && !error && groupedReleases.length > 0 && (
            <div className="space-y-12">
              {groupedReleases.map((group) => (
                <section key={group.month}>
                  {/* Month Header */}
                  <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                    {group.month}
                  </h2>
                  <div className="border-t border-neutral-200 pt-6">
                    {/* Release Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.releases.map((release, index) => (
                        <ReleaseCard
                          key={release.id}
                          release={{
                            ...release,
                            lifecycle_stage: release.lifecycle_stage,
                          }}
                          variant={
                            release.lifecycle_stage === 'featured' && index === 0
                              ? 'featured'
                              : release.lifecycle_stage === 'archived'
                              ? 'compact'
                              : 'standard'
                          }
                        />
                      ))}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Total Count */}
          {!isLoading && data && data.length > 0 && (
            <div className="mt-12 text-center text-sm text-neutral-500">
              Showing {data.length} releases
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ReleasesIndex;
