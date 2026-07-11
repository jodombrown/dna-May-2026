/**
 * DIA Saved — answers the member starred with the thumbs-up-style star
 * button in DiaSearch. Reads from public.dia_saved_answers.
 */
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bookmark, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { MateMasie } from '@/components/icons/adinkra';
import { toast } from 'sonner';

interface DiaSavedProps {
  onQueryClick?: (query: string) => void;
}

interface SavedAnswer {
  id: string;
  query_text: string;
  answer: string;
  created_at: string;
}

export function DiaSaved({ onQueryClick }: DiaSavedProps) {
  const qc = useQueryClient();

  const { data: saved, isLoading } = useQuery({
    queryKey: ['dia-saved'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [] as SavedAnswer[];
      const { data, error } = await (supabase.from('dia_saved_answers' as any)
        .select('id, query_text, answer, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(50) as any);
      if (error) throw error;
      return (data ?? []) as SavedAnswer[];
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('dia_saved_answers' as any).delete().eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dia-saved'] });
      toast.success('Removed from saved');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!saved || saved.length === 0) {
    return (
      <div className="text-center py-12">
        <Bookmark className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground">Nothing saved yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Tap the bookmark on any DIA answer to keep it here for later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {saved.map((s) => (
        <Card key={s.id} className="border-border/60">
          <CardContent className="p-3">
            <p className="text-sm font-medium text-foreground line-clamp-2">{s.query_text}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">{s.answer}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-muted-foreground">
                {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
              </span>
              <div className="flex items-center gap-1">
                {onQueryClick && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-emerald-700"
                    onClick={() => onQueryClick(s.query_text)}
                  >
                    Re-ask <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => del.mutate(s.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default DiaSaved;
