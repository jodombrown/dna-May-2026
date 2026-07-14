import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Video, Globe, MoreHorizontal, Edit3, Pin, Link, Trash2, Loader2, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Activity } from '@/types/activity';
import { format, formatDistanceToNow } from 'date-fns';
import { DATES_TBA, eventStartMs, formatEventDateTime } from '@/lib/events/eventTime';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { invalidateAllEventCaches } from '@/lib/eventCacheInvalidation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface FeedEventCardProps {
  activity: Activity;
}

export const FeedEventCard: React.FC<FeedEventCardProps> = ({ activity }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const eventData = activity.entity_data;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === activity.actor_id;

  const handleViewProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/dna/${activity.actor_username}`);
  };

  const handleViewEvent = () => {
    navigate(`/dna/convene/events/${eventData.event_slug || eventData.event_id}`);
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dna/convene/events/${eventData.event_slug || eventData.event_id}`;
    navigator.clipboard.writeText(url);
    toast.success('Event link copied to clipboard');
  };

  const handleEdit = () => {
    navigate(`/dna/convene/events/${eventData.event_id}/edit`);
  };

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventData.event_id)
        .eq('organizer_id', user.id);

      if (error) throw error;
      toast.success('Event deleted');
      invalidateAllEventCaches(queryClient, eventData.event_id);
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  // Parse event date for calendar box display — null-safe via eventStartMs.
  const eventStart = eventStartMs(eventData);
  const eventDate = eventStart !== null ? new Date(eventStart) : null;
  const monthAbbrev = eventDate ? format(eventDate, 'MMM').toUpperCase() : '';
  const dayNumber = eventDate ? format(eventDate, 'd') : '';
  const dayOfWeek = eventDate ? format(eventDate, 'EEEE') : '';
  const fullDate = eventDate ? format(eventDate, 'MMMM d') : '';
  const timeRange = formatEventDateTime(
    {
      start_time: eventData.start_time,
      end_time: eventData.end_time,
      time_confirmed: eventData.time_confirmed,
      date_confirmed: eventData.date_confirmed,
    },
    'clock'
  );

  // Get location display
  const getLocationDisplay = () => {
    if (eventData.is_virtual || eventData.format === 'virtual') {
      return { icon: Video, text: 'Virtual Event', subtext: null };
    }
    if (eventData.format === 'hybrid') {
      return { icon: Globe, text: 'Hybrid Event', subtext: eventData.location || eventData.location_city };
    }
    if (eventData.location) {
      return { icon: MapPin, text: eventData.location, subtext: eventData.location_city };
    }
    if (eventData.location_city) {
      return { icon: MapPin, text: eventData.location_city, subtext: null };
    }
    return null;
  };

  const locationInfo = getLocationDisplay();
  const attendeeCount = eventData.attendee_count || 0;

  // Get format badge color
  const getFormatBadge = () => {
    const format = eventData.format || eventData.event_type;
    if (!format) return null;
    
    const formatColors: Record<string, string> = {
      virtual: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      hybrid: 'bg-copper-100 text-copper-700 dark:bg-copper-900/30 dark:text-copper-300',
      in_person: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      conference: 'bg-copper-100 text-copper-700',
      workshop: 'bg-blue-100 text-blue-700',
      meetup: 'bg-green-100 text-green-700',
      networking: 'bg-copper-100 text-copper-700',
    };
    
    return (
      <Badge variant="secondary" className={`text-xs capitalize ${formatColors[format] || ''}`}>
        {format.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <>
      <Card 
        className="hover:shadow-lg transition-all overflow-hidden cursor-pointer group bg-card"
        style={{ borderRadius: '16px' }}
        onClick={handleViewEvent}
      >
        {/* Cover Image - Full width, larger */}
        {eventData.cover_image_url ? (
          <div className="aspect-[2/1] overflow-hidden relative">
            <img
              src={eventData.cover_image_url}
              alt={eventData.event_title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[2/1] bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center relative">
            <Calendar className="h-20 w-20 text-white/20" />
          </div>
        )}

        <div className="p-4 sm:p-5">
          {/* Event Title - Large & Bold, Luma-style */}
          <h3 className="font-bold text-xl sm:text-2xl leading-tight mb-4 line-clamp-2 text-foreground">
            {eventData.event_title}
          </h3>

          {/* Host info - Subtle, beneath title */}
          <div 
            className="flex items-center gap-2 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleViewProfile}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={activity.actor_avatar_url} alt={activity.actor_full_name} />
              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                {(activity.actor_full_name || 'DN').split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {activity.actor_full_name}
            </span>
          </div>

          {/* Date & Time - Luma-style with calendar icon box */}
          {!eventDate && (
            <p className="mb-3 text-sm text-muted-foreground">{DATES_TBA}</p>
          )}
          {eventDate && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 w-11 h-11 border border-border rounded-lg overflow-hidden bg-background flex flex-col items-center justify-center">
                <span className="text-[10px] font-semibold text-primary uppercase leading-none">
                  {monthAbbrev}
                </span>
                <span className="text-lg font-bold leading-none mt-0.5">
                  {dayNumber}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground">{dayOfWeek}, {fullDate}</p>
                {timeRange && <p className="text-sm text-muted-foreground">{timeRange}</p>}
              </div>
            </div>
          )}

          {/* Location - Luma-style with icon */}
          {locationInfo && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-11 h-11 border border-border rounded-lg bg-background flex items-center justify-center">
                <locationInfo.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{locationInfo.text}</p>
                {locationInfo.subtext && (
                  <p className="text-sm text-muted-foreground truncate">{locationInfo.subtext}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer: Attendees only when > 0 + Action Menu */}
          <div className="flex items-center justify-between">
            {attendeeCount > 0 ? (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{attendeeCount} going</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Be the first to register</span>
            )}

            {/* Action Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwner && (
                  <>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(); }}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit event
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                      <Pin className="mr-2 h-4 w-4" />
                      Pin to profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}>
                  <Link className="mr-2 h-4 w-4" />
                  Copy link
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete event
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Event'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
