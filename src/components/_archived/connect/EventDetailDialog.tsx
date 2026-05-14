
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users as UsersIcon, Image as ImageIcon } from "lucide-react";
import { Event } from "@/types/search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { ROUTES } from '@/config/routes';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onRegister: () => void;
  isLoggedIn: boolean;
};

// Event logo images - contextually relevant
const getEventLogo = (eventTitle: string, eventType: string) => {
  if (eventTitle.toLowerCase().includes('tech') || eventTitle.toLowerCase().includes('innovation')) {
    return 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=150&h=150&fit=crop';
  }
  if (eventTitle.toLowerCase().includes('investment') || eventTitle.toLowerCase().includes('finance')) {
    return 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=150&h=150&fit=crop';
  }
  if (eventTitle.toLowerCase().includes('health')) {
    return 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=150&h=150&fit=crop';
  }
  if (eventTitle.toLowerCase().includes('agri')) {
    return 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&h=150&fit=crop';
  }
  if (eventTitle.toLowerCase().includes('women') || eventTitle.toLowerCase().includes('leadership')) {
    return 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&h=150&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=150&h=150&fit=crop';
};

// Event banner images
const getEventBanner = (eventTitle: string, eventType: string) => {
  if (eventTitle.toLowerCase().includes('tech') || eventTitle.toLowerCase().includes('innovation')) {
    return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=400&fit=crop';
  }
  if (eventTitle.toLowerCase().includes('investment') || eventTitle.toLowerCase().includes('finance')) {
    return 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=900&h=400&fit=crop';
  }
  if (eventTitle.toLowerCase().includes('women') || eventTitle.toLowerCase().includes('networking')) {
    return 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=900&h=400&fit=crop';
  }
  return 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=900&h=400&fit=crop';
};

// Creator images - diverse African professionals
const getCreatorImage = (eventTitle: string) => {
  const creatorImages: { [key: string]: string } = {
    'African Tech': 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face',
    'Diaspora Investment': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    'Women in Finance': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face',
    'Climate Solutions': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    'Healthcare Innovation': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    'AgriTech': 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face'
  };

  for (const [keyword, image] of Object.entries(creatorImages)) {
    if (eventTitle.includes(keyword)) {
      return image;
    }
  }
  return 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face';
};

export default function EventDetailDialog({
  open,
  onOpenChange,
  event,
  onRegister,
  isLoggedIn
}: Props) {
  const navigate = useNavigate();
  if (!event) return null;

  const eventLogo = getEventLogo(event.title, event.type);
  const eventBanner = event.banner_url || getEventBanner(event.title, event.type);
  const creatorImage = event.creator_profile?.avatar_url || getCreatorImage(event.title);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full p-0 rounded-lg overflow-hidden sm:max-w-2xl shadow-xl">
        {/* Banner */}
        <div className="relative w-full h-40 sm:h-56 bg-neutral-100">
          <img
            src={eventBanner}
            alt={`${event.title} banner`}
            className="h-full w-full object-cover object-center"
            loading="lazy"
          />
          {/* Creator on banner - bottom right */}
          {event.creator_profile && (
            <button
              className="absolute bottom-4 right-4 rounded-full shadow border-2 border-white bg-white/80 hover:bg-dna-emerald/80 flex items-center gap-2 px-3 py-1 z-20"
              onClick={() => navigate(ROUTES.profile.view(event.creator_profile.username || event.creator_profile.id))}
              title={`View profile: ${event.creator_profile.full_name}`}
              aria-label="View event creator profile"
              tabIndex={0}
              type="button"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={creatorImage} alt={event.creator_profile.full_name} />
                <AvatarFallback className="bg-dna-copper text-white">
                  <ImageIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-dna-forest opacity-90 max-w-[8em] truncate">{event.creator_profile.full_name}</span>
            </button>
          )}
          {/* Event logo avatar - absolute, overlap banner bottom left */}
          <div className="absolute left-5 -bottom-10 z-10">
            <Avatar className="w-20 h-20 ring-4 ring-white shadow-xl bg-white">
              <AvatarImage
                src={eventLogo}
                alt={`${event.title} logo`}
                className="object-cover"
              />
              <AvatarFallback className="bg-dna-copper text-white">
                <ImageIcon className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        {/* Card content, padding top to allow for avatar overlap */}
        <div className="pt-14 px-5 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-bold text-xl mb-1 text-dna-forest">{event.title}</h2>
              <div className="flex gap-2 flex-wrap mb-2">
                <Badge variant="outline">{event.type}</Badge>
                {event.is_virtual && (
                  <Badge variant="secondary" className="cursor-default">Virtual</Badge>
                )}
              </div>
            </div>
            {/* Date & Time */}
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Calendar className="w-4 h-4" />
              <span>
                {event.date_time
                  ? new Date(event.date_time).toLocaleString()
                  : "TBD"}
              </span>
            </div>
          </div>
          {/* Location, Attendees */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500 mt-3 mb-1">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </div>
            <div className="flex items-center gap-1">
              <UsersIcon className="w-4 h-4" />
              {event.attendee_count ?? 0} attending
            </div>
          </div>
          {/* Description */}
          {event.description && (
            <div className="my-4 text-neutral-800 text-base leading-relaxed whitespace-pre-line break-words">
              {event.description}
            </div>
          )}
          <DialogFooter>
            <Button
              className="w-full bg-dna-emerald hover:bg-dna-forest text-white"
              onClick={onRegister}
            >
              Register for this Event
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
