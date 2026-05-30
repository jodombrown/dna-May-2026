import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import ContributionModerationQueue from '@/components/admin/ContributionModerationQueue';
import {
  Loader2,
  Flag,
  Eye,
  Mail,
  XCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  ShieldAlert,
  HandHeart
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface ContributionReport {
  id: string;
  need_id: string;
  need_title: string;
  space_title: string;
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  creator_id: string;
  creator_name: string;
  creator_email: string;
  reason: string;
  details: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

type StatusFilter = 'all' | 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export default function ContributionModeration() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [reports, setReports] = useState<ContributionReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedReport, setSelectedReport] = useState<ContributionReport | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showWarnDialog, setShowWarnDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);

      // Fetch reports with related data
      const { data: reportsData, error } = await (supabase as any)
        .from('contribution_reports')
        .select(`
          id,
          need_id,
          reporter_id,
          reason,
          details,
          status,
          admin_notes,
          created_at,
          reviewed_at,
          reviewed_by,
          need:contribution_needs!contribution_reports_need_id_fkey(
            title,
            created_by,
            space:spaces!contribution_needs_space_id_fkey(name)
          ),
          reporter:profiles!contribution_reports_reporter_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet - show empty state
        setReports([]);
        setLoading(false);
        return;
      }

      // Get creator profiles separately
      const creatorIds = [...new Set((reportsData || []).map((r: any) => r.need?.created_by).filter(Boolean))];

      let creatorMap: Record<string, { full_name: string; email: string }> = {};
      if (creatorIds.length > 0) {
        const { data: creators } = await (supabase.rpc as any)('admin_get_profile_contacts', {
          p_ids: creatorIds as string[],
        });

        (creators || []).forEach((c: any) => {
          creatorMap[c.id] = { full_name: c.full_name || 'Unknown', email: c.email || '' };
        });
      }

      const formattedReports: ContributionReport[] = (reportsData || []).map((report: any) => ({
        id: report.id,
        need_id: report.need_id,
        need_title: report.need?.title || 'Unknown',
        space_title: report.need?.space?.name || 'Unknown Space',
        reporter_id: report.reporter_id,
        reporter_name: report.reporter?.full_name || 'Unknown',
        reporter_email: report.reporter?.email || '',
        creator_id: report.need?.created_by || '',
        creator_name: creatorMap[report.need?.created_by]?.full_name || 'Unknown',
        creator_email: creatorMap[report.need?.created_by]?.email || '',
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
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = statusFilter === 'all'
    ? reports
    : reports.filter(r => r.status === statusFilter);

  const pendingCount = reports.filter(r => r.status === 'pending').length;

  const handleViewReport = (report: ContributionReport) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setShowReviewDialog(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedReport || !adminUser) return;

    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from('contribution_reports')
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Report marked as ${newStatus}`,
      });

      setShowReviewDialog(false);
      fetchReports();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update report status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseOpportunity = async () => {
    if (!selectedReport || !adminUser) return;

    setProcessing(true);
    try {
      // Close the need
      const { error: needError } = await (supabase as any)
        .from('contribution_needs')
        .update({ status: 'closed' })
        .eq('id', selectedReport.need_id);

      if (needError) throw needError;

      // Update report status
      const { error: reportError } = await (supabase as any)
        .from('contribution_reports')
        .update({
          status: 'resolved',
          admin_notes: adminNotes,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id
        })
        .eq('id', selectedReport.id);

      if (reportError) throw reportError;

      // Log admin action
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'need_closed_via_report',
        entity_type: 'contribution_need',
        entity_id: selectedReport.need_id,
        details: {
          report_id: selectedReport.id,
          note: adminNotes,
          need_title: selectedReport.need_title
        },
      });

      toast({
        title: 'Success',
        description: 'Opportunity closed and report resolved',
      });

      setShowCloseDialog(false);
      setShowReviewDialog(false);
      fetchReports();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to close opportunity',
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
      // Create a notification/message to the creator
      await (supabase as any).from('notifications').insert({
        user_id: selectedReport.creator_id,
        type: 'admin_warning',
        title: 'Warning from Admin',
        message: warningMessage,
        metadata: {
          need_id: selectedReport.need_id,
          report_id: selectedReport.id
        }
      });

      // Update report status
      const { error } = await (supabase as any)
        .from('contribution_reports')
        .update({
          status: 'resolved',
          admin_notes: `Warning sent: ${warningMessage}\n\n${adminNotes}`,
          reviewed_at: new Date().toISOString(),
          reviewed_by: adminUser.id
        })
        .eq('id', selectedReport.id);

      if (error) throw error;

      // Log admin action
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'creator_warned',
        entity_type: 'user',
        entity_id: selectedReport.creator_id,
        details: {
          report_id: selectedReport.id,
          need_id: selectedReport.need_id,
          warning: warningMessage
        },
      });

      toast({
        title: 'Success',
        description: 'Warning sent to creator',
      });

      setShowWarnDialog(false);
      setShowReviewDialog(false);
      setWarningMessage('');
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
      spam: 'bg-red-500/10 text-red-600 border-red-500',
      inappropriate: 'bg-orange-500/10 text-orange-600 border-orange-500',
      misleading: 'bg-yellow-500/10 text-yellow-600 border-yellow-500',
      scam: 'bg-red-500/10 text-red-600 border-red-500',
      other: 'bg-neutral-500/10 text-neutral-600 border-neutral-500'
    };
    return (
      <Badge className={reasonColors[reason] || reasonColors.other}>
        {reason.charAt(0).toUpperCase() + reason.slice(1)}
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
        <h1 className="text-3xl font-bold mb-2">Contribution Moderation</h1>
        <p className="text-muted-foreground">
          Review reported opportunities and manage contributor requests
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-sm text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
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

      {/* Tabs */}
      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Reported Opportunities
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <HandHeart className="h-4 w-4" />
            Contributor Requests
          </TabsTrigger>
        </TabsList>

        {/* Reported Opportunities Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reported Opportunities</CardTitle>
                <CardDescription>
                  Review and take action on reported contribution opportunities
                </CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reports</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {filteredReports.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Opportunity</TableHead>
                        <TableHead>Reporter</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <div className="font-medium">{report.need_title}</div>
                            <div className="text-xs text-muted-foreground">{report.space_title}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{report.reporter_name}</div>
                            <div className="text-xs text-muted-foreground">{report.reporter_email}</div>
                          </TableCell>
                          <TableCell>{getReasonBadge(report.reason)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell>{getStatusBadge(report.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReport(report)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Flag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {statusFilter === 'all'
                      ? 'No reported opportunities'
                      : `No ${statusFilter} reports`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contributor Requests Tab */}
        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Contributor Requests</CardTitle>
              <CardDescription>
                Review and approve contributor verification requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContributionModerationQueue />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Report</DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Report Info */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-yellow-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedReport.need_title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedReport.space_title}</p>
                  <div className="flex gap-2 mt-2">
                    {getReasonBadge(selectedReport.reason)}
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Reported By</label>
                  <p className="text-foreground">{selectedReport.reporter_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.reporter_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Opportunity Creator</label>
                  <p className="text-foreground">{selectedReport.creator_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.creator_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Report Date</label>
                  <p className="text-foreground">
                    {format(new Date(selectedReport.created_at), 'PPP')}
                  </p>
                </div>
                {selectedReport.reviewed_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reviewed At</label>
                    <p className="text-foreground">
                      {format(new Date(selectedReport.reviewed_at), 'PPP')}
                    </p>
                  </div>
                )}
              </div>

              {/* Report Details */}
              {selectedReport.details && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    Report Details
                  </label>
                  <p className="text-foreground bg-muted/50 p-3 rounded-lg">
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
                  placeholder="Add notes about this report..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/dna/contribute/needs/${selectedReport.need_id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Opportunity
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(`mailto:${selectedReport.creator_email}`, '_blank')}
                  disabled={!selectedReport.creator_email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Creator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCloseDialog(true)}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Opportunity
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowWarnDialog(true)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Warn Creator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleUpdateStatus('dismissed')}
                  disabled={processing}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Dismiss Report
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Close Opportunity Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Opportunity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This will close the opportunity "{selectedReport?.need_title}" and mark the report as resolved.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason for Closing</label>
              <Textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Explain why this opportunity is being closed..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseOpportunity} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Close Opportunity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warn Creator Dialog */}
      <Dialog open={showWarnDialog} onOpenChange={setShowWarnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Warn Creator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Send a warning to {selectedReport?.creator_name} about their opportunity.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Warning Message</label>
              <Textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Write your warning message..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWarnDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleWarnCreator}
              disabled={processing || !warningMessage.trim()}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Warning'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
