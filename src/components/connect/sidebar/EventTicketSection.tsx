
import React from 'react';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { TYPOGRAPHY } from '@/lib/typography.config';

interface EventTicketSectionProps {
  onRegister: () => void;
}

const EventTicketSection: React.FC<EventTicketSectionProps> = ({ onRegister }) => {
  return (
    <div className="space-y-4">
      <h2 className={`${TYPOGRAPHY.h3} text-neutral-900`}>Get Tickets</h2>
      
      <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
        <div className={`${TYPOGRAPHY.bodySmall} flex items-center gap-2 text-neutral-600`}>
          <Clock className="w-4 h-4" />
          <span>Registration closes in 5 days</span>
        </div>
        <div className={`${TYPOGRAPHY.bodySmall} text-neutral-600`}>
          Secure your spot before it's too late!
        </div>
      </div>

      <div className="space-y-2">
        <div className={`${TYPOGRAPHY.h4} text-neutral-900`}>Free</div>
        <div className={`${TYPOGRAPHY.bodySmall} text-neutral-600`}>Per ticket</div>
      </div>

      <Button 
        variant="default"
        className="w-full min-h-[44px] bg-dna-emerald hover:bg-dna-forest text-white"
        onClick={onRegister}
      >
        Register Now
      </Button>
    </div>
  );
};

export default EventTicketSection;
