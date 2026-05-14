import React from 'react';
import { Calendar, Users, Network, Link2 } from 'lucide-react';
import { useChatConnectionContext } from '@/hooks/messaging/useChatConnectionContext';

interface ChatContextChipProps {
  otherUserId: string;
}

/**
 * Phase 6 - LinkedIn-style connection-context chip shown under the chat header.
 * Surfaces the strongest shared signal between the two users.
 */
export const ChatContextChip: React.FC<ChatContextChipProps> = ({ otherUserId }) => {
  const { data, isLoading } = useChatConnectionContext(otherUserId);

  if (isLoading || !data) return null;

  // Pick the strongest signal to surface (prefer concrete shared events/spaces).
  let icon: React.ReactNode = null;
  let label: string | null = null;

  if (data.recent_event_title) {
    icon = <Calendar className="h-3 w-3" />;
    label = `Met at ${data.recent_event_title}`;
  } else if (data.recent_space_title) {
    icon = <Users className="h-3 w-3" />;
    label = `Both in ${data.recent_space_title}`;
  } else if (data.mutual_connections > 0) {
    icon = <Network className="h-3 w-3" />;
    label = `${data.mutual_connections} mutual connection${data.mutual_connections === 1 ? '' : 's'}`;
  } else if (data.is_connected) {
    icon = <Link2 className="h-3 w-3" />;
    label = 'Connected on DNA';
  }

  if (!label) return null;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border-b border-border text-[11px] text-muted-foreground">
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
};
