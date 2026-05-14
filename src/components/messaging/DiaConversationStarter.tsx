/**
 * DNA | DIA — Conversation Starters
 * Shows contextual suggestions for stale conversations (7+ days inactive).
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MateMasie } from '@/components/icons/adinkra';

interface DiaConversationStarterProps {
  otherUserId: string;
  lastMessageAt: string | null;
  conversationId: string;
  onClick?: () => void;
}

export function DiaConversationStarter({
  otherUserId,
  lastMessageAt,
  conversationId,
  onClick,
}: DiaConversationStarterProps) {
  const [dismissed, setDismissed] = useState(false);

  // Check localStorage for dismissed state
  useEffect(() => {
    const key = `dia-starter-dismissed-${conversationId}`;
    if (localStorage.getItem(key)) {
      setDismissed(true);
    }
  }, [conversationId]);

  // Only show for stale conversations (7+ days)
  const isStale = lastMessageAt
    ? Date.now() - new Date(lastMessageAt).getTime() > 7 * 24 * 60 * 60 * 1000
    : false;

  const { data: suggestion } = useQuery({
    queryKey: ['dia-conversation-starter', otherUserId],
    queryFn: async (): Promise<string | null> => {
      // Check recent events the other user attended
      const { data: recentEvents } = await supabase
        .from('event_attendees')
        .select('events!inner(title)')
        .eq('user_id', otherUserId)
        .eq('status', 'going')
        .order('created_at', { ascending: false })
        .limit(1);

      if (recentEvents && recentEvents.length > 0) {
        const title = (recentEvents[0].events as unknown as { title: string })?.title;
        if (title) return `They recently attended ${title}`;
      }

      // Check recent space joins
      const { data: recentSpaces } = await supabase
        .from('collaboration_memberships')
        .select('collaboration_spaces!inner(title)')
        .eq('user_id', otherUserId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false })
        .limit(1);

      if (recentSpaces && recentSpaces.length > 0) {
        const title = (recentSpaces[0].collaboration_spaces as unknown as { title: string })?.title;
        if (title) return `You both joined the ${title} space`;
      }

      // Check their industry/role
      const { data: profile } = await supabase
        .from('profiles')
        .select('industry, headline')
        .eq('id', otherUserId)
        .maybeSingle();

      if (profile?.industry) {
        return `Ask about their work in ${profile.industry}`;
      }

      return null;
    },
    enabled: isStale && !dismissed,
    staleTime: 10 * 60_000,
  });

  if (!isStale || dismissed || !suggestion) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    localStorage.setItem(`dia-starter-dismissed-${conversationId}`, '1');
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 mt-1 cursor-pointer group/starter',
      )}
      onClick={onClick}
    >
    <MateMasie className="h-3 w-3 text-primary flex-shrink-0" />
      <span className="text-[11px] text-primary truncate">
        💡 {suggestion}
      </span>
      <button
        onClick={handleDismiss}
        className="opacity-0 group-hover/starter:opacity-100 transition-opacity ml-auto flex-shrink-0"
        aria-label="Dismiss suggestion"
      >
        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
      </button>
    </div>
  );
}
