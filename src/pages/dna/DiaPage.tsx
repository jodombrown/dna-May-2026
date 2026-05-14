import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, History, Lightbulb } from 'lucide-react';
import DiaSearch from '@/components/dia/DiaSearch';
import DiaHistory from '@/components/dia/DiaHistory';
import DiaInsights from '@/components/dia/DiaInsights';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import { MateMasie } from '@/components/icons/adinkra';

export default function DiaPage() {
  const [selectedQuery, setSelectedQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('search');
  const [searchKey, setSearchKey] = useState(0); // Key to force re-mount and auto-search

  const handleInsightClick = (query: string) => {
    setSelectedQuery(query);
    setSearchKey(prev => prev + 1); // Force DiaSearch to re-mount and trigger search
    setActiveTab('search');
  };

  const handleHistoryClick = (query: string) => {
    setSelectedQuery(query);
    setSearchKey(prev => prev + 1); // Force DiaSearch to re-mount and trigger search
    setActiveTab('search');
  };

  return (
    <div className="container mx-auto py-2 sm:py-8 px-3 sm:px-4 max-w-5xl pb-24 sm:pb-8">
      {/* Header */}
      <div className="text-center mb-3 sm:mb-8">
        <div className="relative inline-flex items-center justify-center w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-emerald-500/10 mb-2 sm:mb-4">
          <MateMasie className="h-5 w-5 sm:h-8 sm:w-8 text-emerald-600" />
          <Badge className="absolute -top-1 -right-1 bg-dna-copper text-white text-[10px] px-1.5 py-0 h-4 font-semibold">
            New
          </Badge>
        </div>
        <h1 className="text-xl sm:text-h1 font-serif mb-1 flex items-center justify-center gap-2">
          DIA
          <span className="text-xs font-medium text-dna-copper bg-dna-copper/10 px-2 py-0.5 rounded-full">Alpha</span>
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto text-xs sm:text-base px-2">
          Your AI agent for Africa and its global diaspora.
        </p>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
          <TabsTrigger value="search" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5 min-h-[44px]">
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Search</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5 min-h-[44px]">
            <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Insights</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5 min-h-[44px]">
            <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          <DiaSearch
            key={searchKey}
            source="dia-page"
            initialQuery={selectedQuery}
            autoSearch={searchKey > 0 && !!selectedQuery}
          />
        </TabsContent>

        <TabsContent value="insights">
          <DiaInsights onInsightClick={handleInsightClick} />
        </TabsContent>

        <TabsContent value="history">
          <DiaHistory onQueryClick={handleHistoryClick} />
        </TabsContent>
      </Tabs>

      <MobileBottomNav />
    </div>
  );
}
