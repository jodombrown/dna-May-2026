import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileAccess } from '@/hooks/useProfileAccess';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight } from 'lucide-react';
import { ProfileMissingFields, getMissingFields } from './ProfileMissingFields';
import { cn } from '@/lib/utils';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileCompletionNudgeProps {
  variant?: 'banner' | 'card' | 'compact' | 'inline';
  threshold?: number; // Show nudge when below this percentage
  dismissible?: boolean;
  showMissingFields?: boolean;
  className?: string;
}

export const ProfileCompletionNudge: React.FC<ProfileCompletionNudgeProps> = ({
  variant = 'card',
  threshold = 40,
  dismissible = true,
  showMissingFields = true,
  className,
}) => {
  const { user, profile } = useAuth();
  const { completenessScore } = useProfileAccess();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const storageKey = user ? `dna_profile_nudge_${variant}_${user.id}` : `dna_profile_nudge_${variant}`;

  useEffect(() => {
    if (dismissible) {
      try {
        const val = localStorage.getItem(storageKey);
        const dismissedAt = val ? parseInt(val, 10) : 0;
        // Re-show after 24 hours
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        setDismissed(dismissedAt > dayAgo);
      } catch {}
    }
  }, [storageKey, dismissible]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, Date.now().toString());
    } catch {}
    setDismissed(true);
  };

  if (!user || !profile) return null;
  if (dismissed) return null;
  if (completenessScore >= threshold) return null;

  const missingFields = getMissingFields(profile);
  const pointsToUnlock = threshold - completenessScore;
  const topMissingField = missingFields[0];

  // Inline variant - single line nudge
  if (variant === 'inline') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 bg-dna-copper/10 border border-dna-copper/20 rounded-lg text-sm',
        className
      )}>
        <Sankofa className="h-4 w-4 text-dna-copper flex-shrink-0" />
        <span className="flex-1">
          <span className="font-medium">{completenessScore}% complete</span>
          {topMissingField && (
            <span className="text-muted-foreground"> - Add {topMissingField.label.toLowerCase()} to boost visibility</span>
          )}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-dna-copper hover:text-dna-gold"
          onClick={() => navigate('/dna/profile/edit')}
        >
          Complete
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
        {dismissible && (
          <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Compact variant - small card
  if (variant === 'compact') {
    return (
      <div className={cn(
        'p-3 bg-gradient-to-r from-dna-copper/10 to-dna-gold/10 border border-dna-copper/20 rounded-lg',
        className
      )}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sankofa className="h-4 w-4 text-dna-copper" />
            <span className="text-sm font-semibold">{completenessScore}% Profile Strength</span>
          </div>
          {dismissible && (
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Progress value={completenessScore} className="h-2 mb-2" />
        <p className="text-xs text-muted-foreground mb-2">
          Add {pointsToUnlock}% more to unlock discovery features
        </p>
        {showMissingFields && (
          <div className="mb-3">
            <ProfileMissingFields profile={profile} compact maxItems={3} />
          </div>
        )}
        <Button
          size="sm"
          className="w-full bg-dna-copper hover:bg-dna-gold"
          onClick={() => navigate('/dna/profile/edit')}
        >
          Complete Profile
        </Button>
      </div>
    );
  }

  // Banner variant - full width alert style
  if (variant === 'banner') {
    return (
      <div className={cn(
        'p-4 bg-gradient-to-r from-dna-copper/10 via-dna-gold/5 to-dna-emerald/10 border border-dna-copper/30 rounded-lg',
        className
      )}>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 p-2 bg-dna-copper/20 rounded-full">
            <Sankofa className="h-5 w-5 text-dna-copper" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Boost Your Visibility</h3>
              {dismissible && (
                <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Complete your profile to {threshold}% to appear in member discovery and unlock all DNA features.
            </p>
            <div className="flex items-center gap-3 mb-3">
              <Progress value={completenessScore} className="flex-1 h-2" />
              <span className="text-sm font-bold text-dna-copper">{completenessScore}%</span>
            </div>
            {showMissingFields && missingFields.length > 0 && (
              <div className="mb-3 p-3 bg-background/50 rounded-md">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Quick wins:</p>
                <ProfileMissingFields profile={profile} compact maxItems={3} />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                className="bg-dna-copper hover:bg-dna-gold"
                onClick={() => navigate('/dna/profile/edit')}
              >
                Complete Profile
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              {dismissible && (
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Remind me later
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="h-1 bg-gradient-to-r from-dna-copper via-dna-gold to-dna-emerald" />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-dna-copper/20 rounded-full">
              <Sankofa className="h-4 w-4 text-dna-copper" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Profile Strength</h3>
              <p className="text-xs text-muted-foreground">{pointsToUnlock}% to unlock discovery</p>
            </div>
          </div>
          {dismissible && (
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <Progress value={completenessScore} className="flex-1 h-2.5" />
          <span className="text-lg font-bold text-dna-copper">{completenessScore}%</span>
        </div>

        {showMissingFields && missingFields.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
              What's missing
            </p>
            <ProfileMissingFields profile={profile} compact maxItems={4} />
          </div>
        )}

        <Button
          className="w-full bg-dna-copper hover:bg-dna-gold"
          onClick={() => navigate('/dna/profile/edit')}
        >
          Complete Your Profile
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionNudge;
