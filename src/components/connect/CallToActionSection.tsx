
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface CallToActionSectionProps {
  onFeedbackClick: () => void;
}

const CallToActionSection: React.FC<CallToActionSectionProps> = ({ onFeedbackClick }) => {
  return (
    <div className="mt-8 bg-gradient-to-r from-dna-emerald/10 to-dna-copper/10 rounded-lg p-6 sm:p-8 text-center">
      <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4">
        Have an Idea for Better Connections?
      </h3>
      <p className="text-sm sm:text-base text-neutral-600 mb-6">
        Help us build the ultimate networking experience for the African diaspora.
      </p>
      <Button 
        variant="default"
        onClick={onFeedbackClick}
      >
        <Users className="w-4 h-4 mr-2" />
        Share Your Connection Ideas
      </Button>
    </div>
  );
};

export default CallToActionSection;
