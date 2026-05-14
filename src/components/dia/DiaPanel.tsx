import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Maximize2, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DiaSearch from './DiaSearch';
import DiaHistory from './DiaHistory';
import { MateMasie } from '@/components/icons/adinkra';

interface DiaPanelProps {
  className?: string;
  showHistory?: boolean;
}

export function DiaPanel({ className, showHistory = true }: DiaPanelProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');
  const [selectedQuery, setSelectedQuery] = useState<string>('');

  const handleQueryClick = (query: string) => {
    setSelectedQuery(query);
    setActiveTab('search');
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <MateMasie className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">DIA</h2>
              <p className="text-xs font-normal text-muted-foreground">
                Diaspora Intelligence Agent
              </p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-1">
            {showHistory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(activeTab === 'search' ? 'history' : 'search')}
                className="text-muted-foreground hover:text-foreground"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dna/dia')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tab Toggle */}
        {showHistory && (
          <div className="flex gap-1 mt-3 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === 'search'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === 'history'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              History
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {activeTab === 'search' ? (
          <DiaSearch source="dashboard" compact initialQuery={selectedQuery} />
        ) : (
          <DiaHistory compact onQueryClick={handleQueryClick} />
        )}
      </CardContent>
    </Card>
  );
}

export default DiaPanel;
