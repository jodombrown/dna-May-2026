import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Search, Clock, Archive, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReleaseCard } from '@/components/releases/ReleaseCard';
import { CategoryTag } from '@/components/releases/CategoryTag';
import { useReleases, groupReleasesByMonth, type ReleaseCategory, type FilterType } from '@/hooks/useReleases';
import AfricaSpinner from '@/components/ui/AfricaSpinner';
import { cn } from '@/lib/utils';
import { MateMasie } from '@/components/icons/adinkra';

const filterOptions: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <Filter className="w-4 h-4" /> },
  { value: 'featured', label: 'New (30 days)', icon: <MateMasie className="w-4 h-4" /> },
  { value: 'recent', label: 'Recent (90 days)', icon: <Clock className="w-4 h-4" /> },
  { value: 'archived', label: 'Archived', icon: <Archive className="w-4 h-4" /> },
];

const categoryOptions: ReleaseCategory[] = ['CONNECT', 'CONVENE', 'COLLABORATE', 'CONTRIBUTE', 'CONVEY', 'PLATFORM'];

const ReleasesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  
  const filterParam = (searchParams.get('filter') as FilterType) || 'all';
  const categoryParam = searchParams.get('category') as ReleaseCategory | null;

  const { data: releases = [], isLoading, error } = useReleases({
    filter: filterParam,
    category: categoryParam,
    search: searchQuery,
  });

  const groupedReleases = groupReleasesByMonth(releases);
  const monthGroups = Object.entries(groupedReleases);

  const handleFilterChange = (filter: FilterType) => {
    const newParams = new URLSearchParams(searchParams);
    if (filter === 'all') {
      newParams.delete('filter');
    } else {
      newParams.set('filter', filter);
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (category: ReleaseCategory | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set('category', category);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  return (
    <>
      <Helmet>
        <title>What's New | DNA Platform</title>
        <meta name="description" content="Keep up with the latest features, improvements, and updates to the DNA platform." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-12 overflow-hidden">
          {/* Kente pattern background */}
          <div className="absolute inset-0 opacity-[0.04]">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="kente-releases" patternUnits="userSpaceOnUse" width="20" height="20">
                  <rect width="10" height="10" fill="currentColor" className="text-dna-forest" />
                  <rect x="10" y="10" width="10" height="10" fill="currentColor" className="text-dna-forest" />
                </pattern>
              </defs>
              <rect width="100" height="100" fill="url(#kente-releases)" />
            </svg>
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                What's New
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Keep up with the latest features, improvements, and updates to the DNA platform.
              </p>

              {/* Search */}
              <div className="relative max-w-md mx-auto mb-8">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                {filterOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={filterParam === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange(option.value)}
                    className={cn(
                      'gap-2',
                      filterParam === option.value && 'bg-dna-forest hover:bg-dna-forest-light'
                    )}
                  >
                    {option.icon}
                    {option.label}
                  </Button>
                ))}
              </div>

              {/* Category filters */}
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant={!categoryParam ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => handleCategoryChange(null)}
                  className="text-xs"
                >
                  All Categories
                </Button>
                {categoryOptions.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category === categoryParam ? null : category)}
                    className={cn(
                      'transition-opacity',
                      categoryParam && categoryParam !== category && 'opacity-50 hover:opacity-100'
                    )}
                  >
                    <CategoryTag category={category} />
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Releases Grid */}
        <section className="container mx-auto px-4 pb-16">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <AfricaSpinner size="lg" showText text="Loading releases..." />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-destructive">Failed to load releases. Please try again.</p>
            </div>
          ) : monthGroups.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No releases match your filters.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchParams(new URLSearchParams());
                  setSearchQuery('');
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-12">
              {monthGroups.map(([month, monthReleases]) => (
                <div key={month}>
                  {/* Month header */}
                  <h2 className="text-sm font-bold text-muted-foreground tracking-widest mb-6 uppercase">
                    {month}
                  </h2>

                  {/* Release cards grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monthReleases.map((release, index) => (
                      <motion.div
                        key={release.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <ReleaseCard release={release} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default ReleasesPage;
