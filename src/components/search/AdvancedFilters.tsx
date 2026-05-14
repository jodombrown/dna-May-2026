import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Filter, 
  MapPin, 
  Calendar as CalendarIcon, 
  Users, 
  Building2, 
  Target,
  ChevronDown,
  X,
  Briefcase,
  Globe,
  Star
} from 'lucide-react';
import { format, addDays } from 'date-fns';

export interface AdvancedSearchFilters {
  location?: {
    country?: string;
    city?: string;
    radius?: number;
  };
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  categories?: string[];
  experienceLevel?: string[];
  availability?: string[];
  languages?: string[];
  contentTypes?: string[];
  sortBy?: string;
  engagement?: string;
}

interface AdvancedFiltersProps {
  filters: AdvancedSearchFilters;
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  onClearFilters: () => void;
  resultCount?: number;
}

const CATEGORIES = [
  'Technology', 'Business', 'Finance', 'Healthcare', 'Education',
  'Agriculture', 'Energy', 'Creative', 'Policy', 'Research'
];

const EXPERIENCE_LEVELS = [
  'Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Founder'
];

const AVAILABILITY_OPTIONS = [
  'Available for Collaboration', 'Open to Mentoring', 'Seeking Investment',
  'Looking for Opportunities', 'Recently Active', 'Verified Contributors'
];

const LANGUAGES = [
  'English', 'French', 'Arabic', 'Portuguese', 'Swahili', 'Amharic', 'Yoruba', 'Igbo', 'Hausa'
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'recent', label: 'Most Recent' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'engagement', label: 'Most Engaged' }
];

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  resultCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  // Count active filters
  React.useEffect(() => {
    let count = 0;
    if (filters.location?.country) count++;
    if (filters.dateRange?.start) count++;
    if (filters.categories?.length) count++;
    if (filters.experienceLevel?.length) count++;
    if (filters.availability?.length) count++;
    if (filters.languages?.length) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const updateFilters = (newFilters: Partial<AdvancedSearchFilters>) => {
    onFiltersChange({ ...filters, ...newFilters });
  };

  const removeFilter = (filterType: keyof AdvancedSearchFilters, value?: string) => {
    const newFilters = { ...filters };
    
    if (filterType === 'categories' && value) {
      newFilters.categories = newFilters.categories?.filter(c => c !== value);
    } else if (filterType === 'experienceLevel' && value) {
      newFilters.experienceLevel = newFilters.experienceLevel?.filter(e => e !== value);
    } else if (filterType === 'availability' && value) {
      newFilters.availability = newFilters.availability?.filter(a => a !== value);
    } else if (filterType === 'languages' && value) {
      newFilters.languages = newFilters.languages?.filter(l => l !== value);
    } else {
      delete newFilters[filterType];
    }
    
    onFiltersChange(newFilters);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {resultCount > 0 && (
              <span className="text-sm text-neutral-600">
                {resultCount.toLocaleString()} results
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Active Filters Summary */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {filters.location?.country && (
              <Badge variant="outline" className="gap-1">
                <MapPin className="w-3 h-3" />
                {filters.location.country}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('location')}
                />
              </Badge>
            )}
            
            {filters.dateRange?.start && (
              <Badge variant="outline" className="gap-1">
                <CalendarIcon className="w-3 h-3" />
                {format(filters.dateRange.start, 'MMM d')}
                {filters.dateRange.end && ` - ${format(filters.dateRange.end, 'MMM d')}`}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('dateRange')}
                />
              </Badge>
            )}

            {filters.categories?.map(category => (
              <Badge key={category} variant="outline" className="gap-1">
                {category}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('categories', category)}
                />
              </Badge>
            ))}

            {filters.experienceLevel?.map(level => (
              <Badge key={level} variant="outline" className="gap-1">
                <Briefcase className="w-3 h-3" />
                {level}
                <X 
                  className="w-3 h-3 cursor-pointer hover:text-red-500" 
                  onClick={() => removeFilter('experienceLevel', level)}
                />
              </Badge>
            ))}

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearFilters}
              className="text-red-600 hover:text-red-700"
            >
              Clear all
            </Button>
          </div>
        )}
      </CardHeader>

      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Location Filters */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select 
                  value={filters.location?.country || ''} 
                  onValueChange={(value) => updateFilters({ 
                    location: { ...filters.location, country: value || undefined }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nigeria">Nigeria</SelectItem>
                    <SelectItem value="ghana">Ghana</SelectItem>
                    <SelectItem value="kenya">Kenya</SelectItem>
                    <SelectItem value="south-africa">South Africa</SelectItem>
                    <SelectItem value="egypt">Egypt</SelectItem>
                    <SelectItem value="usa">United States</SelectItem>
                    <SelectItem value="uk">United Kingdom</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                    <SelectItem value="france">France</SelectItem>
                    <SelectItem value="germany">Germany</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input 
                  placeholder="City (optional)"
                  value={filters.location?.city || ''}
                  onChange={(e) => updateFilters({ 
                    location: { ...filters.location, city: e.target.value || undefined }
                  })}
                />
              </div>
            </div>

            {/* Date Range Filters */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <CalendarIcon className="w-4 h-4" />
                Date Range (for events)
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left">
                      {filters.dateRange?.start ? format(filters.dateRange.start, 'PPP') : 'Start date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.start}
                      onSelect={(date) => updateFilters({ 
                        dateRange: { ...filters.dateRange, start: date }
                      })}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start text-left">
                      {filters.dateRange?.end ? format(filters.dateRange.end, 'PPP') : 'End date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange?.end}
                      onSelect={(date) => updateFilters({ 
                        dateRange: { ...filters.dateRange, end: date }
                      })}
                      disabled={(date) => date < (filters.dateRange?.start || new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateFilters({ 
                    dateRange: { start: new Date(), end: addDays(new Date(), 7) }
                  })}
                >
                  This Week
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => updateFilters({ 
                    dateRange: { start: new Date(), end: addDays(new Date(), 30) }
                  })}
                >
                  This Month
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-4 h-4" />
                Categories
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {CATEGORIES.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={category}
                      checked={filters.categories?.includes(category) || false}
                      onCheckedChange={(checked) => {
                        const newCategories = checked 
                          ? [...(filters.categories || []), category]
                          : filters.categories?.filter(c => c !== category) || [];
                        updateFilters({ categories: newCategories });
                      }}
                    />
                    <Label htmlFor={category} className="text-sm">
                      {category}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Briefcase className="w-4 h-4" />
                Experience Level
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {EXPERIENCE_LEVELS.map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={level}
                      checked={filters.experienceLevel?.includes(level) || false}
                      onCheckedChange={(checked) => {
                        const newLevels = checked 
                          ? [...(filters.experienceLevel || []), level]
                          : filters.experienceLevel?.filter(l => l !== level) || [];
                        updateFilters({ experienceLevel: newLevels });
                      }}
                    />
                    <Label htmlFor={level} className="text-sm">
                      {level}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Users className="w-4 h-4" />
                Availability
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {AVAILABILITY_OPTIONS.map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={option}
                      checked={filters.availability?.includes(option) || false}
                      onCheckedChange={(checked) => {
                        const newAvailability = checked 
                          ? [...(filters.availability || []), option]
                          : filters.availability?.filter(a => a !== option) || [];
                        updateFilters({ availability: newAvailability });
                      }}
                    />
                    <Label htmlFor={option} className="text-sm">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Star className="w-4 h-4" />
                Sort Results
              </Label>
              <Select 
                value={filters.sortBy || 'relevance'} 
                onValueChange={(value) => updateFilters({ sortBy: value })}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Apply/Clear Actions */}
            <div className="flex justify-between pt-4 border-t">
              <Button variant="outline" onClick={onClearFilters}>
                Clear All Filters
              </Button>
              <Button onClick={() => setIsExpanded(false)}>
                Apply Filters ({resultCount} results)
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default AdvancedFilters;