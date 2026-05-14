
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink } from 'lucide-react';
import { Event } from '@/types/search';
import { TYPOGRAPHY } from '@/lib/typography.config';
import { Button } from '@/components/ui/button';

interface EventHostSectionProps {
  event: Event;
  onCreatorClick?: (creatorId: string) => void;
}

const EventHostSection: React.FC<EventHostSectionProps> = ({ event, onCreatorClick }) => {
  if (!event.creator_profile) return null;

  return (
    <div className="space-y-4">
      <h3 className={`${TYPOGRAPHY.h4} text-neutral-900`}>Hosted By</h3>
      <Button
        variant="ghost"
        className="w-full justify-start p-3 h-auto min-h-[44px] hover:bg-neutral-50"
        onClick={() => onCreatorClick?.(event.creator_profile!.id)}
      >
        <div className="flex items-center gap-3 w-full">
          <Avatar className="w-12 h-12">
            <AvatarImage src={event.creator_profile.avatar_url} alt={event.creator_profile.full_name} />
            <AvatarFallback className="bg-dna-copper text-white">
              {(event.creator_profile.full_name || 'DN').split(' ').map(n => n[0]).join('').slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className={`${TYPOGRAPHY.h5} text-neutral-900`}>{event.creator_profile.full_name || 'Event Host'}</div>
            <div className={`${TYPOGRAPHY.bodySmall} text-neutral-600`}>Event Host</div>
          </div>
          <ExternalLink className="w-4 h-4 text-neutral-400" />
        </div>
      </Button>
    </div>
  );
};

export default EventHostSection;
