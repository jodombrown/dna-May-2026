/**
 * EventThreadCTA — Call-to-action button linking an event to its discussion thread.
 *
 * Renders a secondary-style button with participant count badge that navigates
 * the user to /dna/messages?thread={threadId}. Hides entirely when:
 *  - The user is neither registered nor an organizer
 *  - The thread fetch is still loading or failed
 *  - No threadId was returned
 */

import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventThread } from '@/hooks/useEventThread';

interface EventThreadCTAProps {
  eventId: string;
  eventTitle: string;
  isRegistered: boolean;
  isPastEvent: boolean;
  isOrganizer: boolean;
}

function getButtonText(isPastEvent: boolean, isOrganizer: boolean): string {
  if (isPastEvent) return 'Continue Discussion';
  if (isOrganizer) return 'Event Discussion';
  return 'Discuss This Event';
}

function formatParticipantCount(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

export default function EventThreadCTA({
  eventId,
  eventTitle,
  isRegistered,
  isPastEvent,
  isOrganizer,
}: EventThreadCTAProps) {
  const navigate = useNavigate();
  const canAccess = isRegistered || isOrganizer;

  const { threadId, participantCount, isLoading, error } = useEventThread(eventId, canAccess);

  // Not authorized — render nothing
  if (!canAccess) return null;

  // Loading — show small skeleton that matches button dimensions
  if (isLoading) {
    return (
      <Skeleton className="h-10 w-full md:w-48 rounded-md" />
    );
  }

  // Error or no thread — hide CTA entirely
  if (error || !threadId) return null;

  const buttonText = getButtonText(isPastEvent, isOrganizer);

  return (
    <button
      type="button"
      onClick={() => navigate(`/dna/messages?thread=${threadId}`)}
      className={
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium ' +
        'border border-dna-emerald bg-transparent text-dna-emerald ' +
        'hover:bg-dna-emerald hover:text-primary-foreground ' +
        'transition-colors duration-150 ' +
        'w-full md:w-auto'
      }
      aria-label={`Open discussion thread for ${eventTitle}`}
    >
      <MessageCircle className="h-[18px] w-[18px] flex-shrink-0" />
      <span>{buttonText}</span>
      {participantCount > 0 && (
        <span
          className={
            'ml-1 inline-flex items-center justify-center rounded-full ' +
            'bg-dna-emerald/10 px-2 py-0.5 text-xs font-semibold text-dna-emerald ' +
            'leading-none min-w-[1.25rem]'
          }
        >
          {formatParticipantCount(participantCount)}
        </span>
      )}
    </button>
  );
}
