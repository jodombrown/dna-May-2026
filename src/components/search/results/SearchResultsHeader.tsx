
import React from 'react';

interface SearchResultsHeaderProps {
  professionalsCount: number;
  communitiesCount: number;
  eventsCount: number;
}

const SearchResultsHeader: React.FC<SearchResultsHeaderProps> = ({
  professionalsCount,
  communitiesCount,
  eventsCount
}) => {
  return (
    <div className="text-sm text-neutral-600 mb-4">
      Found {professionalsCount} professional{professionalsCount !== 1 ? 's' : ''}, {communitiesCount} communit{communitiesCount !== 1 ? 'ies' : 'y'}, and {eventsCount} event{eventsCount !== 1 ? 's' : ''}
    </div>
  );
};

export default SearchResultsHeader;
