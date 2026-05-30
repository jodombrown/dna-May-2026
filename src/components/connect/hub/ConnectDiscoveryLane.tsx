/**
 * DNA | CONNECT — Discovery Lane
 * Reusable horizontal-scroll section for member discovery.
 * Mirrors the CONVENE DiscoveryLane pattern but uses Emerald accent.
 */

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConnectMemberCard } from './ConnectMemberCard';
import { cn } from '@/lib/utils';

interface DiscoveryMember {
  id: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  headline?: string;
  profession?: string;
  location?: string;
  primary_origin_country?: string;
  current_country?: string;
  focus_areas?: string[];
  industries?: string[];
  bio?: string;
  tagline?: string;
  last_seen_at?: string;
  created_at?: string;
  match_score?: number;
  [key: string]: unknown;
}

interface ConnectDiscoveryLaneProps {
  title: string;
  titleIcon?: React.ReactNode;
  members: DiscoveryMember[];
  onSeeAll?: () => void;
  seeAllLabel?: string;
  onConnectionSent?: () => void;
  onMessage?: (memberId: string) => void;
  className?: string;
}

export function ConnectDiscoveryLane({
  title,
  titleIcon,
  members,
  onSeeAll,
  seeAllLabel = 'See all',
  onConnectionSent,
  onMessage,
  className,
}: ConnectDiscoveryLaneProps) {
  // Hide entire section if no members
  if (members.length === 0) return null;

  return (
    <section className={cn('space-y-3', className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-dna-forest">
          {title}
          {titleIcon}
        </h3>
        {onSeeAll && members.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-dna-emerald hover:text-dna-emerald/80 -mr-2 text-sm font-medium"
            onClick={onSeeAll}
          >
            {seeAllLabel} <ArrowRight className="ml-1 w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Emerald section divider */}
      <div className="h-px bg-dna-emerald/20" />

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-3 px-3 md:mx-0 md:px-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible">
        {members.map((member) => (
          <div
            key={member.id}
            className="min-w-[280px] max-w-[340px] flex-shrink-0 md:min-w-0 md:max-w-none"
          >
            <ConnectMemberCard
              member={member}
              onConnectionSent={onConnectionSent}
              onMessage={onMessage}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
