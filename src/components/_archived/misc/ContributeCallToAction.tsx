
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HandHeart } from 'lucide-react';

interface ContributeCallToActionProps {
  onFeedbackClick: () => void;
}

const ContributeCallToAction: React.FC<ContributeCallToActionProps> = ({ onFeedbackClick }) => {
  return (
    <Card className="mt-8 bg-gradient-to-r from-dna-gold/10 to-dna-emerald/10">
      <CardContent className="p-6 sm:p-8 text-center">
        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-4">
          Don't See Your Ideal Pathway to Impact?
        </h3>
        <p className="text-sm sm:text-base text-neutral-600 mb-6">
          Help us expand our pathways to include more ways for the diaspora to create meaningful impact in Africa.
        </p>
        <Button 
          variant="default"
          onClick={onFeedbackClick}
        >
          <HandHeart className="w-4 h-4 mr-2" />
          Share Your Pathway Ideas
        </Button>
      </CardContent>
    </Card>
  );
};

export default ContributeCallToAction;
