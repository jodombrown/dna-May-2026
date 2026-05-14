/**
 * ReleaseFilters Component
 * Filter controls for releases page
 */

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { CategoryButton } from './CategoryTag';
import type {
  ReleaseFiltersProps,
  ReleaseFilterType,
  ReleaseCategory,
  ReleaseFilters as FiltersType,
} from '@/types/releases';

const FILTER_TABS: { value: ReleaseFilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'featured', label: 'New (30d)' },
  { value: 'recent', label: 'Recent (90d)' },
  { value: 'archived', label: 'Archived' },
];

const CATEGORIES: ReleaseCategory[] = [
  'CONNECT',
  'CONVENE',
  'COLLABORATE',
  'CONTRIBUTE',
  'CONVEY',
  'PLATFORM',
];

export const ReleaseFilters: React.FC<ReleaseFiltersProps> = ({
  filters,
  onFiltersChange,
  className,
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleFilterChange = (filter: ReleaseFilterType) => {
    onFiltersChange({ ...filters, filter });
  };

  const handleCategoryChange = (category: ReleaseCategory | undefined) => {
    onFiltersChange({ ...filters, category });
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    // Debounced search - only update after typing stops
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: value || undefined });
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onFiltersChange({ ...filters, search: undefined });
  };

  const activeCategory = filters.category;
  const activeFilter = filters.filter || 'all';

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search and Filter Tabs */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search releases..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleFilterChange(tab.value)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
                activeFilter === tab.value
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-600 hover:text-neutral-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-neutral-600 mr-2">Category:</span>

        {/* All categories button */}
        <button
          onClick={() => handleCategoryChange(undefined)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-full transition-all',
            !activeCategory
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
          )}
        >
          All
        </button>

        {/* Category buttons */}
        {CATEGORIES.map((category) => (
          <CategoryButton
            key={category}
            category={category}
            isActive={activeCategory === category}
            onClick={() =>
              handleCategoryChange(
                activeCategory === category ? undefined : category
              )
            }
          />
        ))}
      </div>
    </div>
  );
};

/**
 * ReleaseFiltersCompact - Simpler filter UI for smaller screens
 */
export const ReleaseFiltersCompact: React.FC<ReleaseFiltersProps> = ({
  filters,
  onFiltersChange,
  className,
}) => {
  const activeFilter = filters.filter || 'all';

  const handleFilterChange = (filter: ReleaseFilterType) => {
    onFiltersChange({ ...filters, filter });
  };

  return (
    <div className={cn('flex items-center gap-1 p-1 bg-neutral-100 rounded-lg overflow-x-auto', className)}>
      {FILTER_TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => handleFilterChange(tab.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap',
            activeFilter === tab.value
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-600 hover:text-neutral-900'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ReleaseFilters;
