
import React from 'react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  type: 'professionals' | 'communities' | 'events';
  onRefresh: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onRefresh }) => (
  <div className="text-center py-12">
    <p className="text-neutral-500 text-lg">No {type} found.</p>
    <div className="mt-4 flex justify-center gap-2 flex-wrap">
      <span className="text-sm text-neutral-500">Try preset:</span>
      <span className="px-3 py-1.5 rounded-full border border-dna-emerald/30 text-dna-emerald text-sm">FinTech in Lagos</span>
      <span className="px-3 py-1.5 rounded-full border border-dna-emerald/30 text-dna-emerald text-sm">Climate in Nairobi</span>
      <span className="px-3 py-1.5 rounded-full border border-dna-emerald/30 text-dna-emerald text-sm">AI in Accra</span>
    </div>
    <Button 
      onClick={onRefresh}
      className="mt-6 bg-dna-emerald hover:bg-dna-forest text-white"
    >
      Refresh Data
    </Button>
  </div>
);

export default EmptyState;
