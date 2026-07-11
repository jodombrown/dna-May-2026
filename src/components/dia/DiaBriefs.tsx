/**
 * DIA Briefs — combines dia_brief_cards (personalized daily briefs) and
 * dia_nudges (proactive suggestions). Replaces the standalone Insights tab
 * so members get one surface for what DIA is proactively surfacing.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ArrowRight, Loader2, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MateMasie } from '@/components/icons/adinkra';

interface DiaBriefsProps {
  onPromptClick?: (prompt: string) => void;
}

interface BriefCard {
  id: string;
  headline: string;
  body: string | null;
  prompt: string | null;
  created_at: string;
}

interface Nudge {
  id: string;
  title: string;
  message: string | null;
  suggested_prompt: string | null;
  created_at: string;
}

export function DiaBriefs({ onPromptClick }: DiaBriefsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['dia-briefs'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { briefs: [] as BriefCard[], nudges: [] as Nudge[] };

      const [briefsRes, nudgesRes] = await Promise.all([
        (supabase.from('dia_brief_cards' as any)
          .select('id, headline, body, prompt, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(6) as any),
        (supabase.from('dia_nudges' as any)
          .select('id, title, message, suggested_prompt, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(6) as any),
      ]);

      return {
        briefs: (briefsRes.data ?? []) as BriefCard[],
        nudges: (nudgesRes.data ?? []) as Nudge[],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  const briefs = data?.briefs ?? [];
  const nudges = data?.nudges ?? [];
  const empty = briefs.length === 0 && nudges.length === 0;

  if (empty) {
    return (
      <div className="text-center py-12">
        <MateMasie className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">No briefs yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          DIA will surface personalized briefs and nudges as you connect, convene, and contribute.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {briefs.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <Lightbulb className="h-3 w-3" /> Today's briefs
          </p>
          <div className="space-y-2">
            {briefs.map((b) => (
              <Card key={b.id} className="border-border/60">
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-foreground">{b.headline}</p>
                  {b.body && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{b.body}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}
                    </span>
                    {b.prompt && onPromptClick && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-emerald-700 hover:text-emerald-800"
                        onClick={() => onPromptClick(b.prompt!)}
                      >
                        Ask DIA <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {nudges.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium mb-2 flex items-center gap-1.5">
            <Bell className="h-3 w-3" /> Nudges for you
          </p>
          <div className="space-y-2">
            {nudges.map((n) => (
              <Card key={n.id} className="border-border/60">
                <CardContent className="p-3">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  {n.message && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>}
                  {n.suggested_prompt && onPromptClick && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 mt-2 text-[11px] text-emerald-700 hover:text-emerald-800"
                      onClick={() => onPromptClick(n.suggested_prompt!)}
                    >
                      {n.suggested_prompt} <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DiaBriefs;
