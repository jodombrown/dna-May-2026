import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TrendingUp, Users, MessageSquare, User } from 'lucide-react';
import { matchingService, MatchScore } from '@/services/matchingService';
import { Professional } from '@/types/search';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Sankofa } from '@/components/icons/adinkra';

interface SmartRecommendationsProps {
  onConnect: (professionalId: string) => void;
  onMessage: (professionalId: string, professionalName: string) => void;
  className?: string;
}

export const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  onConnect,
  onMessage,
  className
}) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Professional[]>([]);
  const [matchScores, setMatchScores] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id]);

  const loadRecommendations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get smart recommendations
      const recs = await matchingService.getSmartRecommendations(user.id);
      setRecommendations(recs);

      // Get match scores for each recommendation
      const scores = await matchingService.findMatches(user.id, {
        isLookingForMentor: true,
        isLookingForInvestor: true
      });
      setMatchScores(scores);
    } catch (error) {
      // Error handled silently - recommendations will remain empty
    } finally {
      setLoading(false);
    }
  };

  const getMatchScore = (professionalId: string): MatchScore | undefined => {
    return matchScores.find(score => score.professionalId === professionalId);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sankofa className="w-5 h-5 text-dna-emerald" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[160px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sankofa className="w-5 h-5 text-dna-emerald" />
          Smart Recommendations
          <Badge variant="secondary" className="ml-2">
            AI-Powered
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Curated connections based on your profile and goals
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {recommendations.slice(0, 5).map((professional) => {
          const matchScore = getMatchScore(professional.id);
          
          return (
            <div key={professional.id} className="group">
              <div className="flex items-start gap-4 p-4 rounded-lg border border-transparent hover:border-dna-emerald/20 hover:bg-dna-emerald/5 transition-all">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={professional.avatar_url} />
                  <AvatarFallback className="bg-dna-emerald/10 text-dna-emerald">
                    <User className="w-6 h-6" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">
                      {professional.full_name}
                    </h4>
                    {matchScore && (
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getScoreColor(matchScore.score)}`}
                      >
                        {Math.round(matchScore.score)}% match
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {professional.headline || professional.profession}
                  </p>
                  
                  {professional.location && (
                    <p className="text-xs text-muted-foreground">
                      📍 {professional.location}
                    </p>
                  )}

                  {/* Match reasons */}
                  {matchScore?.reasons && matchScore.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {matchScore.reasons.slice(0, 2).map((reason, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className="text-xs bg-dna-copper/10 text-dna-copper"
                        >
                          {reason}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Professional badges */}
                  <div className="flex items-center gap-2">
                    {professional.is_mentor && (
                      <Badge variant="outline" className="text-xs border-green-200 text-green-700">
                        Mentor
                      </Badge>
                    )}
                    {professional.is_investor && (
                      <Badge variant="outline" className="text-xs border-blue-200 text-blue-700">
                        Investor
                      </Badge>
                    )}
                    {professional.looking_for_opportunities && (
                      <Badge variant="outline" className="text-xs border-copper-200 text-copper-700">
                        Open to Opportunities
                      </Badge>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onConnect(professional.id)}
                      className="text-xs border-dna-emerald text-dna-emerald hover:bg-dna-emerald hover:text-white"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      Connect
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMessage(professional.id, professional.full_name)}
                      className="text-xs border-dna-copper text-dna-copper hover:bg-dna-copper hover:text-white"
                    >
                      <MessageSquare className="w-3 h-3 mr-1" />
                      Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {recommendations.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Complete your profile to get personalized recommendations</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <Button 
            variant="outline" 
            className="w-full border-dna-emerald text-dna-emerald hover:bg-dna-emerald hover:text-white"
            onClick={loadRecommendations}
          >
            <Sankofa className="w-4 h-4 mr-2" />
            Refresh Recommendations
          </Button>
        )}
      </CardContent>
    </Card>
  );
};