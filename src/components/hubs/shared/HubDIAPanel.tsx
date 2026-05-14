// src/components/hubs/shared/HubDIAPanel.tsx
// DIA recommendations panel for Five C hub pages

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MateMasie } from '@/components/icons/adinkra';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChevronDown, X, HelpCircle, MessageCircle, Loader2 } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface DIARecommendation {
  id: string;
  title: string;
  description: string;
  reason?: string; // "Why this?"
  icon?: LucideIcon;
  onClick?: () => void;
}

interface HubDIAPanelProps {
  hub: 'connect' | 'convene' | 'collaborate' | 'contribute' | 'convey';
  recommendations: DIARecommendation[];
  onDismiss?: (id: string) => void;
  onAskDIA?: () => void;
  loading?: boolean;
  className?: string;
}

export function HubDIAPanel({
  hub,
  recommendations,
  onDismiss,
  onAskDIA,
  loading = false,
  className,
}: HubDIAPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    onDismiss?.(id);
  };

  const visibleRecommendations = recommendations.filter(r => !dismissed.has(r.id));

  if (visibleRecommendations.length === 0 && !loading) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={className}>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Header */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                <MateMasie className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">DIA Insights</span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
                {visibleRecommendations.length}
              </span>
            </div>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-muted-foreground transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </button>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading insights...</span>
              </div>
            ) : (
              <>
                {visibleRecommendations.map(rec => (
                  <div
                    key={rec.id}
                    className="group flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {rec.icon && (
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-background">
                        <rec.icon className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={rec.onClick}
                        className="text-left w-full"
                        disabled={!rec.onClick}
                      >
                        <p className="font-medium text-foreground text-sm leading-tight">
                          {rec.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {rec.description}
                        </p>
                      </button>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {rec.reason && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="p-1.5 rounded-md hover:bg-background transition-colors">
                                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">{rec.reason}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {onDismiss && (
                        <button
                          onClick={() => handleDismiss(rec.id)}
                          className="p-1.5 rounded-md hover:bg-background transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Ask DIA Button */}
                {onAskDIA && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onAskDIA}
                    className="w-full mt-2"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Ask DIA about {hub}
                  </Button>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default HubDIAPanel;
