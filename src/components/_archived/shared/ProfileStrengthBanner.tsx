import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfileAccess } from '@/hooks/useProfileAccess';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProfileMissingFields } from '@/components/profile/ProfileMissingFields';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileStrengthBannerProps {
  minForFull?: number;
}

export const ProfileStrengthBanner = ({ minForFull = 40 }: ProfileStrengthBannerProps) => {
  const { user, profile } = useAuth();
  const { completenessScore } = useProfileAccess();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const storageKey = user ? `dna_profile_strength_banner_${user.id}` : 'dna_profile_strength_banner';

  useEffect(() => {
    try {
      const val = localStorage.getItem(storageKey);
      const dismissedAt = val ? parseInt(val, 10) : 0;
      // Re-show after 24 hours
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      setDismissed(dismissedAt > dayAgo);
    } catch {}
  }, [storageKey]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, Date.now().toString());
    } catch {}
    setDismissed(true);
  };

  if (!user || !profile) return null;
  if (dismissed) return null;
  if (completenessScore >= minForFull) return null;

  const pointsNeeded = minForFull - completenessScore;

  return (
    <div className="p-4 bg-gradient-to-r from-dna-copper/10 via-dna-gold/5 to-dna-emerald/10 border border-dna-copper/30 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-2 bg-dna-copper/20 rounded-full">
          <Sankofa className="h-4 w-4 text-dna-copper" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-sm">Boost Your Visibility</h3>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Add {pointsNeeded}% more to appear in member discovery and unlock all DNA features.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <Progress value={completenessScore} className="flex-1 h-2" />
            <span className="text-sm font-bold text-dna-copper">{completenessScore}%</span>
          </div>
          <div className="mb-3 p-2 bg-background/50 rounded">
            <ProfileMissingFields profile={profile} compact maxItems={3} />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => navigate('/dna/profile/edit')}
              className="bg-dna-copper hover:bg-dna-gold"
            >
              Complete Profile
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
