// src/components/hubs/connect/ZeroConnectionsState.tsx
// Enhanced zero-connections state for Connect hub

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConnectIllustration } from '../shared/HubIllustrations';
import { Search, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { Sankofa } from '@/components/icons/adinkra';

interface SuggestedProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  headline?: string;
  profession?: string;
}

interface ZeroConnectionsStateProps {
  suggestions?: SuggestedProfile[];
  onDiscoverClick?: () => void;
}

export function ZeroConnectionsState({
  suggestions = [],
  onDiscoverClick
}: ZeroConnectionsStateProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const handleDiscover = () => {
    if (onDiscoverClick) {
      onDiscoverClick();
    } else {
      navigate('/dna/connect/discover');
    }
  };

  // Get personalized message based on profile
  const getPersonalizedMessage = () => {
    if (profile?.profession) {
      return `Based on your background in ${profile.profession}, you might connect with professionals across the diaspora.`;
    }
    if (profile?.africa_focus_areas?.length) {
      return `Based on your interest in ${profile.africa_focus_areas[0]}, discover professionals in similar regions.`;
    }
    return "The diaspora is 200 million strong. Let's find your people.";
  };

  return (
    <div className="text-center py-8 space-y-8">
      {/* Hero Section */}
      <div className="flex flex-col items-center">
        <div className="w-32 h-32 mb-6">
          <ConnectIllustration className="w-full h-full" />
        </div>

        <h2 className="text-2xl font-bold text-primary mb-2">
          Your Network Awaits
        </h2>

        <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
          {getPersonalizedMessage()}
        </p>
      </div>

      {/* DIA Insight Card */}
      <Card className="max-w-md mx-auto border-dna-emerald/20 bg-dna-emerald/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-dna-emerald/20 flex items-center justify-center flex-shrink-0">
              <Sankofa className="w-4 h-4 text-dna-emerald" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground mb-1">
                DIA Suggestion
              </p>
              <p className="text-sm text-muted-foreground">
                {profile?.profession
                  ? `I can help you find other ${profile.profession}s in the DNA community, or professionals with complementary skills.`
                  : "Complete your profile to get personalized connection suggestions based on your background and interests."
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary CTA */}
      <Button
        onClick={handleDiscover}
        size="lg"
        className="bg-dna-emerald hover:bg-dna-emerald/90 h-12 px-8"
      >
        <Search className="w-4 h-4 mr-2" />
        Discover People Like You
      </Button>

      {/* Suggested Profiles Preview (if available) */}
      {suggestions.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-center gap-4">
            <div className="h-px flex-1 max-w-[100px] bg-border" />
            <span className="text-sm text-muted-foreground">Suggested For You</span>
            <div className="h-px flex-1 max-w-[100px] bg-border" />
          </div>

          <div className="flex justify-center gap-3 flex-wrap">
            {suggestions.slice(0, 3).map((person) => (
              <Card
                key={person.id}
                className="w-[140px] cursor-pointer hover:border-dna-emerald transition-colors"
                onClick={() => navigate(`/dna/profile/${person.id}`)}
              >
                <CardContent className="p-3 text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {person.avatar_url ? (
                      <img
                        src={person.avatar_url}
                        alt={person.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">
                    {person.full_name?.split(' ')[0] || 'Member'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {person.headline || person.profession || 'DNA Member'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {suggestions.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDiscover}
              className="text-dna-emerald hover:text-dna-emerald/80"
            >
              See all suggestions
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      )}

      {/* Popular Categories */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-center gap-4">
          <div className="h-px flex-1 max-w-[100px] bg-border" />
          <span className="text-sm text-muted-foreground">Popular in Your Field</span>
          <div className="h-px flex-1 max-w-[100px] bg-border" />
        </div>

        <div className="flex justify-center gap-2 flex-wrap max-w-md mx-auto">
          {['Tech', 'Finance', 'Healthcare', 'Arts', 'Education', 'Entrepreneurship'].map((field) => (
            <Button
              key={field}
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dna/connect/discover?field=${field.toLowerCase()}`)}
              className="text-xs"
            >
              {field}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ZeroConnectionsState;
