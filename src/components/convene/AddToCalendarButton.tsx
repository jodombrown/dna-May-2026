import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Download, ExternalLink } from 'lucide-react';
import { downloadICSFile, getGoogleCalendarUrl, getOutlookCalendarUrl, getOffice365CalendarUrl } from '@/utils/calendarExport';
import { toast } from 'sonner';
import type { EventPlaceInput } from '@/lib/events/formatPlace';

interface AddToCalendarButtonProps {
  event: EventPlaceInput & {
    id: string;
    title: string;
    description?: string;
    start_time: string;
    time_confirmed?: boolean | null;
    end_time: string;
    meeting_url?: string;
    format: 'in_person' | 'virtual' | 'hybrid';
  };
  organizer?: {
    full_name: string;
    email?: string;
  };
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const AddToCalendarButton = ({ 
  event, 
  organizer,
  variant = 'outline',
  size = 'default' 
}: AddToCalendarButtonProps) => {
  const eventData = {
    ...event,
    organizer,
  };

  const handleDownloadICS = () => {
    try {
      downloadICSFile(eventData);
      toast.success('Calendar file downloaded');
    } catch (error) {
      toast.error('Failed to download calendar file');
    }
  };

  const handleOpenCalendar = (url: string, provider: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast.success(`Opening ${provider}...`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size}>
          <Calendar className="h-4 w-4 mr-2" />
          Add to Calendar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Add to your calendar</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => handleOpenCalendar(getGoogleCalendarUrl(eventData), 'Google Calendar')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Google Calendar
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleOpenCalendar(getOutlookCalendarUrl(eventData), 'Outlook')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Outlook.com
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleOpenCalendar(getOffice365CalendarUrl(eventData), 'Office 365')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Office 365
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDownloadICS}>
          <Download className="h-4 w-4 mr-2" />
          Download .ics file
        </DropdownMenuItem>
        
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground">
            For Apple Calendar, iCal, and other apps
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
