import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Activity } from '@/types/activity';
import { formatDistanceToNow } from 'date-fns';
import { Mpatapo } from '@/components/icons/adinkra';

interface FeedStoryCardProps {
  activity: Activity;
}

export const FeedStoryCard: React.FC<FeedStoryCardProps> = ({ activity }) => {
  const navigate = useNavigate();
  const storyData = activity.entity_data;

  const handleViewProfile = () => {
    navigate(`/dna/${activity.actor_username}`);
  };

  const handleViewStory = () => {
    navigate(`/dna/story/${storyData.slug || storyData.story_id}`);
  };

  const getStoryTypeLabel = (type: string) => {
    switch (type) {
      case 'impact':
        return 'Impact Story';
      case 'update':
        return 'Update';
      default:
        return 'Story';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="bg-copper-100 dark:bg-copper-900/20 p-2 rounded-full">
            {storyData.story_type === 'impact' ? (
              <Mpatapo className="h-5 w-5 text-copper-600 dark:text-copper-400" />
            ) : (
              <FileText className="h-5 w-5 text-copper-600 dark:text-copper-400" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-10 w-10 cursor-pointer" onClick={handleViewProfile}>
                <AvatarImage src={activity.actor_avatar_url} alt={activity.actor_full_name} />
                <AvatarFallback>
                  {(activity.actor_full_name || 'DN').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <p className="text-sm">
                  <span 
                    className="font-semibold hover:underline cursor-pointer"
                    onClick={handleViewProfile}
                  >
                    {activity.actor_full_name}
                  </span>
                  {' '}published a new {getStoryTypeLabel(storyData.story_type).toLowerCase()}
                </p>
                
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {/* Story Details */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-base flex-1">{storyData.story_title}</h4>
                <Badge variant={storyData.story_type === 'impact' ? 'default' : 'secondary'} className="text-xs">
                  {getStoryTypeLabel(storyData.story_type)}
                </Badge>
              </div>
              
              {storyData.story_subtitle && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {storyData.story_subtitle}
                </p>
              )}
              
              {activity.metadata.focus_areas && activity.metadata.focus_areas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {activity.metadata.focus_areas.slice(0, 3).map((area: string) => (
                    <Badge key={area} variant="outline" className="text-xs">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-3">
              <Button
                size="sm"
                onClick={handleViewStory}
              >
                Read Story
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
