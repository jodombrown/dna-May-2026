import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { DiscoveryCard } from '@/components/discover/DiscoveryCard';
import { Sankofa } from '@/components/icons/adinkra';

const SuggestionsTab: React.FC = () => {
  const { user } = useAuth();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['network-suggestions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's existing connections
      const { data: existingConnections } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const connectedUserIds = new Set(
        existingConnections?.flatMap((c) => [c.requester_id, c.recipient_id]).filter((id) => id !== user.id) || []
      );

      // Get pending requests
      const { data: pendingConnections } = await supabase
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'pending');

      const requestedUserIds = new Set(
        pendingConnections?.flatMap((r) => [r.requester_id, r.recipient_id]).filter((id) => id !== user.id) || []
      );

      // Get high match score members
      const { data, error } = await supabase.rpc('discover_members', {
        p_current_user_id: user.id,
        p_focus_areas: null,
        p_regional_expertise: null,
        p_industries: null,
        p_country_of_origin: null,
        p_location_country: null,
        p_search_query: null,
        p_sort_by: 'match',
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw error;

      // DIA: Filter out connected/requested users, show 80%+ match scores
      const filtered = (data || [])
        .filter((member: any) => {
          return (
            member.match_score >= 80 &&
            !connectedUserIds.has(member.id) &&
            !requestedUserIds.has(member.id)
          );
        })
        .slice(0, 12); // Limit to 12 suggestions

      return filtered;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(30,65%,55%)]" />
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sankofa className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No new suggestions right now</h3>
          <p className="text-muted-foreground">
            We'll notify you when we find great matches for you
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          People you should connect with
        </h3>
        <p className="text-sm text-muted-foreground">
          Based on your profile and shared interests
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((profile: any) => (
          <DiscoveryCard key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
};

export default SuggestionsTab;
