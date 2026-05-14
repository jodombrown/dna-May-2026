import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, Briefcase, UserPlus } from 'lucide-react';
import { MateMasie } from '@/components/icons/adinkra';

interface RecommendationsStepProps {
  data: any;
  updateData: (data: any) => void;
}

interface Recommendation {
  id: string;
  type: 'community' | 'event' | 'project' | 'user';
  title: string;
  description: string;
  reasons: string[];
  score: number;
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: '1',
    type: 'community',
    title: 'African Tech Founders',
    description: 'A community of technology entrepreneurs building solutions for Africa',
    reasons: ['Matches your founder profile', 'Aligns with tech sector interest'],
    score: 95
  },
  {
    id: '2',
    type: 'event',
    title: 'Diaspora Investment Summit 2024',
    description: 'Annual summit connecting diaspora investors with African opportunities',
    reasons: ['Matches your funding interests', 'Aligns with contribute pillar'],
    score: 88
  },
  {
    id: '3',
    type: 'project',
    title: 'African EdTech Initiative',
    description: 'Collaborative project to improve education access across Africa',
    reasons: ['Matches your impact goals', 'Needs your technical skills'],
    score: 82
  },
  {
    id: '4',
    type: 'user',
    title: 'Amara Okafor',
    description: 'Product Manager at major fintech, interested in African market expansion',
    reasons: ['Similar professional background', 'Shared collaboration interests'],
    score: 78
  }
];

const getIcon = (type: string) => {
  switch (type) {
    case 'community': return Users;
    case 'event': return Calendar;
    case 'project': return Briefcase;
    case 'user': return UserPlus;
    default: return MateMasie;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'community': return 'dna-emerald';
    case 'event': return 'dna-copper';
    case 'project': return 'dna-gold';
    case 'user': return 'dna-mint';
    default: return 'gray';
  }
};

// Utility: validate UUID shape
const isUuid = (val: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

// For mock recommendation IDs (like "1", "2"), generate a deterministic mock UUID
const toMockUuid = (val: string) => {
  const clean = (val || '0').toString().replace(/[^0-9a-f]/gi, '');
  const tail = (clean + '0'.repeat(12)).slice(0, 12).toLowerCase();
  return `00000000-0000-0000-0000-${tail}`;
};

const getActionText = (type: string) => {
  switch (type) {
    case 'community': return 'Join Community';
    case 'event': return 'Show Interest';
    case 'project': return 'Get Involved';
    case 'user': return 'Connect';
    default: return 'Learn More';
  }
};

const RecommendationsStep: React.FC<RecommendationsStepProps> = ({ data, updateData }) => {
  const { toast } = useToast();
  const [recommendations] = useState<Recommendation[]>(MOCK_RECOMMENDATIONS);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate recommendations based on user data
  useEffect(() => {
    // In a real implementation, this would call a recommendation engine
    // that analyzes user_type, selected_pillars, what_to_give, what_to_receive, etc.
    // For now, we'll use mock data that adapts to user input
  }, [data]);

  const handleSelection = async (recommendationId: string, recommendation: Recommendation) => {
    try {
      setIsLoading(true);
      
      // Toggle selection
      const newSelections = selectedItems.includes(recommendationId)
        ? selectedItems.filter(id => id !== recommendationId)
        : [...selectedItems, recommendationId];
      
      setSelectedItems(newSelections);

// Save selection to database
      if (newSelections.includes(recommendationId)) {
        const selectionType = {
          community: 'community_join',
          event: 'event_interest', 
          project: 'project_interest',
          user: 'user_connect'
        }[recommendation.type] as 'community_join' | 'event_interest' | 'project_interest' | 'user_connect';

        const targetId = isUuid(recommendationId) ? recommendationId : toMockUuid(recommendationId);

        const { error } = await supabase
          .from('user_onboarding_selections')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            selection_type: selectionType,
            target_id: targetId,
            target_title: recommendation.title
          });

        if (error) throw error;

        toast({
          title: "Selection saved!",
          description: `You've expressed interest in ${recommendation.title}`,
        });
      } else {
        // Remove selection from database
        const targetId = isUuid(recommendationId) ? recommendationId : toMockUuid(recommendationId);
        const { error } = await supabase
          .from('user_onboarding_selections')
          .delete()
          .eq('target_id', targetId);

        if (error) throw error;
      }

      // Update form data
      updateData({ onboarding_selections: newSelections });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your selection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-dna-forest mb-2">
          Recommended for You
        </h2>
        <p className="text-neutral-600">
          Based on your profile, here are communities, events, and opportunities we think you'll love.
        </p>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec) => {
          const IconComponent = getIcon(rec.type);
          const typeColor = getTypeColor(rec.type);
          const isSelected = selectedItems.includes(rec.id);
          
          return (
            <Card 
              key={rec.id}
              className={`transition-all duration-200 hover:shadow-md ${
                isSelected ? `ring-2 ring-${typeColor} bg-${typeColor}/5` : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-full bg-${typeColor}/10 flex-shrink-0`}>
                    <IconComponent className={`w-6 h-6 text-${typeColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-dna-forest">
                            {rec.title}
                          </h3>
                          <Badge variant="secondary" className={`bg-${typeColor}/10 text-${typeColor}`}>
                            {rec.score}% match
                          </Badge>
                        </div>
                        
                        <p className="text-neutral-600 mb-3">
                          {rec.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {rec.reasons.map((reason, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleSelection(rec.id, rec)}
                        disabled={isLoading}
                        className={isSelected ? `bg-${typeColor} hover:bg-${typeColor}/90` : ''}
                      >
                        {isSelected ? 'Selected' : getActionText(rec.type)}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedItems.length > 0 && (
        <div className="text-center p-4 bg-dna-emerald/5 rounded-lg">
          <p className="text-sm text-dna-forest font-medium">
            {selectedItems.length} selection{selectedItems.length > 1 ? 's' : ''} saved
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            You can explore these later in your dashboard
          </p>
        </div>
      )}
    </div>
  );
};

export default RecommendationsStep;