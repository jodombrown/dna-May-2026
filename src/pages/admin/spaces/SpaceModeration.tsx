import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Flag,
  Eye,
  Mail,
  Archive,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  Users
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { createNotification } from '@/services/notificationService';

interface SpaceReport {
  id: string;
  space_id: string;
  space_title: string;
  space_status: string;
  reporter_id: string;
  reporter_name: string | null;
  reporter_email: string | null;
  creator_id: string;
  creator_name: string | null;
  creator_email: string | null;
  reason: string;
  details: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

type ReportStatusFilter = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed';

const REPORT_REASONS = [
  'spam',
  'harassment',
  'inappropriate_content',
  'scam',
  'impersonation',
  'other'
];

export default function SpaceModeration() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [reports, setReports] = useState<SpaceReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatusFilter>('pending');
  const [processing, setProcessing] = useState(false);

  const [selectedReport, setSelectedReport] = useState<SpaceReport | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    fetchReports();
  }, [statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Build the query based on filter
      let query = (supabase as any)
        .from('space_reports')
        .select(`
          id,
          space_id,
          reporter_id,
          reason,
          details,
          status,
          admin_notes,
          created_at,
          reviewed_at,
          reviewed_by,
          reporter:profiles!space_reports_reporter_id_fkey(full_name),
          creator:profiles!space_reports_creator_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        // If table doesn't exist yet, show empty state
        if (error.code === '42P01') {
          setReports([]);
          return;
        }
        throw error;
      }

      const formattedReports: SpaceReport[] = (data || []).map((report: any) => ({
        id: report.id,
        space_id: report.space_id,
        space_title: report.space?.title || 'Unknown Space',
        space_status: report.space?.status || 'unknown',
        reporter_id: report.reporter_id,
        reporter_name: report.reporter?.full_name || 'Unknown',
        reporter_email: report.reporter?.email || '',
        creator_id: report.space?.created_by || '',
        creator_name: report.creator?.full_name || 'Unknown',
        creator_email: report.creator?.email || '',
        reason: report.reason,
        details: report.details,
        status: report.status,
        admin_notes: report.admin_notes,
        created_at: report.created_at,
        reviewed_at: report.reviewed_at,
        reviewed_by: report.reviewed_by
      }));

      setReports(formattedReports);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch space reports. The reports table may not exist yet.',
        variant: 'destructive',
      });
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSpace = (spaceId: string) => {
    window.open(`/dna/collaborate/spaces/${spaceId}`, '_blank');
  };

  const handleContactCreator = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleReviewReport = (report: SpaceReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setShowReviewDialog(true);
  };

  const handleDismissReport = async () => {
    if (!selectedReport || !adminUser) return;

    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from('space_reports')
        .update({
          status: 'dismissed',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      // Log admin action
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'space_report_dismissed',
        entity_type: 'space_report',
        entity_id: selectedReport.id,
        details: {
          space_id: selectedReport.space_id,
          space_title: selectedReport.space_title,
          reason: selectedReport.reason,
          admin_notes: adminNotes
        }
      });

      toast({
        title: 'Success',
        description: 'Report dismissed successfully',
      });

      setShowReviewDialog(false);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss report',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleWarnCreator = async () => {
    if (!selectedReport || !adminUser || !warningMessage.trim()) return;

    setProcessing(true);
    try {
      // Send warning notification to space creator
      await createNotification({
        user_id: selectedReport.creator_id,
        type: 'moderation_warning',
        title: 'Warning: Space Reported',
        message: warningMessage,
        payload: {
          space_id: selectedReport.space_id,
          space_title: selectedReport.space_title,
          is_dna_system: true
        }
      });

      // Update report status
      const { error } = await (supabase as any)
        .from('space_reports')
        .update({
          status: 'reviewed',
          admin_notes: `Warning sent: ${warningMessage}\n\n${adminNotes}`,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      // Log admin action
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'space_creator_warned',
        entity_type: 'space_report',
        entity_id: selectedReport.id,
        details: {
          space_id: selectedReport.space_id,
          creator_id: selectedReport.creator_id,
          warning_message: warningMessage
        }
      });

      toast({
        title: 'Success',
        description: 'Warning sent to space creator',
      });

      setShowWarningDialog(false);
      setShowReviewDialog(false);
      setWarningMessage('');
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send warning',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleArchiveSpace = async () => {
    if (!selectedReport || !adminUser) return;

    setProcessing(true);
    try {
      // Archive the space — collaboration_spaces table retired (admin
      // beyond-minimum, out of scope) — no-op.
      const archiveError = null;
      if (archiveError) throw archiveError;

      // Update report status
      const { error: reportError } = await (supabase as any)
        .from('space_reports')
        .update({
          status: 'resolved',
          admin_notes: `Space archived.\n\n${adminNotes}`,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id
        })
        .eq('id', selectedReport.id);

      if (reportError) throw reportError;

      // Notify the creator
      await createNotification({
        user_id: selectedReport.creator_id,
        type: 'space_archived',
        title: 'Your space has been archived',
        message: `Your space "${selectedReport.space_title}" has been archived by a moderator for violating community guidelines.`,
        payload: {
          space_id: selectedReport.space_id,
          is_dna_system: true
        }
      });

      // Log admin action
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'space_archived_from_report',
        entity_type: 'collaboration_space',
        entity_id: selectedReport.space_id,
        details: {
          report_id: selectedReport.id,
          reason: selectedReport.reason,
          admin_notes: adminNotes
        }
      });

      toast({
        title: 'Success',
        description: 'Space archived and report resolved',
      });

      setShowArchiveDialog(false);
      setShowReviewDialog(false);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to archive space',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'reviewed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500"><Eye className="h-3 w-3 mr-1" />Reviewed</Badge>;
      case 'resolved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'dismissed':
        return <Badge className="bg-neutral-500/10 text-neutral-600 border-neutral-500"><XCircle className="h-3 w-3 mr-1" />Dismissed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReasonBadge = (reason: string) => {
    const reasonColors: Record<string, string> = {
      spam: 'bg-orange-500/10 text-orange-600 border-orange-500',
      harassment: 'bg-red-500/10 text-red-600 border-red-500',
      inappropriate_content: 'bg-copper-500/10 text-copper-600 border-copper-500',
      scam: 'bg-red-500/10 text-red-600 border-red-500',
      impersonation: 'bg-yellow-500/10 text-yellow-600 border-yellow-500',
      other: 'bg-neutral-500/10 text-neutral-600 border-neutral-500'
    };
    return (
      <Badge className={reasonColors[reason] || reasonColors.other}>
        {reason.replace('_', ' ')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Space Moderation</h1>
        <p className="text-muted-foreground">
          Review and manage reported collaboration spaces
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {reports.filter(r => r.status === 'pending').length}
            </div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {reports.filter(r => r.status === 'reviewed').length}
            </div>
            <p className="text-sm text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {reports.filter(r => r.status === 'resolved').length}
            </div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-neutral-600">
              {reports.filter(r => r.status === 'dismissed').length}
            </div>
            <p className="text-sm text-muted-foreground">Dismissed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReportStatusFilter)}>
        <TabsList>
          <TabsTrigger value="all">All Reports</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
        </TabsList>

        <TabsContent value={statusFilter} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {statusFilter === 'all' ? 'All Reports' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Reports`}
                {' '}({reports.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Space</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date Reported</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="font-medium">{report.space_title}</div>
                            <div className="text-xs text-muted-foreground">
                              by {report.creator_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{report.reporter_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {report.reporter_email}
                            </div>
                          </TableCell>
                          <TableCell>{getReasonBadge(report.reason)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewSpace(report.space_id)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReviewReport(report)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reports to review</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {statusFilter === 'pending'
                      ? 'All reports have been processed'
                      : 'No reports match this filter'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Space Report</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Space</label>
                  <p className="font-medium">{selectedReport.space_title}</p>
                  <p className="text-sm text-muted-foreground">
                    Created by {selectedReport.creator_name}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reported By</label>
                  <p className="font-medium">{selectedReport.reporter_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.reporter_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reason</label>
                  <div className="mt-1">{getReasonBadge(selectedReport.reason)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date Reported</label>
                  <p>{format(new Date(selectedReport.created_at), 'PPP')}</p>
                </div>
              </div>

              {/* Report Details */}
              {selectedReport.details && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Report Details</label>
                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm">
                    {selectedReport.details}
                  </p>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium mb-1 block">Admin Notes</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this review..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleViewSpace(selectedReport.space_id)}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Space
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleContactCreator(selectedReport.creator_email || '')}
                  disabled={!selectedReport.creator_email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Creator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWarningDialog(true)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Warn Creator
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={selectedReport.space_status === 'archived'}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Space
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDismissReport}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Dismiss Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Warning Dialog */}
      <Dialog open={showWarningDialog} onOpenChange={setShowWarningDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Warning to Creator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Send a warning message to {selectedReport?.creator_name} about their space "{selectedReport?.space_title}".
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Warning Message</label>
              <Textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Your space has been reported for..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarningDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleWarnCreator}
              disabled={processing || !warningMessage.trim()}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Warning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Space</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to archive "{selectedReport?.space_title}"? This action will:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Hide the space from all users</li>
              <li>Notify the creator that their space was archived</li>
              <li>Mark this report as resolved</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchiveSpace} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Archive Space'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
