/**
 * DiaSheet — the DIA right-side sheet. Hosts Ask / Insights / History
 * tabs and reuses the existing DIA search/history/insights components.
 * Lazy loaded via DiaSheetMount.
 */
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, History, Lightbulb, Bookmark, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MateMasie } from '@/components/icons/adinkra';
import { DiaSearch } from './DiaSearch';
import DiaHistory from './DiaHistory';
import DiaBriefs from './DiaBriefs';
import DiaSaved from './DiaSaved';
import { DiaInsights } from './DiaInsights';
import { useDiaSheet } from '@/contexts/DiaSheetContext';

// Subtle Kente-inspired background, matching the Make an Introduction modal feel.
const KENTE_PATTERN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23C4942A' stroke-width='1'%3E%3Cpath d='M0 20h40M20 0v40M0 0h40v40H0z'/%3E%3Crect x='5' y='5' width='10' height='10' fill='%23C4942A' fill-opacity='0.3'/%3E%3Crect x='25' y='25' width='10' height='10' fill='%23C4942A' fill-opacity='0.3'/%3E%3C/g%3E%3C/svg%3E")`;

interface SmartChip { id: string; label: string; prompt: string; kind: string }

const DiaSheet: React.FC = () => {
  const { open, setOpen, seedPrompt, seedNonce, openWith } = useDiaSheet();
  const [tab, setTab] = useState<string>('search');
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { data: chipData } = useQuery({
    queryKey: ['dia-sheet-smart-chips'],
    enabled: open,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ chips: SmartChip[] }>(
        'dia-smart-chips',
        { body: {} },
      );
      if (error || !data) return { chips: [] as SmartChip[] };
      return data;
    },
  });
  const suggestions = (chipData?.chips ?? []).map((c) => c.prompt);

  React.useEffect(() => {
    if (!open || tab !== 'search') return;
    const t = window.setTimeout(() => {
      const input = contentRef.current?.querySelector<HTMLTextAreaElement | HTMLInputElement>(
        'textarea, input[type="text"], input:not([type])',
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
        className="w-full sm:max-w-[460px] p-0 flex flex-col gap-0 border-l border-border/60"
        style={{
          backgroundImage: KENTE_PATTERN,
          backgroundColor: 'hsl(var(--background))',
        }}
      >
        {/* Readability overlay over the pattern */}
        <div className="absolute inset-0 bg-background/[0.94] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full min-h-0">
          <SheetHeader className="px-4 py-3 border-b border-border/60 space-y-0 bg-background/40 backdrop-blur-sm">
            <SheetTitle asChild>
              <div className="flex items-center gap-2.5">
                <div className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/12 ring-1 ring-emerald-600/20">
                  <MateMasie className="h-4 w-4 text-emerald-700" />
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heritage text-base font-semibold">DIA</span>
                    <Badge className="bg-dna-copper/10 text-dna-copper hover:bg-dna-copper/10 text-[9px] px-1.5 py-0 h-4 rounded-sm">
                      Alpha
                    </Badge>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate">
                    Your AI agent for Africa and its diaspora
                  </span>
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>

          <div ref={contentRef} className="flex-1 flex flex-col min-h-0">
            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-4 mt-3 grid grid-cols-5 bg-muted/60">
                <TabsTrigger value="search" className="flex items-center gap-1 text-[11px]">
                  <Search className="h-3 w-3" /> Ask
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex items-center gap-1 text-[11px]">
                  <TrendingUp className="h-3 w-3" /> Insights
                </TabsTrigger>
                <TabsTrigger value="briefs" className="flex items-center gap-1 text-[11px]">
                  <Lightbulb className="h-3 w-3" /> Briefs
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-1 text-[11px]">
                  <Bookmark className="h-3 w-3" /> Saved
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-1 text-[11px]">
                  <History className="h-3 w-3" /> History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="search" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
                <DiaSearch
                  key={`ask-${seedNonce}`}
                  source="dia-sheet"
                  compact
                  hideBrandInAnswer
                  initialQuery={seedPrompt}
                  autoSearch={!!seedPrompt && seedNonce > 0}
                  suggestions={suggestions.length ? suggestions : undefined}
                />
              </TabsContent>

              <TabsContent value="insights" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
                <DiaInsights limit={6} onInsightClick={handleFromOtherTab} />
              </TabsContent>



              <TabsContent value="briefs" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
                <DiaBriefs onPromptClick={handleFromOtherTab} />
              </TabsContent>

              <TabsContent value="saved" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
                <DiaSaved onQueryClick={handleFromOtherTab} />
              </TabsContent>

              <TabsContent value="history" className="flex-1 overflow-y-auto px-4 py-4 mt-0">
                <DiaHistory onQueryClick={handleFromOtherTab} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DiaSheet;
