/**
 * ProfileV2StatusCard - Consolidated Profile Status
 * Merges Profile Strength + Verification into a single command center card
 * with progress visualization and quick action buttons.
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Settings, Eye, Pencil, BadgeCheck, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateProfileCompletionPts } from '@/lib/profileCompletion';
import { cn } from '@/lib/utils';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileV2StatusCardProps {
  profile: any;
  verificationTier: 'pending' | 'soft' | 'full';
  username?: string;
}

const ProfileV2StatusCard: React.FC<ProfileV2StatusCardProps> = ({
  profile,
  verificationTier,
  username,
}) => {
  const navigate = useNavigate();
  const score = calculateProfileCompletionPts(profile);

  // Status configuration based on verification tier
  const getStatusConfig = () => {
    if (verificationTier === 'full') {
      return {
        icon: Award,
        label: 'Fully Verified',
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/30',
      };
    }
    if (verificationTier === 'soft') {
      return {
        icon: BadgeCheck,
        label: 'Verified',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/30',
      };
    }
    return {
      icon: Sankofa,
      label: 'Building',
      color: 'text-muted-foreground',
      bgColor: 'bg-secondary',
      borderColor: 'border-border',
    };
  };

  const config = getStatusConfig();
  const StatusIcon = config.icon;
  const isComplete = score >= 100;

  // Progress color based on score
  const getProgressColor = () => {
    if (score >= 100) return 'bg-primary';
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-orange-500';
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all duration-300",
      config.borderColor,
      "border"
    )}>
      <CardContent className="p-4 sm:p-5">
        {/* Top Row: Status Badge + Score */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              config.bgColor
            )}>
              <StatusIcon className={cn("w-4 h-4", config.color)} />
            </div>
            <div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium",
                  config.bgColor,
                  config.color,
                  "border-0"
                )}
              >
                {config.label}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <span className={cn(
              "text-xl font-bold",
              isComplete ? "text-primary" : "text-foreground"
            )}>
              {score}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <Progress 
            value={score} 
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            {isComplete 
              ? '✨ Profile complete. Fully discoverable'
              : `${100 - score} pts to unlock full discoverability`
            }
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium flex items-center justify-center gap-1.5"
            onClick={() => navigate('/dna/profile/edit')}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium flex items-center justify-center gap-1.5"
            onClick={() => username && navigate(`/dna/u/${username}`)}
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs font-medium flex items-center justify-center gap-1.5"
            onClick={() => navigate('/dna/settings')}
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileV2StatusCard;
