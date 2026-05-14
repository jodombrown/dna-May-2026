
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RequireProfileScore } from '@/components/profile/RequireProfileScore';
import { Target } from 'lucide-react';

interface CollaborationsCallToActionProps {
  onFeedbackClick: () => void;
}

const CollaborationsCallToAction: React.FC<CollaborationsCallToActionProps> = ({ onFeedbackClick }) => {
  return (
    <Card className="mt-8 bg-gradient-to-r from-dna-emerald/10 to-dna-copper/10">
      <CardContent className="p-6 sm:p-8 text-center">
        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4">
          Ready to Start Your Own Collaboration?
        </h3>
        <p className="text-sm sm:text-base text-neutral-600 mb-6">
          Propose a new project and find collaborators who share your vision for Africa's future.
        </p>
        <RequireProfileScore min={80} featureName="creating collaborations">
          <Button 
            onClick={onFeedbackClick}
            className="bg-dna-emerald hover:bg-dna-forest text-white"
          >
            <Target className="w-4 h-4 mr-2" />
            Propose New Project
          </Button>
        </RequireProfileScore>
      </CardContent>
    </Card>
  );
};

export default CollaborationsCallToAction;
