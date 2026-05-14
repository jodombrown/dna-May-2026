
import React from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin, Link, MessageSquare } from 'lucide-react';
import { Event } from '@/types/search';
import { config } from '@/lib/config';

interface EventSocialSectionProps {
  event: Event;
}

const EventSocialSection: React.FC<EventSocialSectionProps> = ({ event }) => {
  return (
    <div className="space-y-4 pb-6">
      <h3 className="text-lg font-semibold text-neutral-900">Follow {event.title}</h3>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          className="hover:bg-dna-emerald/10 hover:border-dna-emerald hover:text-dna-forest transition-colors"
          onClick={() => window.open(config.social.linkedin, '_blank')}
        >
          <Linkedin className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="hover:bg-dna-emerald/10 hover:border-dna-emerald hover:text-dna-forest transition-colors"
          onClick={() => window.open('https://wa.me/message/XXXXXXXXXX', '_blank')}
        >
          <MessageSquare className="w-4 h-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="hover:bg-dna-emerald/10 hover:border-dna-emerald hover:text-dna-forest transition-colors"
          onClick={() => window.open(config.APP_URL, '_blank')}
        >
          <Link className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default EventSocialSection;
