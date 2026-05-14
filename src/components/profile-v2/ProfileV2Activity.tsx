import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Activity, BookOpen, ChevronRight, PenSquare } from 'lucide-react';
import { ProfileV2Activity as ActivityType, ProfileV2Visibility } from '@/types/profileV2';
import { useNavigate } from 'react-router-dom';
import { Sankofa } from '@/components/icons/adinkra';

interface ProfileV2ActivityProps {
  activity: ActivityType;
  visibility: ProfileV2Visibility;
  isOwner: boolean;
  username?: string;
}

const ProfileV2Activity: React.FC<ProfileV2ActivityProps> = ({
  activity,
  visibility,
  isOwner,
  username,
}) => {
  const navigate = useNavigate();

  // Hide if visibility is set to hidden and viewer is not owner
  if (visibility.activity === 'hidden' && !isOwner) {
    return null;
  }

  const hasActivity = activity.spaces.length > 0 || activity.events.length > 0 || (activity.connections_count ?? 0) > 0 || (activity.stories_count ?? 0) > 0;

  // Hide empty activity for public viewers
  if (!hasActivity && !isOwner) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          DNA Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Connections */}
          <div
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary/70 transition-colors"
            onClick={() => username ? navigate(`/dna/profile/${username}?tab=connections`) : navigate('/dna/connect')}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="font-medium text-xs sm:text-sm">Connections</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-primary">
              {activity.connections_count ?? 0}
            </span>
          </div>

          {/* Stories */}
          <div
            className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary/70 transition-colors"
            onClick={() => navigate('/dna/convey')}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <PenSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="font-medium text-xs sm:text-sm">Stories</span>
            </div>
            <span className="text-lg sm:text-xl font-bold text-primary">
              {activity.stories_count ?? 0}
            </span>
          </div>
        </div>

        {/* Spaces */}
        {activity.spaces.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                Spaces ({activity.spaces.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {activity.spaces.slice(0, 3).map((space) => (
                <div 
                  key={space.id} 
                  className="flex items-center justify-between p-2.5 hover:bg-secondary/50 rounded-lg transition-colors cursor-pointer group"
                  onClick={() => navigate(`/dna/collaborate/spaces/${space.id}`)}
                >
                  <span className="text-sm truncate flex-1 mr-2">{space.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {space.role}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
            {activity.spaces.length > 3 && (
              <button className="w-full text-xs text-primary hover:underline mt-2 text-left">
                +{activity.spaces.length - 3} more spaces
              </button>
            )}
          </div>
        )}

        {/* Events */}
        {activity.events.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                Events ({activity.events.length})
              </span>
            </div>
            <div className="space-y-1.5">
              {activity.events.slice(0, 3).map((event) => (
                <div 
                  key={event.id} 
                  className="flex items-center justify-between p-2.5 hover:bg-secondary/50 rounded-lg transition-colors cursor-pointer group"
                  onClick={() => navigate(`/dna/convene/events/${event.id}`)}
                >
                  <span className="text-sm truncate flex-1 mr-2">{event.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {event.role}
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
            {activity.events.length > 3 && (
              <button className="w-full text-xs text-primary hover:underline mt-2 text-left">
                +{activity.events.length - 3} more events
              </button>
            )}
          </div>
        )}

        {/* Empty State for Owner */}
        {!hasActivity && isOwner && (
          <div className="text-center py-6 px-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Sankofa className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Start your DNA journey</p>
            <p className="text-xs text-muted-foreground">
              Join spaces, attend events, and connect with the community
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileV2Activity;
