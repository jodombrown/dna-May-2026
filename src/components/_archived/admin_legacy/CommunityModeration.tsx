import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle, XCircle, Star, Eye, Flag, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';

interface CommunityData {
  id: string;
  name: string;
  description: string;
  created_by: string;
  creator_name: string;
  creator_avatar: string;
  member_count: number;
  category: string;
  is_featured: boolean;
  is_active: boolean;
  moderation_status: string;
  created_at: string;
  tags: string[];
  moderator_notes?: string;
}

const CommunityModeration = () => {
  const [communities, setCommunities] = useState<CommunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityData | null>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('communities')
        .select(`
          id,
          name,
          description,
          created_by,
          member_count,
          category,
          is_featured,
          is_active,
          moderation_status,
          created_at,
          tags,
          moderator_notes,
          profiles!inner(display_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data?.map(community => ({
        id: community.id,
        name: community.name,
        description: community.description || '',
        created_by: community.created_by,
        creator_name: (community.profiles as any)?.display_name || 'Unknown',
        creator_avatar: (community.profiles as any)?.avatar_url || '',
        member_count: community.member_count || 0,
        category: community.category || 'General',
        is_featured: community.is_featured || false,
        is_active: community.is_active,
        moderation_status: community.moderation_status || 'approved',
        created_at: community.created_at,
        tags: community.tags || [],
        moderator_notes: community.moderator_notes
      })) || [];

      setCommunities(transformedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch communities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleModerationAction = async (
    communityId: string, 
    action: 'approve' | 'reject' | 'feature' | 'suspend'
  ) => {
    try {
      const updates: any = { moderated_at: new Date().toISOString() };
      
      switch (action) {
        case 'approve':
          updates.moderation_status = 'approved';
          updates.is_active = true;
          break;
        case 'reject':
          updates.moderation_status = 'rejected';
          updates.is_active = false;
          break;
        case 'feature':
          updates.is_featured = true;
          break;
        case 'suspend':
          updates.is_active = false;
          updates.moderation_status = 'suspended';
          break;
      }

      if (moderatorNotes) {
        updates.moderator_notes = moderatorNotes;
      }

      const { error } = await supabase
        .from('communities')
        .update(updates)
        .eq('id', communityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Community ${action}d successfully`,
      });

      fetchCommunities();
      setSelectedCommunity(null);
      setModeratorNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update community",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCommunities = communities.filter(c => c.moderation_status === 'pending');
  const activeCommunities = communities.filter(c => c.is_active && c.moderation_status === 'approved');

  if (loading) {
    return <Loader label="Loading communities..." />;
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{communities.length}</p>
            <p className="text-sm text-blue-600">Total Communities</p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingCommunities.length}</p>
            <p className="text-sm text-yellow-600">Pending Review</p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{activeCommunities.length}</p>
            <p className="text-sm text-green-600">Active</p>
          </div>
        </div>
        <div className="bg-copper-50 border border-copper-200 rounded-lg p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-copper-600">
              {communities.filter(c => c.is_featured).length}
            </p>
            <p className="text-sm text-copper-600">Featured</p>
          </div>
        </div>
      </div>

      {/* Pending Communities */}
      {pendingCommunities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Flag className="h-5 w-5 text-yellow-500" />
            Pending Review ({pendingCommunities.length})
          </h3>
          
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Community</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingCommunities.map((community) => (
                  <TableRow key={community.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{community.name}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {community.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={community.creator_avatar} />
                          <AvatarFallback>
                            {community.creator_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{community.creator_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{community.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{community.member_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(community.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedCommunity(community);
                              setModeratorNotes(community.moderator_notes || '');
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Review Community</DialogTitle>
                          </DialogHeader>
                          {selectedCommunity && (
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Community Name</label>
                                <p className="text-sm">{selectedCommunity.name}</p>
                              </div>
                              
                              <div>
                                <label className="text-sm font-medium">Description</label>
                                <p className="text-sm bg-neutral-50 p-3 rounded">
                                  {selectedCommunity.description}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Category</label>
                                  <p className="text-sm">{selectedCommunity.category}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Members</label>
                                  <p className="text-sm">{selectedCommunity.member_count}</p>
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Tags</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedCommunity.tags.map((tag, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="text-sm font-medium">Moderator Notes</label>
                                <Textarea
                                  value={moderatorNotes}
                                  onChange={(e) => setModeratorNotes(e.target.value)}
                                  placeholder="Add moderation notes..."
                                  rows={3}
                                />
                              </div>

                              <div className="flex justify-end gap-3">
                                <Button
                                  variant="destructive"
                                  onClick={() => handleModerationAction(selectedCommunity.id, 'reject')}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                                <Button
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleModerationAction(selectedCommunity.id, 'approve')}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* All Communities */}
      <div>
        <h3 className="text-lg font-semibold mb-4">All Communities</h3>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Community</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {communities.map((community) => (
                <TableRow key={community.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{community.name}</span>
                          {community.is_featured && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{community.category}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(community.moderation_status, community.is_active)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{community.member_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(community.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!community.is_featured && community.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModerationAction(community.id, 'feature')}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Feature
                        </Button>
                      )}
                      
                      {community.is_active && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleModerationAction(community.id, 'suspend')}
                        >
                          <Flag className="h-4 w-4 mr-1" />
                          Suspend
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default CommunityModeration;