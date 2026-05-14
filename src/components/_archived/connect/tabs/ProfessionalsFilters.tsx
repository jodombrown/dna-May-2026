
import React from 'react';
import { Button } from '@/components/ui/button';

interface ProfessionalsFiltersProps {
  searchTerm: string;
  professionalsCount: number;
}

const ProfessionalsFilters: React.FC<ProfessionalsFiltersProps> = ({
  searchTerm,
  professionalsCount
}) => {
  return (
    <div className="flex justify-between items-center">
      <p className="text-neutral-600">
        Showing {professionalsCount} professionals {searchTerm && `matching "${searchTerm}"`}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Recent Activity</Button>
        <Button variant="outline" size="sm">Mutual Connections</Button>
        <Button variant="outline" size="sm">Location</Button>
      </div>
    </div>
  );
};

export default ProfessionalsFilters;
