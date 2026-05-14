import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Globe, MapPin, Lightbulb, UserPlus, Users, Heart, Flag, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { ConnectionRequestModal } from './ConnectionRequestModal';
import { ActivityIndicator } from '@/components/profile/ActivityIndicator';
import { TYPOGRAPHY } from '@/lib/typography.config';
import { connectionService } from '@/services/connectionService';
import { ConnectionRecommendation } from '@/types/connections';
import { Sankofa } from '@/components/icons/adinkra';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getErrorMessage } from '@/lib/errorLogger';

interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  company?: string;
  location?: string;
  country_of_origin?: string;
  intentions?: string[];
  africa_focus_areas?: string[]; // DB stores as string array
  [key: string]: any; // Allow other profile fields
}

// Icon mapping for match reasons
const getReasonIcon = (reason: string) => {
  if (reason.includes('skill')) return Sankofa;
  if (reason.includes('interest')) return Heart;
  if (reason.includes('heritage') || reason.includes('Heritage')) return Flag;
  if (reason.includes('mutual') || reason.includes('connection')) return Users;
  if (reason.includes('region') || reason.includes('Region')) return MapPin;
  return Lightbulb;
};

export const ConnectionSuggestionsWidget = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [dismissingId, setDismissingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Use the DIA algorithm via RPC for smart recommendations
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['dia-connection-recommendations', user?.id],
    queryFn: () => connectionService.getConnectionRecommendations(6),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const handleConnect = (profile: Profile) => {
    setSelectedUser(profile);
    setModalOpen(true);
  };

  const handleSendRequest = async (note: string) => {
    if (!selectedUser) return;
    
    setConnectingTo(selectedUser.id);
    
    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user!.id,
          recipient_id: selectedUser.id,
          status: 'pending',
          message: note || null,
        });

      if (error) throw error;

      toast({
        title: 'Connection request sent!',
        description: 'You\'ll be notified when they respond.',
      });
      
      // Invalidate queries to refresh suggestions
      queryClient.invalidateQueries({ queryKey: ['dia-connection-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-requests'] });
      queryClient.invalidateQueries({ queryKey: ['connection-status'] });

    } catch (error: unknown) {
      toast({
        title: 'Failed to send request',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
      throw error; // Re-throw so modal knows to stay open
    } finally {
      setConnectingTo(null);
    }
  };

  const handleDismiss = async (userId: string, userName: string) => {
    setDismissingId(userId);
    try {
      await connectionService.dismissRecommendation(userId);
      toast({
        title: 'Suggestion dismissed',
        description: `${userName} won't appear in your suggestions.`,
      });
      // Invalidate to refresh the list
      queryClient.invalidateQueries({ queryKey: ['dia-connection-recommendations'] });
    } catch (error: unknown) {
      toast({
        title: 'Failed to dismiss',
        description: getErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setDismissingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sankofa className="h-5 w-5 text-primary" />
            DIA Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" showText />
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sankofa className="h-5 w-5 text-primary" />
            DIA Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No suggestions available yet. Complete your profile to see suggestions!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sankofa className="h-5 w-5 text-primary" />
            DIA Suggestions
            <Badge variant="outline" className="ml-auto text-xs font-normal">
              AI Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.map((rec) => {
            const profileForModal: Profile = {
              id: rec.user_id,
              full_name: rec.full_name,
              avatar_url: rec.avatar_url,
              headline: rec.headline,
              location: rec.location,
            };

            return (
              <div
                key={rec.user_id}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <Avatar className="h-12 w-12 cursor-pointer" onClick={() => navigate(`/u/${rec.username}`)}>
                  <AvatarImage src={rec.avatar_url} alt={rec.full_name} />
                  <AvatarFallback>
                    {rec.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <h4
                    className={`${TYPOGRAPHY.h5} truncate cursor-pointer hover:text-dna-emerald transition-colors`}
                    onClick={() => navigate(`/u/${rec.username}`)}
                  >
                    {rec.full_name}
                    {rec.username && (
                      <span className={`${TYPOGRAPHY.caption} ml-1`}>
                        @{rec.username}
                      </span>
                    )}
                  </h4>
                  {rec.headline && (
                    <p className={`${TYPOGRAPHY.caption} truncate`}>
                      {rec.headline}
                    </p>
                  )}
                  {rec.location && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className={TYPOGRAPHY.caption}>{rec.location}</span>
                    </div>
                  )}

                  {/* Match Score & Reasons */}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant={rec.match_score >= 50 ? 'default' : 'secondary'}
                          className={`text-xs cursor-help ${rec.match_score >= 70 ? 'bg-dna-emerald hover:bg-dna-forest' : ''}`}
                        >
                          {Math.round(rec.match_score)}% match
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Why you're matched:</p>
                          <ul className="text-xs space-y-1">
                            {rec.match_reasons.map((reason, idx) => {
                              const Icon = getReasonIcon(reason);
                              return (
                                <li key={idx} className="flex items-center gap-2">
                                  <Icon className="h-3 w-3 text-dna-emerald" />
                                  <span>{reason}</span>
                                </li>
                              );
                            })}
                          </ul>
                          <div className="pt-2 border-t text-xs text-muted-foreground">
                            <p>Skills: {rec.shared_skills_count} shared</p>
                            <p>Interests: {rec.shared_interests_count} shared</p>
                            <p>Mutual connections: {rec.mutual_connections_count}</p>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>

                    {/* Show top reason icons */}
                    <div className="flex items-center gap-1">
                      {rec.match_reasons.slice(0, 2).map((reason, idx) => {
                        const Icon = getReasonIcon(reason);
                        return (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <div className="p-1 rounded-full bg-muted cursor-help">
                                <Icon className="h-3 w-3 text-dna-emerald" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <span className="text-xs">{reason}</span>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDismiss(rec.user_id, rec.full_name)}
                        disabled={dismissingId === rec.user_id}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        {dismissingId === rec.user_id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <span className="text-xs">Not interested</span>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleConnect(profileForModal)}
                    disabled={connectingTo === rec.user_id}
                    className="shrink-0 min-w-[44px] min-h-[44px] bg-dna-emerald hover:bg-dna-forest"
                  >
                    {connectingTo === rec.user_id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <><UserPlus className="h-3 w-3 mr-1" /> Connect</>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate('/dna/discover')}
          >
            See all suggestions &rarr;
          </Button>
        </CardContent>

        <ConnectionRequestModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedUser(null);
          }}
          onSend={handleSendRequest}
          targetUser={selectedUser}
        />
      </Card>
    </TooltipProvider>
  );
};
