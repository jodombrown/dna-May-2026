import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, Eye, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  ResponsiveModal,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
} from '@/components/ui/responsive-modal';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ReceivedApplication {
  application_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_avatar: string | null;
  applicant_headline: string | null;
  opportunity_id: string;
  opportunity_title: string;
  status: string;
  cover_letter: string | null;
  resume_url: string | null;
  applied_at: string;
  feedback: string | null;
  reviewed_at: string | null;
}

export default function ApplicationsReceived() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedApplication, setSelectedApplication] = useState<ReceivedApplication | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | 'review' | null>(null);
  const [feedback, setFeedback] = useState('');

  // Fetch received applications
  const { data: applications, isLoading } = useQuery({
    queryKey: ['received-applications'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_received_applications' as any);
      if (error) throw error;
      return (data ?? []) as unknown as ReceivedApplication[];
    },
  });

  // Update application status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      applicationId,
      status,
      feedback,
    }: {
      applicationId: string;
      status: string;
      feedback?: string;
    }) => {
      const { error } = await supabase.rpc('update_application_status' as any, {
        p_application_id: applicationId,
        p_status: status,
        p_feedback: feedback || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['received-applications'] });
      toast({
        title: 'Application updated',
        description: 'The applicant has been notified of the status change.',
      });
      closeDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update application',
        variant: 'destructive',
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'reviewing':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-neutral-500';
    }
  };

  const openActionDialog = (application: ReceivedApplication, action: 'accept' | 'reject' | 'review') => {
    setSelectedApplication(application);
    setActionType(action);
    setFeedback('');
  };

  const closeDialog = () => {
    setSelectedApplication(null);
    setActionType(null);
    setFeedback('');
  };

  const handleConfirmAction = () => {
    if (!selectedApplication || !actionType) return;

    const statusMap = {
      accept: 'accepted',
      reject: 'rejected',
      review: 'reviewing',
    };

    updateStatusMutation.mutate({
      applicationId: selectedApplication.application_id,
      status: statusMap[actionType],
      feedback: feedback || undefined,
    });
  };

  const getDialogTitle = () => {
    switch (actionType) {
      case 'accept':
        return 'Accept Application';
      case 'reject':
        return 'Decline Application';
      case 'review':
        return 'Mark as Under Review';
      default:
        return 'Update Application';
    }
  };

  const getDialogDescription = () => {
    switch (actionType) {
      case 'accept':
        return 'This will accept the application and notify the applicant.';
      case 'reject':
        return 'This will decline the application. You can provide feedback to the applicant.';
      case 'review':
        return 'This will mark the application as under review and notify the applicant.';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Applications Received</h1>
          <p className="text-muted-foreground">
            Review and manage applications for your opportunities
          </p>
        </div>

        {!applications || applications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">
                You haven't received any applications yet
              </p>
              <Button onClick={() => navigate('/dna/contribute')}>
                View Your Opportunities
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <Card key={application.application_id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar
                        className="h-12 w-12 cursor-pointer"
                        onClick={() => navigate(`/u/${application.applicant_id}`)}
                      >
                        <AvatarImage src={application.applicant_avatar || ''} />
                        <AvatarFallback>
                          {application.applicant_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle
                          className="text-lg cursor-pointer hover:text-primary transition-colors"
                          onClick={() => navigate(`/u/${application.applicant_id}`)}
                        >
                          {application.applicant_name}
                        </CardTitle>
                        {application.applicant_headline && (
                          <p className="text-sm text-muted-foreground truncate">
                            {application.applicant_headline}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          Applied for: <span className="font-medium">{application.opportunity_title}</span>
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(application.status)}>
                      {application.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {application.cover_letter && (
                    <div className="mb-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Cover Letter:</p>
                      <p className="text-sm line-clamp-3">{application.cover_letter}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>Applied {format(new Date(application.applied_at), 'MMM d, yyyy')}</span>
                    </div>
                    {application.resume_url && (
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View Resume
                      </a>
                    )}
                    {application.reviewed_at && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>Reviewed {format(new Date(application.reviewed_at), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </div>

                  {application.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openActionDialog(application, 'review')}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Mark as Reviewing
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openActionDialog(application, 'accept')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openActionDialog(application, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {application.status === 'reviewing' && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => openActionDialog(application, 'accept')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openActionDialog(application, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}

                  {application.feedback && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1 font-medium">Your Feedback:</p>
                      <p className="text-sm">{application.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!selectedApplication && !!actionType} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <ResponsiveModalHeader>
            <ResponsiveModalTitle>{getDialogTitle()}</ResponsiveModalTitle>
            <ResponsiveModalDescription>{getDialogDescription()}</ResponsiveModalDescription>
          </ResponsiveModalHeader>

          {selectedApplication && (
            <div className="py-4">
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedApplication.applicant_avatar || ''} />
                  <AvatarFallback>
                    {selectedApplication.applicant_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedApplication.applicant_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedApplication.opportunity_title}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="feedback">
                    Feedback {actionType === 'reject' ? '(recommended)' : '(optional)'}
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="Add a message for the applicant..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

          <ResponsiveModalFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={updateStatusMutation.isPending}
              className={
                actionType === 'accept'
                  ? 'bg-green-600 hover:bg-green-700'
                  : actionType === 'reject'
                  ? 'bg-destructive hover:bg-destructive/90'
                  : ''
              }
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirm
            </Button>
          </ResponsiveModalFooter>
        </ResponsiveModal>
    </div>
  );
}
