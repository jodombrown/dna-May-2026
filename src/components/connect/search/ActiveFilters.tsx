import React from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface ActiveFiltersProps {
  filters: {
    location: string;
    skills: string[];
    isMentor: boolean;
    isInvestor: boolean;
    lookingForOpportunities: boolean;
  };
  onFiltersChange: (filters: any) => void;
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const updateFilters = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleSkill = (skill: string) => {
    const currentSkills = filters.skills || [];
    const updatedSkills = currentSkills.filter(s => s !== skill);
    updateFilters('skills', updatedSkills);
  };

  const hasActiveFilters = filters.location || 
    filters.skills.length > 0 || 
    filters.isMentor || 
    filters.isInvestor || 
    filters.lookingForOpportunities;

  if (!hasActiveFilters) return null;

  return (
    <div className="flex flex-wrap gap-2 max-w-4xl mx-auto">
      <span className="text-sm text-neutral-600">Active filters:</span>
      {filters.location && (
        <Badge variant="secondary" className="flex items-center gap-1">
          📍 {filters.location}
          <button onClick={() => updateFilters('location', '')}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      {filters.skills?.map(skill => (
        <Badge key={skill} variant="secondary" className="flex items-center gap-1">
          {skill}
          <button onClick={() => toggleSkill(skill)}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      {filters.isMentor && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Mentor
          <button onClick={() => updateFilters('isMentor', false)}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      {filters.isInvestor && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Investor
          <button onClick={() => updateFilters('isInvestor', false)}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
      {filters.lookingForOpportunities && (
        <Badge variant="secondary" className="flex items-center gap-1">
          Open to Opportunities
          <button onClick={() => updateFilters('lookingForOpportunities', false)}>
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}
    </div>
  );
};

export default ActiveFilters;