import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Bell,
  Send,
  Clock,
  Users,
  Eye,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useEventManagement } from '../EventManagementLayout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BlastSegment {
  type?: string;
  status?: string;
}

interface EmailBlast {
  id: string;
  subject: string;
  body_markdown: string;
  scheduled_for: string | null;
  sent_at: string | null;
  segment: BlastSegment | null;
}

interface SegmentOption {
  value: string;
  label: string;
  description: string;
}

const SEGMENT_OPTIONS: SegmentOption[] = [
  { value: 'all', label: 'All Registered', description: 'Everyone who registered' },
  { value: 'going', label: 'Going', description: 'Confirmed attendees' },
  { value: 'maybe', label: 'Maybe', description: 'Tentative RSVPs' },
  { value: 'not_checked_in', label: 'Not Checked In', description: 'Going but not yet checked in' },
  { value: 'checked_in', label: 'Checked In', description: 'Already checked in' },
  { value: 'waitlist', label: 'Waitlist', description: 'On the waitlist' },
];

const TEMPLATE_VARS = [
  { var: '{{first_name}}', description: 'Attendee first name' },
  { var: '{{event_name}}', description: 'Event title' },
  { var: '{{event_date}}', description: 'Event date' },
  { var: '{{check_in_link}}', description: 'Link to check-in page' },
];

const CommunicationsHub: React.FC = () => {
  const { event } = useEventManagement();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState('compose');

  // Email compose state
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSegment, setEmailSegment] = useState('all');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledFor, setScheduledFor] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Notification compose state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifBody, setNotifBody] = useState('');
  const [notifSegment, setNotifSegment] = useState('all');
  const [sendPush, setSendPush] = useState(false);

  // Delete confirmation
  const [deleteBlastId, setDeleteBlastId] = useState<string | null>(null);

  // Fetch email blasts
  const { data: blasts = [], isLoading: blastsLoading } = useQuery({
    queryKey: ['event-blasts', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_blasts')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EmailBlast[];
    },
    enabled: !!event.id,
  });

  // Fetch segment counts
  const { data: segmentCounts = {} } = useQuery({
    queryKey: ['event-segment-counts', event.id],
    queryFn: async () => {
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('status, checked_in, user_id')
        .eq('event_id', event.id);

      if (!attendees) return {};

      return {
        all: attendees.length,
        going: attendees.filter(a => a.status === 'going').length,
        maybe: attendees.filter(a => a.status === 'maybe').length,
        not_checked_in: attendees.filter(a => a.status === 'going' && !a.checked_in).length,
        checked_in: attendees.filter(a => a.checked_in).length,
        waitlist: attendees.filter(a => a.status === 'waitlist').length,
        dna_members: attendees.filter(a => a.user_id !== null).length,
      };
    },
    enabled: !!event.id,
  });

  // Send email blast mutation
  const sendBlastMutation = useMutation({
    mutationFn: async () => {
      const blastData = {
        event_id: event.id,
        subject: emailSubject.trim(),
        body_markdown: emailBody.trim(),
        segment: emailSegment === 'all' ? null : { type: emailSegment },
        scheduled_for: scheduleType === 'later' && scheduledFor
          ? new Date(scheduledFor).toISOString()
          : new Date().toISOString(),
      };

      const { error } = await supabase
        .from('event_blasts')
        .insert([blastData]);

      if (error) throw error;

      // Trigger edge function for immediate sends
      if (scheduleType === 'now') {
        await supabase.functions.invoke('send-event-blasts', {
          body: { eventId: event.id },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-blasts', event.id] });
      toast({
        title: scheduleType === 'now' ? 'Email Sent' : 'Email Scheduled',
        description: scheduleType === 'now'
          ? 'Your email blast has been sent.'
          : 'Your email blast has been scheduled.',
      });
      setEmailSubject('');
      setEmailBody('');
      setEmailSegment('all');
      setScheduleType('now');
      setScheduledFor('');
      setActiveTab('history');
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send email blast.',
        variant: 'destructive',
      });
    },
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async () => {
      // Insert notifications for DNA members in the segment
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('user_id')
        .eq('event_id', event.id)
        .not('user_id', 'is', null);

      if (!attendees || attendees.length === 0) {
        throw new Error('No DNA members to notify');
      }

      let targetUserIds = attendees.map(a => a.user_id);

      // Filter by segment if needed
      if (notifSegment !== 'all') {
        const { data: filteredAttendees } = await supabase
          .from('event_attendees')
          .select('user_id, status, checked_in')
          .eq('event_id', event.id)
          .not('user_id', 'is', null);

        if (filteredAttendees) {
          targetUserIds = filteredAttendees
            .filter(a => {
              switch (notifSegment) {
                case 'going': return a.status === 'going';
                case 'maybe': return a.status === 'maybe';
                case 'not_checked_in': return a.status === 'going' && !a.checked_in;
                case 'checked_in': return a.checked_in;
                case 'waitlist': return a.status === 'waitlist';
                default: return true;
              }
            })
            .map(a => a.user_id);
        }
      }

      // Create notifications
      const notifications = targetUserIds.map(userId => ({
        user_id: userId,
        type: 'event',
        title: notifTitle,
        message: notifBody,
        link_url: `/dna/convene/events/${event.slug || event.id}`,
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      return targetUserIds.length;
    },
    onSuccess: (count) => {
      toast({
        title: 'Notifications Sent',
        description: `Notification sent to ${count} DNA members.`,
      });
      setNotifTitle('');
      setNotifBody('');
      setNotifSegment('all');
      setSendPush(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notifications.',
        variant: 'destructive',
      });
    },
  });

  // Delete blast mutation
  const deleteBlastMutation = useMutation({
    mutationFn: async (blastId: string) => {
      const { error } = await supabase
        .from('event_blasts')
        .delete()
        .eq('id', blastId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-blasts', event.id] });
      toast({ title: 'Deleted', description: 'Email blast has been deleted.' });
      setDeleteBlastId(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete email blast.', variant: 'destructive' });
    },
  });

  const getBlastStatus = (blast: EmailBlast) => {
    if (blast.sent_at) {
      return <Badge variant="default">Sent</Badge>;
    } else if (blast.scheduled_for && new Date(blast.scheduled_for) > new Date()) {
      return <Badge variant="secondary">Scheduled</Badge>;
    } else {
      return <Badge variant="outline">Draft</Badge>;
    }
  };

  const selectedSegmentCount = segmentCounts[emailSegment as keyof typeof segmentCounts] || 0;
  const notifSegmentCount = segmentCounts[notifSegment as keyof typeof segmentCounts] || 0;
  const nonDnaMemberCount = (segmentCounts.all || 0) - (segmentCounts.dna_members || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Communications</h1>
        <p className="text-muted-foreground">Send email blasts and notifications to attendees</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">
            <Mail className="h-4 w-4 mr-2" />
            Email Blast
          </TabsTrigger>
          <TabsTrigger value="notification">
            <Bell className="h-4 w-4 mr-2" />
            In-App Notification
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Email Compose Tab */}
        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compose Email Blast
              </CardTitle>
              <CardDescription>
                Send email updates to your attendees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Segment Selector */}
              <div className="space-y-2">
                <Label>Audience</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SEGMENT_OPTIONS.map((option) => (
                    <Card
                      key={option.value}
                      className={`p-3 cursor-pointer transition-all ${
                        emailSegment === option.value ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setEmailSegment(option.value)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-sm">{option.label}</p>
                        <Badge variant="outline">
                          {segmentCounts[option.value as keyof typeof segmentCounts] || 0}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="email-subject">Subject Line</Label>
                <Input
                  id="email-subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject"
                />
              </div>

              {/* Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-body">Email Content (Markdown)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                </div>
                <Textarea
                  id="email-body"
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder={`# Event Update\n\nHi {{first_name}},\n\nWe're excited to share an update about **{{event_name}}**!\n\nSee you on {{event_date}}!\n\nBest regards,\nThe Event Team`}
                  rows={10}
                  className="font-mono text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  {TEMPLATE_VARS.map((t) => (
                    <Badge
                      key={t.var}
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={() => setEmailBody(prev => prev + t.var)}
                    >
                      {t.var}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Schedule */}
              <div className="space-y-4">
                <Label>Send Schedule</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`p-4 cursor-pointer transition-all ${
                      scheduleType === 'now' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setScheduleType('now')}
                  >
                    <div className="flex items-center gap-3">
                      <Send className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Send Now</p>
                        <p className="text-sm text-muted-foreground">Deliver immediately</p>
                      </div>
                    </div>
                  </Card>
                  <Card
                    className={`p-4 cursor-pointer transition-all ${
                      scheduleType === 'later' ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setScheduleType('later')}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Schedule</p>
                        <p className="text-sm text-muted-foreground">Send at specific time</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {scheduleType === 'later' && (
                  <div>
                    <Label htmlFor="schedule-time">Schedule Date & Time</Label>
                    <Input
                      id="schedule-time"
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Will be sent to {selectedSegmentCount} recipients
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => sendBlastMutation.mutate()}
                    disabled={
                      !emailSubject.trim() ||
                      !emailBody.trim() ||
                      sendBlastMutation.isPending ||
                      (scheduleType === 'later' && !scheduledFor)
                    }
                  >
                    {sendBlastMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {scheduleType === 'now' ? 'Send Now' : 'Schedule'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Tab */}
        <TabsContent value="notification" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                In-App Notification
              </CardTitle>
              <CardDescription>
                Send notifications to DNA members attending your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {nonDnaMemberCount > 0 && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-900">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      {nonDnaMemberCount} attendee{nonDnaMemberCount !== 1 ? 's' : ''} won't receive this
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Some attendees are not DNA members and can only receive emails.
                    </p>
                  </div>
                </div>
              )}

              {/* Segment Selector */}
              <div className="space-y-2">
                <Label>Audience (DNA Members Only)</Label>
                <Select value={notifSegment} onValueChange={setNotifSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label} ({segmentCounts[option.value as keyof typeof segmentCounts] || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="notif-title">Title (max 100 characters)</Label>
                <Input
                  id="notif-title"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value.slice(0, 100))}
                  placeholder="Notification title"
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {notifTitle.length}/100
                </p>
              </div>

              {/* Body */}
              <div className="space-y-2">
                <Label htmlFor="notif-body">Message (max 500 characters)</Label>
                <Textarea
                  id="notif-body"
                  value={notifBody}
                  onChange={(e) => setNotifBody(e.target.value.slice(0, 500))}
                  placeholder="Notification message"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {notifBody.length}/500
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  Will notify {Math.min(notifSegmentCount, segmentCounts.dna_members || 0)} DNA members
                </div>
                <Button
                  onClick={() => sendNotificationMutation.mutate()}
                  disabled={
                    !notifTitle.trim() ||
                    !notifBody.trim() ||
                    sendNotificationMutation.isPending
                  }
                >
                  {sendNotificationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Bell className="h-4 w-4 mr-2" />
                  )}
                  Send Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Email Blast History</CardTitle>
              <CardDescription>Previous and scheduled email blasts</CardDescription>
            </CardHeader>
            <CardContent>
              {blastsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : blasts.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No email blasts sent yet</p>
                  <Button
                    variant="link"
                    onClick={() => setActiveTab('compose')}
                    className="mt-2"
                  >
                    Create your first blast
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blasts.map((blast) => (
                      <TableRow key={blast.id}>
                        <TableCell>
                          <p className="font-medium">{blast.subject}</p>
                          <p className="text-sm text-muted-foreground truncate max-w-xs">
                            {blast.body_markdown.split('\n')[0].replace(/^#+ /, '')}
                          </p>
                        </TableCell>
                        <TableCell>{getBlastStatus(blast)}</TableCell>
                        <TableCell className="text-sm">
                          {blast.scheduled_for
                            ? format(new Date(blast.scheduled_for), 'MMM d, h:mm a')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {blast.sent_at
                            ? format(new Date(blast.sent_at), 'MMM d, h:mm a')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {!blast.sent_at && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteBlastId(blast.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-b pb-3">
              <p className="text-sm text-muted-foreground">Subject:</p>
              <p className="font-medium">{emailSubject || '(No subject)'}</p>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <div style={{ whiteSpace: 'pre-wrap' }}>{emailBody}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteBlastId} onOpenChange={(open) => !open && setDeleteBlastId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Email Blast?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scheduled email blast. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBlastId && deleteBlastMutation.mutate(deleteBlastId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CommunicationsHub;
