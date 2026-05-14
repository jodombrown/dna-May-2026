
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Calendar } from 'lucide-react';
import { CommunityWithMembership } from '@/types/community';
import { formatDistanceToNow } from 'date-fns';

interface CommunityCardProps {
  community: CommunityWithMembership;
  onJoin: (communityId: string) => void;
  onLeave: (communityId: string) => void;
  onViewDetails: (communityId: string) => void;
}

const CommunityCard: React.FC<CommunityCardProps> = ({
  community,
  onJoin,
  onLeave,
  onViewDetails
}) => {
  const handleMembershipAction = () => {
    if (community.is_member) {
      onLeave(community.id);
    } else {
      onJoin(community.id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <div onClick={() => onViewDetails(community.id)}>
        {community.cover_image_url && (
          <div className="w-full h-48 overflow-hidden rounded-t-lg">
            <img
              src={community.cover_image_url}
              alt={community.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{community.name}</CardTitle>
              {community.category && (
                <Badge variant="outline" className="mb-2">
                  {community.category}
                </Badge>
              )}
            </div>
            {community.user_role === 'admin' && (
              <Badge className="bg-dna-gold text-white">Admin</Badge>
            )}
          </div>
        </CardHeader>
      </div>

      <CardContent className="space-y-4">
        {community.description && (
          <p className="text-neutral-600 text-sm line-clamp-3">
            {community.description}
          </p>
        )}

        {community.tags && community.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {community.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {community.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{community.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm text-neutral-600">
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{community.member_count} members</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(community.created_at), { addSuffix: true })}</span>
            </div>
          </div>

          <Button
            size="sm"
            variant={community.is_member ? "outline" : "default"}
            className={community.is_member ? "" : "bg-dna-emerald hover:bg-dna-forest text-white"}
            onClick={(e) => {
              e.stopPropagation();
              handleMembershipAction();
            }}
          >
            {community.is_member ? "Leave" : "Join"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommunityCard;
