/**
 * AskDiaCta — persistent CTA for the right rail with quick prompt chips.
 * Opens the global DIA right-side sheet instead of navigating to /dna/dia.
 */
import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CulturalPattern } from '@/components/shared/CulturalPattern';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MateMasie } from '@/components/icons/adinkra';
import { useDiaSheet } from '@/contexts/DiaSheetContext';

interface SmartChip {
  id: string;
  label: string;
  prompt: string;
  kind: 'network' | 'event' | 'space' | 'analytics' | 'discover';
}

const FALLBACK_CHIPS: SmartChip[] = [
  { id: 'f1', label: 'Latest African fintech funding', prompt: 'Latest fintech funding across Africa this month', kind: 'discover' },
  { id: 'f2', label: 'Diaspora renewable projects', prompt: 'Diaspora-led renewable energy projects in East Africa', kind: 'discover' },
  { id: 'f3', label: 'Markets hiring tech talent', prompt: 'Which African markets are hiring senior tech talent right now?', kind: 'discover' },
];

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

interface LastQuery {
  id: string;
  query_text: string;
  created_at: string;
}

export const AskDiaCta: React.FC = () => {
  const { user } = useAuth();
  const { openWith } = useDiaSheet();

  const { data: lastQuery } = useQuery({
    queryKey: ['ask-dia-last-query', user?.id ?? null],
    enabled: !!user?.id,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<LastQuery | null> => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('dia_query_log')
        .select('id, query_text, created_at')
        .eq('user_id', user!.id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) return null;
      return (data as LastQuery | null) ?? null;
    },
  });

  const { data: chipData } = useQuery({
    queryKey: ['ask-dia-smart-chips', user?.id ?? null],
    enabled: !!user?.id,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<{ chips: SmartChip[]; personalized: boolean }> => {
      const { data, error } = await supabase.functions.invoke<{
        chips: SmartChip[];
        personalized: boolean;
      }>('dia-smart-chips', { body: {} });
      if (error || !data) return { chips: FALLBACK_CHIPS, personalized: false };
      return data;
    },
  });

  const chips = chipData?.chips ?? FALLBACK_CHIPS;

  return (
    <section
      aria-label="Ask DIA"
      className="relative overflow-hidden bg-card rounded-dna-xl shadow-dna-1"
    >
      <CulturalPattern pattern="adinkra" opacity={0.05} />
      <div className="relative z-10 p-3.5 space-y-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-full bg-[hsl(var(--dna-gold)/0.14)]">
            <MateMasie className="h-3.5 w-3.5 text-dna-gold" />
          </div>
          <div className="min-w-0">
            <h3 className="font-heritage text-sm font-semibold text-foreground">
              Ask DIA
            </h3>
            <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
              {chipData?.personalized
                ? 'Tailored to your recent activity.'
                : 'Real-time intelligence across the diaspora.'}
            </p>
          </div>
        </div>

        {lastQuery && (
          <button
            onClick={() => openWith(lastQuery.query_text)}
            className="w-full flex items-center gap-1.5 text-[11px] text-dna-copper hover:underline text-left"
          >
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">Continue: {truncate(lastQuery.query_text, 40)}</span>
          </button>
        )}

        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <button
              key={c.id}
              onClick={() => openWith(c.prompt)}
              title={c.prompt}
              className="text-[11px] px-2 py-1 rounded-full bg-muted hover:bg-[hsl(var(--dna-gold)/0.12)] hover:text-foreground text-muted-foreground transition-colors max-w-full truncate"
            >
              {c.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => openWith()}
          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-full bg-dna-gold text-white text-sm font-medium hover:bg-dna-gold-dark transition-colors min-h-[40px]"
        >
          <span>Start a conversation</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
};
