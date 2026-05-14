
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Copy, ExternalLink, X } from 'lucide-react';
import { Event } from '@/types/search';
import { useToast } from '@/hooks/use-toast';
import { getEventUrl } from '@/lib/config';

interface EventNavigationHeaderProps {
  event: Event;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onClose?: () => void;
}

const EventNavigationHeader: React.FC<EventNavigationHeaderProps> = ({
  event,
  onPrevious,
  onNext,
  hasPrevious = true,
  hasNext = true,
  onClose
}) => {
  const { toast } = useToast();

  const generateEventLink = (event: Event) => {
    // Use the event's slug if available, otherwise fall back to ID
    // This generates a public shareable URL at /event/:slugOrId
    const slugOrId = (event as any).slug || event.id;
    return getEventUrl(slugOrId);
  };

  const handleCopyLink = async () => {
    const eventLink = generateEventLink(event);
    try {
      await navigator.clipboard.writeText(eventLink);
      toast({
        title: "Link Copied!",
        description: "Event link has been copied to your clipboard.",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEventPageClick = () => {
    // Navigate to the public event page
    const slugOrId = (event as any).slug || event.id;
    window.open(`/event/${slugOrId}`, '_blank');
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border sticky top-0 z-[100] shadow-sm">
      {/* Navigation arrows - Left side */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-dna-emerald/10 hover:text-dna-forest transition-colors"
          onClick={onPrevious}
          disabled={!hasPrevious}
        >
          <ChevronLeft className="h-4 w-4 text-neutral-600" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full hover:bg-dna-emerald/10 hover:text-dna-forest transition-colors"
          onClick={onNext}
          disabled={!hasNext}
        >
          <ChevronRight className="h-4 w-4 text-neutral-600" />
        </Button>
      </div>

      {/* Copy Link and Event Page buttons - Center */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-xs text-neutral-700 hover:bg-dna-emerald/10 hover:text-dna-forest rounded-lg px-3 py-1.5 transition-colors"
          onClick={handleCopyLink}
        >
          <Copy className="h-3 w-3" />
          Copy Link
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-xs text-neutral-700 hover:bg-dna-emerald/10 hover:text-dna-forest rounded-lg px-3 py-1.5 transition-colors"
          onClick={handleEventPageClick}
        >
          Event Page
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default EventNavigationHeader;
