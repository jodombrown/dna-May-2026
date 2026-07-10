import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DiaPreferences {
  id: string;
  user_id: string;
  notification_frequency: 'never' | 'low' | 'normal' | 'high';
  nudge_categories: string[];
  email_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  // Granular email preferences
  email_connections?: boolean;
  email_comments?: boolean;
  email_reactions?: boolean;
  email_mentions?: boolean;
  email_messages?: boolean;
  email_events?: boolean;
  email_stories?: boolean;
  unsubscribe_token?: string;
  created_at: string;
  updated_at: string;
}

export const useDiaPreferences = () => {
  return useQuery({
    queryKey: ['dia-preferences'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Use dia_preferences table (legacy name, UI displays as DIA)
      let { data, error } = await supabase
        .from('dia_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no preferences exist, create default ones
      if (error && error.code === 'PGRST116') {
        const { data: newPrefs, error: insertError } = await supabase
          .from('dia_preferences')
          .insert({
            user_id: user.id,
            notification_frequency: 'normal',
            nudge_categories: ['connection', 'content', 'engagement'],
            email_enabled: true,
            in_app_enabled: true,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newPrefs as DiaPreferences;
      }

      if (error) throw error;
      return data as DiaPreferences;
    },
  });
};

export const useUpdateDiaPreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preferences: Partial<DiaPreferences>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Use dia_preferences table (legacy name, UI displays as DIA)
      const { data, error } = await supabase
        .from('dia_preferences')
        .update(preferences as any)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dia-preferences'] });
      toast({
        title: 'Preferences Updated',
        description: 'Your notification preferences have been saved.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update preferences. Please try again.',
        variant: 'destructive',
      });
    },
  });
};