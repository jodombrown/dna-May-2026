
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users as UsersIcon } from 'lucide-react';
import { Community } from '@/types/search';
import ConnectDialogs from './ConnectDialogs';
import CommunityJoinDialog from './CommunityJoinDialog';

interface CommunityCardProps {
  community: Community;
  onJoin: () => void;
  isLoggedIn: boolean;
}

const CommunityCard: React.FC<CommunityCardProps> = ({ community, onJoin, isLoggedIn }) => {
  const [isCommunityJoinDialogOpen, setIsCommunityJoinDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCommunityJoinDialogOpen(true);
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg">{community.name}</CardTitle>
          <Badge variant="outline">{community.category}</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600 mb-4">{community.description}</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <UsersIcon className="w-4 h-4" />
              {community.member_count} members
            </div>
            <Button 
              size="sm" 
              className="bg-dna-emerald hover:bg-dna-forest text-white"
              onClick={handleJoinClick}
            >
              Join
            </Button>
          </div>
        </CardContent>
      </Card>

      <CommunityJoinDialog
        open={isCommunityJoinDialogOpen}
        onOpenChange={setIsCommunityJoinDialogOpen}
        community={community}
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setIsConnectDialogOpen(true)}
        onProceed={() => {
          onJoin();
          setIsCommunityJoinDialogOpen(false);
        }}
      />

      <ConnectDialogs
        isConnectDialogOpen={isConnectDialogOpen}
        setIsConnectDialogOpen={setIsConnectDialogOpen}
        isMessageDialogOpen={false}
        setIsMessageDialogOpen={() => {}}
        isJoinCommunityDialogOpen={false}
        setIsJoinCommunityDialogOpen={() => {}}
        isRegisterEventDialogOpen={false}
        setIsRegisterEventDialogOpen={() => {}}
      />
    </>
  );
};

export default CommunityCard;
