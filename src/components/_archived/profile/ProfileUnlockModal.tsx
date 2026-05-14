import React from 'react';
import { Sankofa } from '@/components/icons/adinkra';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Users, Calendar, Briefcase, Gift } from 'lucide-react';

interface ProfileUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  completionScore: number;
}

export const ProfileUnlockModal: React.FC<ProfileUnlockModalProps> = ({
  isOpen,
  onClose,
  completionScore,
}) => {
  const benefits = [
    {
      icon: Users,
      title: 'Discoverable Profile',
      description: 'You now appear in member discovery and search results',
    },
    {
      icon: Calendar,
      title: 'Create Events',
      description: 'Host events and gatherings for the DNA community',
    },
    {
      icon: Briefcase,
      title: 'Create Projects',
      description: 'Launch collaboration spaces and recruit team members',
    },
    {
      icon: Gift,
      title: 'Apply to Opportunities',
      description: 'Access and apply to contribution opportunities and funding',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-dna-copper to-dna-forest rounded-full flex items-center justify-center">
            <Sankofa className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Profile Unlocked! 🎉
          </DialogTitle>
          <DialogDescription className="text-center">
            You've reached {completionScore}% profile completion and unlocked full platform access
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
              >
                <div className="mt-0.5">
                  <benefit.icon className="h-5 w-5 text-dna-copper" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t">
            <p className="text-sm text-center text-muted-foreground mb-4">
              Keep building your profile to increase your visibility and unlock even more features
            </p>
            <Button onClick={onClose} className="w-full">
              Start Exploring DNA
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
