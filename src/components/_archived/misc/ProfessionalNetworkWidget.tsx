import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ConnectionButton } from './ConnectionButton';
import { calculateProfileCompletion } from '@/components/profile/ProfileCompletionBar';

interface NetworkSuggestion {
  id: string;
  username: string;
  full_name: string;
  headline: string;
  location: string;
  avatar_url: string;
  skills: string[];
  mutual_connections?: number;
  completion_score?: number;
}

export const ProfessionalNetworkWidget: React.FC = () => {
  const [suggestions, setSuggestions] = useState<NetworkSuggestion[]>([]);
  const [connectionStats, setConnectionStats] = useState({
    total: 0,
    thisWeek: 0,
    profileViews: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchNetworkData = async () => {
      try {
        // Get connection statistics
        const { data: connections } = await supabase
          .from('connections')
          .select('created_at')
          .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .eq('status', 'accepted');

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const stats = {
          total: connections?.length || 0,
          thisWeek: connections?.filter(c => new Date(c.created_at) > weekAgo).length || 0,
          profileViews: Math.floor(Math.random() * 50) + 10 // Placeholder until we implement view tracking
        };
        
        setConnectionStats(stats);

        // Get network suggestions (users not yet connected)
        const { data: profiles } = await supabase.rpc('get_public_profiles', {
          p_limit: 5
        });

        if (profiles) {
          // Filter out already connected users and current user
          const { data: existingConnections } = await supabase
            .from('connections')
            .select('requester_id, recipient_id')
            .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

          const connectedUserIds = new Set(
            existingConnections?.flatMap(c => [c.requester_id, c.recipient_id]).filter(id => id !== user.id) || []
          );
          connectedUserIds.add(user.id); // Exclude self

          const filteredProfiles = profiles
            .filter((p: any) => !connectedUserIds.has(p.id))
            .slice(0, 3)
            .map((p: any) => ({
              id: p.id,
              username: p.username || 'member',
              full_name: p.display_name || p.full_name || 'DNA Member',
              headline: p.headline || 'Professional',
              location: p.location || '',
              avatar_url: p.avatar_url,
              skills: p.skills || [],
              completion_score: calculateProfileCompletion(p)
            }));

          setSuggestions(filteredProfiles);
        }

      } catch (error) {
        // Error handled silently - widget will show loading state
      } finally {
        setIsLoading(false);
      }
    };

    fetchNetworkData();
  }, [user]);

  if (!user || isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading network data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-dna-forest" />
          Your Network
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Network Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-dna-copper">{connectionStats.total}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-dna-emerald">{connectionStats.thisWeek}</div>
            <div className="text-xs text-muted-foreground">This Week</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-dna-gold">{connectionStats.profileViews}</div>
            <div className="text-xs text-muted-foreground">Profile Views</div>
          </div>
        </div>

        {/* Network Suggestions - Removed duplicate. Use ConnectionSuggestionsWidget instead */}

        {/* Professional Insights */}
        <div className="pt-3 border-t">
          <div className="text-xs text-neutral-600 mb-2">
            💡 Complete your profile to get better connection suggestions
          </div>
          <div className="text-xs text-dna-emerald">
            Profile strength: {calculateProfileCompletion(profile)} pts
          </div>
        </div>

      </CardContent>
    </Card>
  );
};