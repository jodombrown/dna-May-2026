
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users } from 'lucide-react';

interface ActivityTabContentProps {
  userPosts: any[];
  userEvents: any[];
  userCommunities: any[];
}

const ActivityTabContent: React.FC<ActivityTabContentProps> = ({
  userPosts,
  userEvents,
  userCommunities
}) => {
  return (
    <div className="space-y-6">
      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-dna-emerald" />
            Recent Posts ({userPosts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.slice(0, 3).map((post: any) => (
                <div key={post.id} className="p-4 bg-neutral-50 rounded-lg">
                  <p className="font-medium">{post.content?.substring(0, 100)}...</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500">No posts yet</p>
          )}
        </CardContent>
      </Card>

      {/* Communities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-dna-copper" />
            Communities ({userCommunities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userCommunities.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {userCommunities.map((community: any) => (
                <Badge key={community.id} variant="secondary">
                  {community.name}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500">No communities joined yet</p>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-dna-gold" />
            Events ({userEvents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userEvents.length > 0 ? (
            <div className="space-y-3">
              {userEvents.slice(0, 3).map((event: any) => (
                <div key={event.id} className="p-3 bg-neutral-50 rounded-lg">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-sm text-neutral-500">{event.date_time}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500">No events yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityTabContent;
