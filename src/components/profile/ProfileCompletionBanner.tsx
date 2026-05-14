import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileAccess } from '@/hooks/useProfileAccess';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { X, ArrowRight } from 'lucide-react';
import { ProfileMissingFields } from './ProfileMissingFields';
import { useNavigate } from 'react-router-dom';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileCompletionBannerProps {
  minForFull?: number; // show banner until this score
}

export const ProfileCompletionBanner: React.FC<ProfileCompletionBannerProps> = ({ minForFull = 80 }) => {
  const { user, profile } = useAuth();
  const { completenessScore } = useProfileAccess();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  
  // Ref to track if we've already initialized
  const initializedRef = useRef(false);

  const storageKey = user ? `dna_profile_banner_dismissed_${user.id}` : 'dna_profile_banner_dismissed';

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    try {
      const val = localStorage.getItem(storageKey);
      setDismissed(val === '1');
    } catch {}
  }, [storageKey]);

  const handleDismiss = useCallback(() => {
    try { localStorage.setItem(storageKey, '1'); } catch {}
    setDismissed(true);
  }, [storageKey]);

  const handleNavigate = useCallback(() => {
    navigate('/dna/profile/edit');
  }, [navigate]);

  if (!user) return null;
  if (dismissed) return null;
  if (completenessScore >= minForFull) return null;

  const pointsNeeded = minForFull - completenessScore;

  return (
    <section aria-label="Profile completion" className="mx-4 mt-3">
      <div className="rounded-lg border border-dna-copper/30 bg-gradient-to-r from-dna-copper/5 to-dna-gold/5 p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 p-2 bg-dna-copper/20 rounded-full">
            <Sankofa className="h-4 w-4 text-dna-copper" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Complete your profile</h2>
              <button aria-label="Dismiss" onClick={handleDismiss} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Add {pointsNeeded}% more to unlock all features and boost your visibility.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Progress value={completenessScore} className="flex-1 h-2" />
              <span className="text-sm font-bold text-dna-copper">{completenessScore}%</span>
            </div>
            {profile && (
              <div className="mt-3 p-2 bg-background/50 rounded">
                <ProfileMissingFields profile={profile} compact maxItems={3} />
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="bg-dna-copper hover:bg-dna-gold" onClick={handleNavigate}>
                Complete profile
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>Not now</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfileCompletionBanner;
