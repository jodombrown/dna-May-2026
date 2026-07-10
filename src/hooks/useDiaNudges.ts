import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface DiaNudge {
  id: string;
  user_id: string;
  connection_id: string;
  nudge_type: string;
  message: string;
  status: string; // 'sent' | 'accepted' | 'dismissed' | 'snoozed'
  payload: Record<string, unknown> | null;
  resolved_at: string | null;
  created_at: string;
  action_url?: string;
  priority?: 'low' | 'medium' | 'high';
}

export function useDiaNudges(statusFilter?: 'sent' | 'all') {
  const { user } = useAuth();
  const [nudges, setNudges] = useState<DiaNudge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNudges = async () => {
    if (!user) {
      setNudges([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Use dia_nudges table (legacy name, UI displays as DIA)
    let query = supabase
      .from("dia_nudges")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Filter by status - 'sent' is the pending status in this schema
    if (statusFilter === 'sent') {
      query = query.eq("status", "sent");
    }

    const { data, error } = await query;

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load nudges",
        variant: "destructive",
      });
      setNudges([]);
    } else {
      // Map the data and add computed properties
      const mappedNudges: DiaNudge[] = (data || []).map((nudge) => {
        const payload = nudge.payload as Record<string, unknown> | null;
        return {
          ...nudge,
          payload,
          action_url: (payload?.action_url as string) || undefined,
          priority: ((payload?.priority as string) || 'medium') as DiaNudge['priority'],
        };
      });
      setNudges(mappedNudges);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchNudges();

    // Subscribe to realtime changes
    const instanceId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const channelName = `dia_nudges_changes_${user?.id || 'anon'}_${statusFilter || 'all'}_${instanceId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dia_nudges',
          filter: user ? `user_id=eq.${user.id}` : undefined,
        },
        () => {
          fetchNudges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, statusFilter]);

  const acceptNudge = async (nudgeId: string) => {
    const { error } = await supabase
      .from("dia_nudges")
      .update({ status: "accepted", resolved_at: new Date().toISOString() })
      .eq("id", nudgeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept nudge",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Nudge accepted",
    });
    return true;
  };

  const dismissNudge = async (nudgeId: string) => {
    const { error } = await supabase
      .from("dia_nudges")
      .update({ status: "dismissed", resolved_at: new Date().toISOString() })
      .eq("id", nudgeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss nudge",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const snoozeNudge = async (nudgeId: string, until: string) => {
    const { error } = await supabase
      .from("dia_nudges")
      .update({
        status: "snoozed"
      })
      .eq("id", nudgeId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to snooze nudge",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Snoozed",
      description: "You'll see this again later",
    });
    return true;
  };

  return {
    nudges,
    loading,
    acceptNudge,
    dismissNudge,
    snoozeNudge,
    refetch: fetchNudges,
  };
}