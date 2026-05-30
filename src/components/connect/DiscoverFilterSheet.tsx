import React, { useState, useEffect } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import CountryCombobox from '@/components/ui/country-combobox';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FilterState {
  primary_origin_country?: string;
  current_country?: string;
  focus_areas?: string[];
  regional_expertise?: string[];
  industries?: string[];
  skills?: string[];
}

interface DiscoverFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
}

const FOCUS_AREAS = [
  'Agriculture & Food Systems',
  'Technology & Innovation',
  'Healthcare & Wellness',
  'Education & Training',
  'Finance & Investment',
  'Arts & Culture',
  'Policy & Governance',
  'Infrastructure & Energy',
  'Trade & Commerce',
  'Environment & Climate',
];

const INDUSTRIES = [
  'Agriculture',
  'Technology',
  'Healthcare',
  'Education',
  'Finance',
  'Manufacturing',
  'Retail',
  'Energy',
  'Real Estate',
  'Creative Industries',
];

const SKILLS = [
  'Leadership',
  'Project Management',
  'Software Development',
  'Marketing',
  'Sales',
  'Design',
  'Data Analysis',
  'Strategy',
  'Operations',
  'Research',
];

// CRITICAL: Values must match EXACTLY what's stored in profiles.regional_expertise
const REGIONAL_EXPERTISE = [
  'West Africa',
  'East Africa',
  'Southern Africa',
  'Central Africa',
  'North Africa',
  'African Diaspora',
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full py-2 text-sm font-medium">
          <span>{title}</span>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  );
};

export const DiscoverFilterSheet: React.FC<DiscoverFilterSheetProps> = ({
  open,
  onOpenChange,
  filters,
  onApply,
  onClear,
}) => {
  // Internal state for pending changes
  const [pendingFilters, setPendingFilters] = useState<FilterState>(filters);

  // Sync when external filters change or drawer opens
  useEffect(() => {
    if (open) {
      setPendingFilters(filters);
    }
  }, [filters, open]);

  const toggleArrayFilter = (
    key: 'focus_areas' | 'regional_expertise' | 'industries' | 'skills',
    value: string
  ) => {
    const current = pendingFilters[key] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];

    setPendingFilters({
      ...pendingFilters,
      [key]: updated.length > 0 ? updated : undefined,
    });
  };

  const handleApply = () => {
    onApply(pendingFilters);
    onOpenChange(false);
  };

  const handleClear = () => {
    setPendingFilters({});
    onClear();
    onOpenChange(false);
  };

  const countActiveFilters = (f: FilterState) => {
    let count = 0;
    if (f.primary_origin_country) count++;
    if (f.current_country) count++;
    if (f.focus_areas?.length) count += f.focus_areas.length;
    if (f.regional_expertise?.length) count += f.regional_expertise.length;
    if (f.industries?.length) count += f.industries.length;
    if (f.skills?.length) count += f.skills.length;
    return count;
  };

  const activeCount = countActiveFilters(pendingFilters);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b">
          <div className="flex items-center justify-between">
            <DrawerTitle>
              Filters
              {activeCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeCount}
                </Badge>
              )}
            </DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Location Filters */}
          <FilterSection title="Location">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Country of Origin
                </Label>
                <CountryCombobox
                  value={pendingFilters.primary_origin_country ?? ''}
                  onValueChange={(value) =>
                    setPendingFilters({
                      ...pendingFilters,
                      primary_origin_country: value || undefined,
                    })
                  }
                  placeholder="Any country"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Current Location
                </Label>
                <CountryCombobox
                  value={pendingFilters.current_country ?? ''}
                  onValueChange={(value) =>
                    setPendingFilters({
                      ...pendingFilters,
                      current_country: value || undefined,
                    })
                  }
                  placeholder="Any country"
                />
              </div>
            </div>
          </FilterSection>

          {/* Regional Expertise */}
          <FilterSection title="Regional Expertise" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-1.5">
              {REGIONAL_EXPERTISE.map((region) => (
                <Badge
                  key={region}
                  variant={
                    pendingFilters.regional_expertise?.includes(region)
                      ? 'default'
                      : 'outline'
                  }
                  className={cn(
                    'cursor-pointer justify-start py-1.5 text-xs font-normal',
                    'transition-all duration-150 active:scale-95',
                    pendingFilters.regional_expertise?.includes(region) &&
                      'pr-2'
                  )}
                  onClick={() => toggleArrayFilter('regional_expertise', region)}
                >
                  <span className="truncate">{region}</span>
                  {pendingFilters.regional_expertise?.includes(region) && (
                    <X className="ml-auto h-3 w-3 shrink-0" />
                  )}
                </Badge>
              ))}
            </div>
          </FilterSection>

          {/* Focus Areas */}
          <FilterSection title="Focus Areas">
            <div className="grid grid-cols-2 gap-1.5">
              {FOCUS_AREAS.map((area) => (
                <Badge
                  key={area}
                  variant={
                    pendingFilters.focus_areas?.includes(area)
                      ? 'default'
                      : 'outline'
                  }
                  className={cn(
                    'cursor-pointer justify-start py-1.5 text-xs font-normal',
                    'transition-all duration-150 active:scale-95',
                    pendingFilters.focus_areas?.includes(area) && 'pr-2'
                  )}
                  onClick={() => toggleArrayFilter('focus_areas', area)}
                >
                  <span className="truncate">{area}</span>
                  {pendingFilters.focus_areas?.includes(area) && (
                    <X className="ml-auto h-3 w-3 shrink-0" />
                  )}
                </Badge>
              ))}
            </div>
          </FilterSection>

          {/* Industries */}
          <FilterSection title="Industries" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-1.5">
              {INDUSTRIES.map((industry) => (
                <Badge
                  key={industry}
                  variant={
                    pendingFilters.industries?.includes(industry)
                      ? 'default'
                      : 'outline'
                  }
                  className={cn(
                    'cursor-pointer justify-start py-1.5 text-xs font-normal',
                    'transition-all duration-150 active:scale-95',
                    pendingFilters.industries?.includes(industry) && 'pr-2'
                  )}
                  onClick={() => toggleArrayFilter('industries', industry)}
                >
                  <span className="truncate">{industry}</span>
                  {pendingFilters.industries?.includes(industry) && (
                    <X className="ml-auto h-3 w-3 shrink-0" />
                  )}
                </Badge>
              ))}
            </div>
          </FilterSection>

          {/* Skills */}
          <FilterSection title="Skills" defaultOpen={false}>
            <div className="grid grid-cols-2 gap-1.5">
              {SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant={
                    pendingFilters.skills?.includes(skill) ? 'default' : 'outline'
                  }
                  className={cn(
                    'cursor-pointer justify-start py-1.5 text-xs font-normal',
                    'transition-all duration-150 active:scale-95',
                    pendingFilters.skills?.includes(skill) && 'pr-2'
                  )}
                  onClick={() => toggleArrayFilter('skills', skill)}
                >
                  <span className="truncate">{skill}</span>
                  {pendingFilters.skills?.includes(skill) && (
                    <X className="ml-auto h-3 w-3 shrink-0" />
                  )}
                </Badge>
              ))}
            </div>
          </FilterSection>
        </div>

        <DrawerFooter className="border-t">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleClear}
              className="flex-1"
              disabled={activeCount === 0}
            >
              Clear All
            </Button>
            <Button onClick={handleApply} className="flex-1">
              Apply{activeCount > 0 && ` (${activeCount})`}
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
