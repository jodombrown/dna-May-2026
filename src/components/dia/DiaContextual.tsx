import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import { pillarDiaConfigs, PillarDiaConfig, DiaPillar } from '@/config/dia-pillar-config';
import DiaSearch from './DiaSearch';
import { cn } from '@/lib/utils';
import { useMobile } from '@/hooks/useMobile';
import { MateMasie } from '@/components/icons/adinkra';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface DiaContextualProps {
  pillar: DiaPillar;
  collapsed?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
  compact?: boolean;
  // For mobile floating button variant
  floatingButton?: boolean;
}

export function DiaContextual({
  pillar,
  collapsed = true,
  onToggle,
  className,
  compact = false,
  floatingButton = false
}: DiaContextualProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { isMobile } = useMobile();
  const config = pillarDiaConfigs[pillar];

  if (!config) return null;

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  };

  // Mobile floating button variant - opens bottom sheet
  if (floatingButton && isMobile) {
    return (
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button
            className={cn(
              "fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg",
              "bg-emerald-600 hover:bg-emerald-700 text-white",
              "flex items-center justify-center",
              className
            )}
            size="icon"
          >
            <MateMasie className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <MateMasie className="h-5 w-5 text-emerald-600" />
              <span>DIA: {config.title}</span>
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </SheetHeader>
          <div className="overflow-y-auto flex-1 -mx-2 px-2">
            <DiaSearch
              source={config.pillar}
              placeholder={config.placeholder}
              compact={false}
              suggestions={config.suggestions.slice(0, 4)}
              networkMatchPriority={config.networkMatchPriority}
              maxResults={config.maxResults}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card className={cn(
      "border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent",
      className
    )}>
      <CardHeader className="pb-2 px-3 sm:px-6">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
            <MateMasie className="h-4 w-4 text-emerald-600" />
            <div className="flex flex-col">
              <span className="truncate">DIA: {config.title}</span>
              {isExpanded && (
                <span className="text-xs font-normal text-muted-foreground">
                  {config.description}
                </span>
              )}
            </div>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="h-9 w-9 p-0 min-h-[44px] min-w-[44px]"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        {!isExpanded && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
            {config.description}
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 px-3 sm:px-6">
          <DiaSearch
            source={config.pillar}
            placeholder={config.placeholder}
            compact={compact}
            suggestions={config.suggestions.slice(0, 4)}
            networkMatchPriority={config.networkMatchPriority}
            maxResults={config.maxResults}
          />
        </CardContent>
      )}
    </Card>
  );
}

export default DiaContextual;
