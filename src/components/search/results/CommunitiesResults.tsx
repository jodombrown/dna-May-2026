
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Community } from '@/hooks/useSearch';
import CommunityJoinDialog from '@/components/connect/CommunityJoinDialog';
import ConnectDialogs from '@/components/connect/ConnectDialogs';
import { supabase } from '@/integrations/supabase/client';

interface CommunitiesResultsProps {
  communities: Community[];
}

const CommunitiesResults: React.FC<CommunitiesResultsProps> = ({
  communities
}) => {
  const [selected, setSelected] = useState<Community | null>(null);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    }).catch(() => setIsLoggedIn(false));
  }, []);

  if (communities.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-neutral-900">Communities</h3>
      {communities.map((community) => (
        <Card key={community.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {community.name}
                </h3>
                {community.description && (
                  <p className="text-neutral-600 text-sm mt-1">
                    {community.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2">
                  {community.category && (
                    <Badge variant="outline">{community.category}</Badge>
                  )}
                  <span className="text-sm text-neutral-500">
                    {community.member_count} members
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                className="bg-dna-emerald hover:bg-dna-forest text-white"
                onClick={() => { setSelected(community); setIsJoinOpen(true); }}
              >
                Join
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <CommunityJoinDialog
        open={isJoinOpen}
        onOpenChange={setIsJoinOpen}
        community={selected}
        isLoggedIn={isLoggedIn}
        onOpenLogin={() => setIsConnectOpen(true)}
        onProceed={() => { setIsJoinOpen(false); }}
      />

      <ConnectDialogs
        isConnectDialogOpen={isConnectOpen}
        setIsConnectDialogOpen={setIsConnectOpen}
        isMessageDialogOpen={false}
        setIsMessageDialogOpen={() => {}}
        isJoinCommunityDialogOpen={false}
        setIsJoinCommunityDialogOpen={() => {}}
        isRegisterEventDialogOpen={false}
        setIsRegisterEventDialogOpen={() => {}}
      />
    </div>
  );
};

export default CommunitiesResults;
