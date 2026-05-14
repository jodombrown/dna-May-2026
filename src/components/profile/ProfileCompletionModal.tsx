import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ProfileMissingFields } from './ProfileMissingFields';
import { useAuth } from '@/contexts/AuthContext';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentScore: number;
  requiredScore: number;
  featureName: string;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  currentScore,
  requiredScore,
  featureName,
}) => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const handleCompleteProfile = () => {
    onClose();
    navigate('/dna/profile/edit');
  };

  const pointsNeeded = requiredScore - currentScore;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sankofa className="h-5 w-5 text-dna-copper" />
            Unlock {featureName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dna-copper/20 text-dna-copper text-sm font-medium">
              <Sankofa className="h-4 w-4" />
              {pointsNeeded}% to unlock
            </div>
            <p className="text-muted-foreground">
              Complete your profile to <strong>{requiredScore}%</strong> to access <strong>{featureName}</strong> and boost your visibility.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Profile Strength</span>
              <span className="font-bold text-dna-copper">{currentScore}%</span>
            </div>
            <Progress value={currentScore} className="h-2.5" />
          </div>

          {profile && (
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                What's missing
              </p>
              <ProfileMissingFields profile={profile} compact maxItems={4} />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleCompleteProfile} className="flex-1 bg-dna-copper hover:bg-dna-gold">
              Complete Profile
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};