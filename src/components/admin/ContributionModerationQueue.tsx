import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Flag, Eye, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';

interface ContributionRequest {
  id: string;
  user_id: string;
  impact_type: string;
  description: string;
  country_focus: string;
  evidence_links: string[];
  status: string;
  created_at: string;
  user_name: string;
  user_email: string;
  admin_notes?: string;
}

const ContributionModerationQueue = () => {
  const [requests, setRequests] = useState<ContributionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ContributionRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchContributionRequests();
  }, []);

  const fetchContributionRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('adin_contributor_requests')
        .select(`
          id,
          user_id,
          impact_type,
          description,
          country_focus,
          evidence_links,
          status,
          created_at,
          admin_notes,
          profiles!inner(display_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData = data?.map(item => ({
        id: item.id,
        user_id: item.user_id,
        impact_type: item.impact_type,
        description: item.description,
        country_focus: item.country_focus,
        evidence_links: item.evidence_links || [],
        status: item.status,
        created_at: item.created_at,
        user_name: (item.profiles as any)?.display_name || 'Unknown',
        user_email: (item.profiles as any)?.email || '',
        admin_notes: item.admin_notes
      })) || [];

      setRequests(transformedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch contribution requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('adin_contributor_requests')
        .update({ 
          status,
          reviewed_by: user.user.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: reviewNotes || undefined
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });

      fetchContributionRequests();
      setSelectedRequest(null);
      setReviewNotes('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500 text-white"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 text-white"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(req => req.status === 'pending');
  const processedRequests = requests.filter(req => req.status !== 'pending');

  if (loading) {
    return <Loader label="Loading contribution requests..." />;
  }

  return (
    <div className="space-y-8">
      {/* Pending Queue */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Pending Review ({pendingRequests.length})</h3>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contributor</TableHead>
                <TableHead>Impact Type</TableHead>
                <TableHead>Country Focus</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.user_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{request.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.impact_type}</Badge>
                  </TableCell>
                  <TableCell>{request.country_focus}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setReviewNotes(request.admin_notes || '');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Review Contribution Request</DialogTitle>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-medium">Contributor</label>
                                <p className="text-sm">{selectedRequest.user_name}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium">Impact Type</label>
                                <p className="text-sm">{selectedRequest.impact_type}</p>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-medium">Description</label>
                              <p className="text-sm bg-neutral-50 p-3 rounded mt-1">
                                {selectedRequest.description}
                              </p>
                            </div>

                            {selectedRequest.evidence_links.length > 0 && (
                              <div>
                                <label className="text-sm font-medium">Evidence Links</label>
                                <div className="space-y-1 mt-1">
                                  {selectedRequest.evidence_links.map((link, idx) => (
                                    <a 
                                      key={idx}
                                      href={link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline block"
                                    >
                                      {link}
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <label className="text-sm font-medium">Review Notes</label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add review notes..."
                                rows={3}
                              />
                            </div>

                            <div className="flex justify-end gap-3">
                              <Button
                                variant="destructive"
                                onClick={() => handleStatusUpdate(selectedRequest.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                              <Button
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleStatusUpdate(selectedRequest.id, 'approved')}
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

        {pendingRequests.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No pending requests</p>
          </div>
        )}
      </div>

      {/* Processed Requests */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Flag className="h-5 w-5 text-neutral-500" />
          <h3 className="text-lg font-semibold">Recently Processed ({processedRequests.length})</h3>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contributor</TableHead>
                <TableHead>Impact Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedRequests.slice(0, 10).map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{request.user_name || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{request.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{request.impact_type}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString()}
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

export default ContributionModerationQueue;