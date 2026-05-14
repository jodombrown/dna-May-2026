import React from 'react';

interface SearchResultsSummaryProps {
  searchTerm: string;
  hasActiveFilters: boolean;
  resultCounts: {
    professionals: number;
    communities: number;
    events: number;
  };
}

const SearchResultsSummary: React.FC<SearchResultsSummaryProps> = ({
  searchTerm,
  hasActiveFilters,
  resultCounts
}) => {
  if (!searchTerm && !hasActiveFilters) return null;

  return (
    <div className="text-center text-sm text-neutral-600 max-w-4xl mx-auto">
      {searchTerm && (
        <span>
          Showing results for "<strong>{searchTerm}</strong>"
          {hasActiveFilters && " with filters applied"}
        </span>
      )}
      {!searchTerm && hasActiveFilters && (
        <span>Showing filtered results</span>
      )}
      <div className="mt-1">
        <span className="text-dna-emerald font-medium">
          {resultCounts.professionals} professionals
        </span>
        <span className="mx-2">•</span>
        <span className="text-dna-copper font-medium">
          {resultCounts.communities} communities
        </span>
        <span className="mx-2">•</span>
        <span className="text-dna-gold font-medium">
          {resultCounts.events} events
        </span>
      </div>
    </div>
  );
};

export default SearchResultsSummary;