
import React from 'react';
import { TYPOGRAPHY } from '@/lib/typography.config';
import { Button } from '@/components/ui/button';
import { config } from '@/lib/config';

const EventPresenterSection: React.FC = () => {
  return (
    <div className="space-y-4">
      <h3 className={`${TYPOGRAPHY.h4} text-neutral-900`}>Presented by</h3>
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          className="p-0 h-auto min-w-[44px] min-h-[44px] hover:opacity-80"
          onClick={() => window.open(config.APP_URL, '_blank')}
        >
          <img 
            src="/lovable-uploads/c6f51307-c7df-4a26-a66e-b99e88b55c53.png" 
            alt="DNA Logo" 
            className="w-12 h-12 rounded-lg object-contain"
          />
          </Button>
        <div>
          <div className={`${TYPOGRAPHY.h5} text-neutral-900`}>Diaspora Network of Africa</div>
          <div className={`${TYPOGRAPHY.bodySmall} text-neutral-600`}>#1 Professional Networking and Impact Investment Platform for the African Diaspora</div>
        </div>
      </div>
    </div>
  );
};

export default EventPresenterSection;
