/**
 * DiaSheet — the DIA right-side sheet. Hosts Ask / Insights / History
 * tabs and reuses the existing DIA search/history/insights components.
 * Lazy loaded via DiaSheetMount.
 */
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, History, Lightbulb } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';
import { DiaSearch } from './DiaSearch';
import DiaHistory from './DiaHistory';
import DiaInsights from './DiaInsights';
import { useDiaSheet } from '@/contexts/DiaSheetContext';

const DiaSheet: React.FC = () => {
  const { open, setOpen, seedPrompt, seedNonce, openWith } = useDiaSheet();
  const [tab, setTab] = useState<string>('search');
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Focus the search input as soon as the sheet finishes opening on the Ask tab.
  React.useEffect(() => {
    if (!open || tab !== 'search') return;
    const t = window.setTimeout(() => {
      const input = contentRef.current?.querySelector<HTMLInputElement>(
        'input[type="text"], input:not([type])',
      );
      input?.focus();
    }, 120);
    return () => window.clearTimeout(t);
  }, [open, tab, seedNonce]);

  const handleFromOtherTab = (query: string) => {
    openWith(query);
    setTab('search');
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[460px] p-0 flex flex-col gap-0 bg-background"
      >
        <SheetHeader className="px-4 py-3 border-b border-border/70 space-y-0">
          <SheetTitle asChild>
            <div className="flex items-center gap-2">
              <div className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10">
                <MateMasie className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="font-heritage text-base font-semibold">DIA</span>
              <Badge className="bg-dna-copper/10 text-dna-copper hover:bg-dna-copper/10 text-[10px] px-1.5 py-0 h-4">
                Alpha
              </Badge>
              <span className="ml-2 text-xs text-muted-foreground truncate">
                Your AI agent for Africa and its diaspora
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-3 grid grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-1.5 text-xs">
              <Search className="h-3.5 w-3.5" /> Ask
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1.5 text-xs">
              <Lightbulb className="h-3.5 w-3.5" /> Insights
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs">
              <History className="h-3.5 w-3.5" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
            <DiaSearch
              key={`ask-${seedNonce}`}
              source="dia-sheet"
              compact
              initialQuery={seedPrompt}
              autoSearch={!!seedPrompt && seedNonce > 0}
            />
          </TabsContent>

          <TabsContent value="insights" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
            <DiaInsights onInsightClick={handleFromOtherTab} />
          </TabsContent>

          <TabsContent value="history" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
            <DiaHistory onQueryClick={handleFromOtherTab} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default DiaSheet;
