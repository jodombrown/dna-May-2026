/**
 * Archived Features Index Page
 * Historical feature repository listing
 * Route: /features/archived
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Archive, ArrowLeft, Search } from 'lucide-react';
import { useReleases } from '@/hooks/useReleases';
import { ReleaseCard } from '@/components/releases';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useState, useMemo } from 'react';

const ArchivedFeaturesIndex: React.FC = () => {
  const { data: releases, isLoading, error } = useReleases({ filter: 'archived' });
  const [searchQuery, setSearchQuery] = useState('');

  // Filter releases by search query
  const filteredReleases = useMemo(() => {
    if (!releases) return [];
    if (!searchQuery.trim()) return releases;

    const query = searchQuery.toLowerCase();
    return releases.filter(
      (release) =>
        release.title.toLowerCase().includes(query) ||
        release.subtitle?.toLowerCase().includes(query) ||
        release.description.toLowerCase().includes(query) ||
        release.category.toLowerCase().includes(query)
    );
  }, [releases, searchQuery]);

  return (
    <>
      <Helmet>
        <title>Archived Features | DNA Platform</title>
        <meta
          name="description"
          content="Browse the historical archive of DNA platform features and updates. Reference documentation for past releases."
        />
      </Helmet>

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <div className="bg-white border-b border-neutral-200">
          <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              to="/releases"
              className="inline-flex items-center gap-2 py-4 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to What&apos;s New
            </Link>
          </div>
        </div>

        <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Page Header */}
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                <Archive className="w-6 h-6 text-neutral-600" />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-neutral-900">
                  Archived Features
                </h1>
                <p className="text-neutral-600">
                  Historical record of platform updates
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md mt-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search archived features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </header>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-neutral-600">
                Unable to load archived features. Please try again later.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && filteredReleases.length === 0 && (
            <div className="text-center py-16">
              <Archive className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                {searchQuery ? 'No matches found' : 'No archived features'}
              </h2>
              <p className="text-neutral-600">
                {searchQuery
                  ? `No archived features match "${searchQuery}"`
                  : 'Features older than 90 days will appear here'}
              </p>
            </div>
          )}

          {/* Archived Releases List */}
          {!isLoading && !error && filteredReleases.length > 0 && (
            <>
              <div className="text-sm text-neutral-500 mb-4">
                {filteredReleases.length} archived{' '}
                {filteredReleases.length === 1 ? 'feature' : 'features'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReleases.map((release) => (
                  <ReleaseCard
                    key={release.id}
                    release={{
                      ...release,
                      lifecycle_stage: 'archived',
                    }}
                    variant="compact"
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ArchivedFeaturesIndex;
