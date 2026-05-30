import React from 'react';
import { CheckCircle2, Circle, Camera, User, Briefcase, MapPin, Globe, Heart, Languages, Linkedin, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProfileFieldChecks } from '@/lib/profileCompletion';

// Re-export from pure utility for backward compatibility
export { 
  getProfileFieldChecks, 
  getMissingFields, 
  getCompletedFields, 
  getCompletionByPillar,
  calculateProfileCompletionPts 
} from '@/lib/profileCompletion';
export type { ProfileFieldCheck } from '@/lib/profileCompletion';

interface ProfileMissingFieldsProps {
  profile: any;
  compact?: boolean;
  maxItems?: number;
}

// Icon mapping for field types
const getFieldIcon = (field: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    avatar_url: <Camera className="h-4 w-4" />,
    full_name: <User className="h-4 w-4" />,
    headline: <Briefcase className="h-4 w-4" />,
    profession: <Briefcase className="h-4 w-4" />,
    bio: <User className="h-4 w-4" />,
    linkedin_url: <Linkedin className="h-4 w-4" />,
    skills: <Heart className="h-4 w-4" />,
    focus_areas: <Globe className="h-4 w-4" />,
    interests: <Heart className="h-4 w-4" />,
    primary_origin_country: <Globe className="h-4 w-4" />,
    current_country: <MapPin className="h-4 w-4" />,
    languages: <Languages className="h-4 w-4" />,
    banner_url: <Image className="h-4 w-4" />,
    industries: <Briefcase className="h-4 w-4" />,
  };
  return iconMap[field] || <Circle className="h-4 w-4" />;
};

export const ProfileMissingFields: React.FC<ProfileMissingFieldsProps> = ({
  profile,
  compact = false,
  maxItems = 5,
}) => {
  const fields = getProfileFieldChecks(profile);
  const missingFields = fields.filter(f => !f.complete);
  // Sort: incomplete first, then by priority, then by points
  const sortedFields = [...fields].sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? 1 : -1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.points - a.points;
  });
  const displayFields = compact ? sortedFields.filter(f => !f.complete).slice(0, maxItems) : sortedFields;

  if (compact && missingFields.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span>Profile complete!</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayFields.map((field) => (
        <div
          key={field.field}
          className={cn(
            'flex items-center gap-3 text-sm',
            field.complete ? 'text-muted-foreground' : 'text-foreground'
          )}
        >
          <div className={cn(
            'flex-shrink-0',
            field.complete ? 'text-green-500' : 'text-muted-foreground'
          )}>
            {field.complete ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              getFieldIcon(field.field)
            )}
          </div>
          <span className={cn(
            'flex-1',
            field.complete && 'line-through opacity-60'
          )}>
            {field.label}
          </span>
          {!field.complete && (
            <span className="text-xs text-dna-copper font-semibold bg-dna-copper/10 px-2 py-0.5 rounded-full">
              +{field.points} pts
            </span>
          )}
        </div>
      ))}
      {compact && missingFields.length > maxItems && (
        <p className="text-xs text-muted-foreground pl-7">
          +{missingFields.length - maxItems} more fields to complete
        </p>
      )}
    </div>
  );
};

export default ProfileMissingFields;
