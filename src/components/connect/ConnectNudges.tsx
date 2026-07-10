import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Sankofa } from '@/components/icons/adinkra';

export const ConnectNudges: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const { data: nudges } = useQuery({
    queryKey: ['connect-nudges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase.from('dia_nudges').select('*').eq('user_id', user.id).eq('status', 'sent').limit(3);
      return data || [];
    },
    enabled: !!user,
  });

  const visible = nudges?.filter(n => !dismissed.includes(n.id)) || [];
  if (visible.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2">
        <Sankofa className="w-4 h-4 text-dna-copper" />
        <h3 className="text-sm font-medium">Suggestions for you</h3>
      </div>
      {visible.map(n => (
        <Card key={n.id} className="cursor-pointer hover:bg-accent/50 border-dna-copper/20" onClick={() => { trackEvent('connect_nudge_clicked', { nudge_id: n.id }); navigate('/dna/connect/discover'); }}>
          <CardContent className="p-4 flex justify-between gap-3">
            <p className="text-sm flex-1">{n.message}</p>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); setDismissed([...dismissed, n.id]); }}><X className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
