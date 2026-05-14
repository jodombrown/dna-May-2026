import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import LocationTypeahead from '@/components/location/LocationTypeahead';
import { Filter, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const SKILL_OPTIONS = [
  'Technology', 'Finance', 'Healthcare', 'Agriculture', 'Education',
  'Energy', 'Creative', 'Marketing', 'Consulting', 'Legal'
];

interface AdvancedFiltersProps {
  filters: {
    location: string;
    skills: string[];
    isMentor: boolean;
    isInvestor: boolean;
    lookingForOpportunities: boolean;
  };
  onFiltersChange: (filters: any) => void;
  activeFilterCount: number;
}

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  activeFilterCount
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(true);
  const [statusOpen, setStatusOpen] = useState(true);
  const [locationOpen, setLocationOpen] = useState(true);

  const updateFilters = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleSkill = (skill: string) => {
    const currentSkills = filters.skills || [];
    const updatedSkills = currentSkills.includes(skill)
      ? currentSkills.filter(s => s !== skill)
      : [...currentSkills, skill];
    updateFilters('skills', updatedSkills);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      location: '',
      skills: [],
      isMentor: false,
      isInvestor: false,
      lookingForOpportunities: false
    });
  };

  const hasActiveFilters = filters.location || 
    filters.skills.length > 0 || 
    filters.isMentor || 
    filters.isInvestor || 
    filters.lookingForOpportunities;

  const handleDone = () => {
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative h-12 px-6 text-base">
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-neutral-700 text-white text-xs min-w-5 h-5 flex items-center justify-center p-0">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[90vw] max-w-sm overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Advanced Filters</SheetTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="w-fit">
              Clear All Filters
            </Button>
          )}
        </SheetHeader>

        <div className="space-y-6">
          {/* Location Filter */}
          <div>
            <button
              onClick={() => setLocationOpen(!locationOpen)}
              className="flex items-center justify-between w-full text-sm font-medium mb-3 text-neutral-900 hover:text-neutral-700 transition-colors"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </span>
              {locationOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {locationOpen && (
              <div className="space-y-3">
                {/* Current Selection */}
                {filters.location && (
                  <div className="p-2 bg-neutral-100 rounded-lg border">
                    <span className="text-sm text-neutral-700 font-medium">
                      Selected: {filters.location}
                    </span>
                    <button
                      onClick={() => updateFilters('location', '')}
                      className="ml-2 text-xs text-neutral-500 hover:text-neutral-700 underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
                
                {/* Global Location Search */}
                <LocationTypeahead
                  value={filters.location}
                  onChange={(location) => updateFilters('location', location)}
                  placeholder="Search any location worldwide..."
                />
              </div>
            )}
          </div>

          {/* Skills Filter */}
          <div>
            <button
              onClick={() => setSkillsOpen(!skillsOpen)}
              className="flex items-center justify-between w-full text-sm font-medium mb-3 text-neutral-900 hover:text-neutral-700 transition-colors"
            >
              <span>Skills</span>
              {skillsOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {skillsOpen && (
              <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto border rounded-lg p-3 bg-neutral-50">
                {SKILL_OPTIONS.map(skill => (
                  <div key={skill} className="flex items-center space-x-3 py-1">
                    <Checkbox
                      id={skill}
                      checked={filters.skills?.includes(skill) || false}
                      onCheckedChange={() => toggleSkill(skill)}
                    />
                    <label 
                      htmlFor={skill} 
                      className="text-sm cursor-pointer text-neutral-700 flex-1"
                    >
                      {skill}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Professional Filters */}
          <div>
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center justify-between w-full text-sm font-medium mb-3 text-neutral-900 hover:text-neutral-700 transition-colors"
            >
              <span>Professional Status</span>
              {statusOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            {statusOpen && (
              <div className="space-y-3 border rounded-lg p-3 bg-neutral-50">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="mentor"
                    checked={filters.isMentor || false}
                    onCheckedChange={(checked) => updateFilters('isMentor', checked)}
                  />
                  <label htmlFor="mentor" className="text-sm cursor-pointer text-neutral-700">
                    Available as Mentor
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="investor"
                    checked={filters.isInvestor || false}
                    onCheckedChange={(checked) => updateFilters('isInvestor', checked)}
                  />
                  <label htmlFor="investor" className="text-sm cursor-pointer text-neutral-700">
                    Active Investor
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="opportunities"
                    checked={filters.lookingForOpportunities || false}
                    onCheckedChange={(checked) => updateFilters('lookingForOpportunities', checked)}
                  />
                  <label htmlFor="opportunities" className="text-sm cursor-pointer text-neutral-700">
                    Open to Opportunities
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-8 pt-6 border-t">
          <Button 
            onClick={handleDone} 
            className="w-full bg-neutral-900 hover:bg-neutral-800 text-white h-12 text-base"
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFilters;