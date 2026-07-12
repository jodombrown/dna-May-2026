import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invalidateAllEventCaches } from '@/lib/eventCacheInvalidation';
import {
  Settings,
  Calendar,
  MapPin,
  Users,
  Eye,
  Link2,
  AlertTriangle,
  Pause,
  XCircle,
  Trash2,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import {
  eventStateWrite,
  isEventVisibility,
  type EventVisibility,
} from '@/lib/events/state';
import { useEventManagement } from '../EventManagementLayout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const EventSettingsPage: React.FC = () => {
  const { event, refetchEvent, isOrganizer } = useEventManagement();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [title, setTitle] = useState(event.title || '');
  const [description, setDescription] = useState(event.description || '');
  const [maxAttendees, setMaxAttendees] = useState<number | null>(event.max_attendees);
  const [requiresApproval, setRequiresApproval] = useState(event.requires_approval || false);
  const [allowGuests, setAllowGuests] = useState(event.allow_guests !== false);
  const [visibility, setVisibility] = useState<EventVisibility>(
    isEventVisibility(event.visibility)
      ? event.visibility
      : event.is_public === false
        ? 'private'
        : 'public'
  );
  const [slug, setSlug] = useState(event.slug || '');

  // Dialog states
  const [showPostponeDialog, setShowPostponeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Update basic info mutation
  const updateBasicMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .update({
          title,
          description,
        })
        .eq('id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchEvent();
      queryClient.invalidateQueries({ queryKey: ['event-detail'] });
      toast({ title: 'Settings saved', description: 'Basic information has been updated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    },
  });

  // Update registration settings mutation
  const updateRegistrationMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .update({
          max_attendees: maxAttendees,
          requires_approval: requiresApproval,
          allow_guests: allowGuests,
        })
        .eq('id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchEvent();
      toast({ title: 'Settings saved', description: 'Registration settings have been updated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    },
  });

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async () => {
      if (slug) {
        // Check slug uniqueness (exclude current event)
        const { data: existing } = await supabase
          .from('events')
          .select('id')
          .eq('slug', slug)
          .neq('id', event.id)
          .maybeSingle();

        if (existing) {
          throw new Error('This URL is already taken by another event. Please choose a different one.');
        }
      }

      const { error } = await supabase
        .from('events')
        .update({
          // visibility plus the transitional legacy is_public mirror
          ...eventStateWrite({ visibility }),
          slug: slug || null,
        })
        .eq('id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refetchEvent();
      toast({ title: 'Settings saved', description: 'Visibility settings have been updated.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to save settings.', variant: 'destructive' });
    },
  });

  // Cancel event mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .update({
          // status: 'cancelled' plus the transitional legacy mirror
          ...eventStateWrite({ status: 'cancelled' }),
          cancellation_reason: 'Cancelled by organizer',
        })
        .eq('id', event.id);

      if (error) throw error;

      // TODO: Send notifications to attendees
    },
    onSuccess: () => {
      refetchEvent();
      invalidateAllEventCaches(queryClient, event.id);
      toast({ title: 'Event Cancelled', description: 'Your event has been cancelled. Attendees will be notified.' });
      setShowCancelDialog(false);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to cancel event.', variant: 'destructive' });
    },
  });

  // Delete event mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAllEventCaches(queryClient, event.id);
      toast({ title: 'Event Deleted', description: 'Your event has been permanently deleted.' });
      navigate('/dna/convene/events');
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    },
  });

  const canDelete = !event.is_cancelled; // Simplified check - in production check for registrations
  const eventUrl = `${window.location.origin}/dna/convene/events/${slug || event.id}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your event settings</p>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="registration">Registration</TabsTrigger>
          <TabsTrigger value="visibility">Visibility</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        {/* Basic Info Tab */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Update your event's core details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description"
                  rows={6}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.start_time), 'EEEE, MMMM d, yyyy')}
                      <br />
                      {format(new Date(event.start_time), 'h:mm a')} - {format(new Date(event.end_time), 'h:mm a')}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate(`/dna/convene/events/${event.id}/edit`)}>
                  Edit
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {event.format === 'virtual' ? 'Online Event' : event.location_name || 'No location set'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => navigate(`/dna/convene/events/${event.id}/edit`)}>
                  Edit
                </Button>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateBasicMutation.mutate()}
                  disabled={updateBasicMutation.isPending}
                >
                  {updateBasicMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registration Tab */}
        <TabsContent value="registration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registration Settings
              </CardTitle>
              <CardDescription>
                Control how people register for your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max-attendees">Maximum Attendees</Label>
                <Input
                  id="max-attendees"
                  type="number"
                  value={maxAttendees || ''}
                  onChange={(e) => setMaxAttendees(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="Unlimited"
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty for unlimited capacity
                </p>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="requires-approval">Require Approval</Label>
                  <p className="text-sm text-muted-foreground">
                    Manually approve each registration
                  </p>
                </div>
                <Switch
                  id="requires-approval"
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-guests">Allow Guests</Label>
                  <p className="text-sm text-muted-foreground">
                    Attendees can bring additional guests
                  </p>
                </div>
                <Switch
                  id="allow-guests"
                  checked={allowGuests}
                  onCheckedChange={setAllowGuests}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateRegistrationMutation.mutate()}
                  disabled={updateRegistrationMutation.isPending}
                >
                  {updateRegistrationMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visibility Tab */}
        <TabsContent value="visibility" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visibility Settings
              </CardTitle>
              <CardDescription>
                Control who can see and access your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="event-visibility">Audience</Label>
                  <p className="text-sm text-muted-foreground">
                    Who can see and access your event
                  </p>
                </div>
                <Select
                  value={visibility}
                  onValueChange={(value) => setVisibility(value as EventVisibility)}
                >
                  <SelectTrigger id="event-visibility" className="w-44">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="slug">Custom URL</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-0 rounded-md border">
                    <span className="px-3 py-2 text-sm text-muted-foreground bg-muted border-r">
                      /dna/convene/events/
                    </span>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="my-event"
                      className="border-0 rounded-l-none"
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Only lowercase letters, numbers, and hyphens
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <Link2 className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">Event URL</p>
                    <a
                      href={eventUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline truncate block"
                    >
                      {eventUrl}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(eventUrl);
                      toast({ title: 'Copied', description: 'Event URL copied to clipboard' });
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(eventUrl, '_blank')}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => updateVisibilityMutation.mutate()}
                  disabled={updateVisibilityMutation.isPending}
                >
                  {updateVisibilityMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Danger Zone Tab */}
        <TabsContent value="danger" className="space-y-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions that affect your event and attendees
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cancel Event */}
              {!event.is_cancelled && (
                <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium">Cancel Event</p>
                      <p className="text-sm text-muted-foreground">
                        Mark as cancelled and notify all attendees
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="border-amber-600 text-amber-600 hover:bg-amber-50"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancel Event
                  </Button>
                </div>
              )}

              {event.is_cancelled && (
                <div className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">Cancelled</Badge>
                    <p className="text-sm text-muted-foreground">
                      This event has been cancelled
                    </p>
                  </div>
                </div>
              )}

              {/* Delete Event */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
                <div className="flex items-center gap-3">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">Delete Event</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this event and all data
                    </p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  Delete Event
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark your event as cancelled and notify all registered attendees.
              The event will remain visible but marked as cancelled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Event</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelMutation.mutate()}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Cancel Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event Permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the event
              and all associated data including registrations, check-ins, and analytics.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="delete-confirm">
              Type <span className="font-mono font-bold">"{event.title}"</span> to confirm:
            </Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type event name to confirm"
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteConfirmText !== event.title || deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventSettingsPage;
