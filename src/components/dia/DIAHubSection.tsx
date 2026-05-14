/**
 * DNA | DIA Hub Section Component
 *
 * Reusable section for hub pages that displays 1-2 contextual DIA cards.
 * Positioned in sidebar on desktop, above the fold on mobile.
 * Renders nothing if no cards are available.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { DIAInsightCard } from '@/components/dia/DIAInsightCard';
import { MateMasie } from '@/components/icons/adinkra';
import {
  getDIACards,
  dismissDIACard,
  type DIACardSurface,
  type DIACardAction,
} from '@/services/diaCardService';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────

interface DIAHubSectionProps {
  surface: DIACardSurface;
  limit?: number;
  className?: string;
  onMessageUser?: (userId: string) => void;
}

// ── Component ──────────────────────────────────────

export function DIAHubSection({
  surface,
  limit = 2,
  className,
  onMessageUser,
}: DIAHubSectionProps) {
  const { user } = useAuth();

  const { data: cards, isLoading, refetch } = useQuery({
    queryKey: ['dia-cards', surface, user?.id],
    queryFn: () =>
      getDIACards({
        userId: user?.id || '',
        surface,
        limit,
        excludeDismissed: true,
      }),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const handleAction = (_action: DIACardAction) => {
    // Navigation is handled inside DIAInsightCard
    // Additional action handling can be added here
  };

  const handleDismiss = (dismissKey: string) => {
    dismissDIACard(dismissKey);
    refetch();
  };

  // Don't render anything if loading or no cards
  if (isLoading) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-4', className)}>
        <div className="flex items-center gap-2 mb-3">
          <MateMasie className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">DIA Insights</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">Loading insights...</span>
        </div>
      </div>
    );
  }

  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10">
          <MateMasie className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="font-semibold text-sm text-foreground">DIA Insights</span>
        <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded-full bg-muted">
          {cards.length}
        </span>
      </div>

      {/* Cards */}
      {cards.map(card => (
        <DIAInsightCard
          key={card.id}
          card={card}
          onAction={handleAction}
          onDismiss={handleDismiss}
          onMessageUser={onMessageUser}
        />
      ))}
    </div>
  );
}

export default DIAHubSection;
