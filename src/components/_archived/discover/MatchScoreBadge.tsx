import { Badge } from "@/components/ui/badge";
import { MateMasie } from '@/components/icons/adinkra';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Heart, MapPin, Briefcase, Target, Globe, Star, Users } from 'lucide-react';
import { cn } from "@/lib/utils";

export interface MatchReasoning {
  shared_focus_areas?: string[];
  shared_industries?: string[];
  shared_skills?: string[];
  same_country_of_origin?: boolean;
  same_location?: boolean;
  regional_expertise_match?: boolean;
  complementary_goals?: string[];
  scores?: {
    focus_areas?: number;
    industries?: number;
    skills?: number;
    country_origin?: number;
    location?: number;
    regional?: number;
    profile_completion?: number;
  };
}

interface MatchScoreBadgeProps {
  score: number;
  size?: "default" | "sm" | "lg";
  reasoning?: MatchReasoning;
  matchReasons?: string[];
  showTooltip?: boolean;
}

export function MatchScoreBadge({ 
  score, 
  size = "default", 
  reasoning, 
  matchReasons = [],
  showTooltip = true 
}: MatchScoreBadgeProps) {
  const isHighMatch = score >= 70;
  const isLowScore = score < 20;
  const getMatchConfig = () => {
    if (score >= 85) {
      return {
        label: "Strong Match",
        className: "bg-[hsl(151,75%,45%)] text-white font-bold",
        icon: Heart,
        popoverTitle: "Excellent Match!"
      };
    }
    if (score >= 70) {
      return {
        label: "Great Match",
        className: "bg-[hsl(151,75%,50%)]/90 text-white font-semibold",
        icon: Heart,
        popoverTitle: "Great Match!"
      };
    }
    if (score >= 55) {
      return {
        label: "Good Match",
        className: "bg-[hsl(151,75%,50%)]/15 text-[hsl(151,75%,30%)] border border-[hsl(151,75%,50%)]/30 font-semibold",
        icon: null,
        popoverTitle: "Good Match"
      };
    }
    if (score >= 40) {
      return {
        label: "Potential",
        className: "bg-[hsl(18,60%,55%)]/10 text-[hsl(18,60%,35%)] border border-[hsl(18,60%,55%)]/30 font-medium",
        icon: null,
        popoverTitle: "Potential Connection"
      };
    }
    if (score >= 20) {
      return {
        label: "Explore",
        className: "bg-muted text-muted-foreground border border-border font-medium",
        icon: null,
        popoverTitle: "Worth Exploring"
      };
    }
    // Very low score - likely incomplete profile
    return {
      label: "New Member",
      className: "bg-muted/50 text-muted-foreground/70 border border-border/50 font-normal",
      icon: null,
      popoverTitle: "New to DNA"
    };
  };

  const config = getMatchConfig();

  // Get icon for each reason type
  const getReasonIcon = (reason: string) => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes('heritage') || lowerReason.includes('country')) return Globe;
    if (lowerReason.includes('location')) return MapPin;
    if (lowerReason.includes('career') || lowerReason.includes('hiring') || lowerReason.includes('job')) return Briefcase;
    if (lowerReason.includes('mentor')) return Users;
    if (lowerReason.includes('invest')) return Star;
    if (lowerReason.includes('speaks') || lowerReason.includes('language')) return Globe;
    return Target;
  };

  const badge = (
    <Badge
      className={cn(
        config.className,
        'whitespace-nowrap',
        size === 'sm' && 'text-xs px-2 py-0.5',
        size === 'lg' && 'text-sm px-3 py-1',
        isHighMatch && 'shadow-[0_4px_12px_-2px_rgba(0,0,0,0.4)] cursor-pointer',
        !isHighMatch && showTooltip && (reasoning || matchReasons.length > 0) && 'cursor-pointer'
      )}
    >
      {isHighMatch && config.icon && (
        <config.icon className="inline mr-1 h-3 w-3" />
      )}
      {/* Show percentage for meaningful scores, hide for new members */}
      {isLowScore ? config.label : `${score}% ${config.label}`}
    </Badge>
  );

  // No popover if no reasoning data
  if (!showTooltip || (!reasoning && matchReasons.length === 0)) {
    return badge;
  }

  // Combine all reasons for display
  const allReasons: { icon: typeof Target; label: string; value?: string }[] = [];
  
  // Add computed match reasons first (from MemberCard)
  matchReasons.forEach(reason => {
    allReasons.push({
      icon: getReasonIcon(reason),
      label: reason,
    });
  });

  // Add detailed reasoning if available
  if (reasoning) {
    if (reasoning.same_country_of_origin && !matchReasons.some(r => r.toLowerCase().includes('heritage'))) {
      allReasons.push({ icon: Globe, label: 'Same country of origin' });
    }
    if (reasoning.same_location && !matchReasons.some(r => r.toLowerCase().includes('location'))) {
      allReasons.push({ icon: MapPin, label: 'Same current location' });
    }
    if (reasoning.shared_focus_areas?.length && !matchReasons.some(r => reasoning.shared_focus_areas?.includes(r))) {
      allReasons.push({ icon: Target, label: `Focus: ${reasoning.shared_focus_areas.slice(0, 2).join(', ')}` });
    }
    if (reasoning.shared_industries?.length && !matchReasons.some(r => reasoning.shared_industries?.includes(r))) {
      allReasons.push({ icon: Briefcase, label: `Industry: ${reasoning.shared_industries.slice(0, 2).join(', ')}` });
    }
    if (reasoning.shared_skills?.length) {
      allReasons.push({ icon: MateMasie, label: `Skills: ${reasoning.shared_skills.slice(0, 2).join(', ')}` });
    }
    if (reasoning.regional_expertise_match) {
      allReasons.push({ icon: Globe, label: 'Regional expertise match' });
    }
    if (reasoning.complementary_goals?.length) {
      reasoning.complementary_goals.forEach(goal => {
        allReasons.push({ icon: Star, label: goal });
      });
    }
  }

  // Deduplicate and limit
  const uniqueReasons = allReasons.slice(0, 5);

  return (
    <Popover>
      <PopoverTrigger asChild>
        {badge}
      </PopoverTrigger>
      <PopoverContent 
        className="w-64 p-3" 
        side="bottom" 
        align="center"
        sideOffset={8}
      >
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              isHighMatch ? "bg-[hsl(151,75%,50%)]/20" : "bg-muted"
            )}>
              <span className={cn(
                "text-lg font-bold",
                isHighMatch ? "text-[hsl(151,75%,35%)]" : "text-muted-foreground"
              )}>
                {isLowScore ? '?' : `${score}%`}
              </span>
            </div>
            <div>
              <p className="font-semibold text-sm">
                {config.popoverTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {isLowScore ? 'Complete profile for better matches' : 'Why you might connect'}
              </p>
            </div>
          </div>
          
          {uniqueReasons.length > 0 ? (
            <div className="space-y-2">
              {uniqueReasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <reason.icon className="h-4 w-4 text-dna-copper shrink-0" />
                  <span className="text-foreground truncate">{reason.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              {isLowScore 
                ? 'Not enough profile data to calculate match' 
                : 'Based on your profile and interests'}
            </p>
          )}
          
          {isHighMatch && (
            <p className="text-xs text-center text-dna-forest font-medium pt-1 border-t border-border">
              ✨ High compatibility detected
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
