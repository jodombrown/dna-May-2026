
import React from 'react';
import { Badge } from '@/components/ui/badge';
import UnifiedHeader from '@/components/UnifiedHeader';

const ContributePageHeader: React.FC = () => {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-neutral-900">Contribute to Africa</h1>
              <p className="text-xs sm:text-sm text-neutral-600 hidden sm:block">Make a lasting impact</p>
            </div>
          </div>
          <Badge className="bg-dna-gold text-white text-xs sm:text-sm">
            $2.1M+ Raised
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ContributePageHeader;
