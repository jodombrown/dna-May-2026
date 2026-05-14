
import React from 'react';
import { Badge } from '@/components/ui/badge';
import UnifiedHeader from '@/components/UnifiedHeader';
import { TYPOGRAPHY } from '@/lib/typography.config';

interface ConnectPageHeaderProps {
  totalCount: number;
}

const ConnectPageHeader: React.FC<ConnectPageHeaderProps> = ({ totalCount }) => {
  return (
    <div className="bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-3">
            <div>
              <h1 className={`${TYPOGRAPHY.h3} text-neutral-900`}>Professional Network</h1>
              <p className={`${TYPOGRAPHY.bodySmall} text-neutral-600 hidden sm:block`}>Connect with diaspora professionals</p>
            </div>
          </div>
          <Badge variant="default" className="bg-dna-emerald text-white min-h-[32px]">
            {totalCount}+ Members
          </Badge>
        </div>
      </div>
    </div>
  );
};

export default ConnectPageHeader;
