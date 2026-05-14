
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const SearchResultsEmpty: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6 text-center">
        <div className="text-neutral-500">
          <p className="text-lg font-medium mb-2">No results found</p>
          <p>Try adjusting your search criteria or filters</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SearchResultsEmpty;
