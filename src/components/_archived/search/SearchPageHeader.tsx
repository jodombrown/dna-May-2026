
import React from 'react';
import { TYPOGRAPHY } from '@/lib/typography.config';

const SearchPageHeader = () => {
  return (
    <div className="mb-8">
      <h1 className={`${TYPOGRAPHY.h1} text-neutral-900 mb-2`}>
        Search Diaspora Professionals
      </h1>
      <p className={`${TYPOGRAPHY.body} text-neutral-600`}>
        Find and connect with African diaspora professionals worldwide
      </p>
    </div>
  );
};

export default SearchPageHeader;
