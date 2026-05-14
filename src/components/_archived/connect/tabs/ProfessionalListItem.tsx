import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, MessageSquare, UserPlus, MoreHorizontal, Share, ThumbsUp, Check, Clock, Loader2 } from 'lucide-react';
import { MockProfessional } from '@/components/connect/tabs/ProfessionalsMockData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { connectionService } from '@/services/connectionService';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface ProfessionalListItemProps {
  professional: MockProfessional;
}

const ProfessionalListItem: React.FC<ProfessionalListItemProps> = ({ professional }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState('');

  const { data: connectionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['connection-status', professional.id],
    queryFn: () => connectionService.getConnectionStatus(professional.id),
  });

  const sendRequestMutation = useMutation({
    mutationFn: ({ userId, message }: { userId: string; message?: string }) =>
      connectionService.sendConnectionRequest(userId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connection-status', professional.id] });
      setShowConnectDialog(false);
      setConnectionMessage('');
      toast({ title: 'Connection request sent!' });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to send request',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleConnect = () => {
    setShowConnectDialog(true);
  };

  const handleSendRequest = () => {
    sendRequestMutation.mutate({
      userId: professional.id,
      message: connectionMessage.trim() || undefined,
    });
  };

  const getConnectionButton = () => {
    if (statusLoading) {
      return (
        <Button size="sm" disabled>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Loading
        </Button>
      );
    }

    switch (connectionStatus) {
      case 'accepted':
        return (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => navigate(`/network`)}
          >
            <Check className="w-4 h-4 text-green-600" />
            Connected
          </Button>
        );
      case 'pending_sent':
        return (
          <Button variant="outline" size="sm" disabled className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Request Sent
          </Button>
        );
      case 'pending_received':
        return (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/network?tab=requests')}
            className="flex items-center gap-1"
          >
            <Clock className="w-4 h-4 text-orange-600" />
            Respond to Request
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            className="bg-dna-emerald hover:bg-dna-forest text-white flex items-center gap-1"
            onClick={handleConnect}
          >
            <UserPlus className="w-4 h-4" />
            Connect
          </Button>
        );
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16">
                <AvatarImage src={professional.avatar} alt={professional.name} />
                <AvatarFallback className="bg-gradient-to-br from-dna-copper to-dna-emerald text-white">
                  {professional.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              {professional.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg mb-1">{professional.name}</CardTitle>
                  <p className="text-dna-copper font-medium">{professional.title}</p>
                  <p className="text-neutral-600 text-sm">{professional.company}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getConnectionButton()}
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-2 text-sm text-neutral-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{professional.location}</span>
                </div>
                <span>•</span>
                <span>Originally from {professional.origin}</span>
                {professional.mutualConnections > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-dna-emerald">
                      {professional.mutualConnections} mutual connections
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-neutral-700">{professional.bio}</p>

          <div>
            <div className="text-sm font-medium text-neutral-700 mb-2">Key Skills</div>
            <div className="flex flex-wrap gap-2">
              {professional.skills.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-neutral-50 rounded-lg p-3">
            <div className="text-sm text-neutral-600">Recent Activity:</div>
            <div className="text-sm font-medium">{professional.recentActivity}</div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex gap-6 text-sm text-neutral-600">
              <span>{professional.followers.toLocaleString()} followers</span>
              <span>{professional.connections.toLocaleString()} connections</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                Endorse
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Share className="w-4 h-4" />
                Share Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with {professional.name}</DialogTitle>
            <DialogDescription>
              Send a connection request to {professional.name}. You can include a personalized message to
              introduce yourself.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Hi, I'd like to connect with you because..."
              value={connectionMessage}
              onChange={(e) => setConnectionMessage(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-neutral-500 mt-2">Optional: Add a note to your connection request</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendRequest}
              disabled={sendRequestMutation.isPending}
              className="bg-dna-emerald hover:bg-dna-forest text-white"
            >
              {sendRequestMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfessionalListItem;
