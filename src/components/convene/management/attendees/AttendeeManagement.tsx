import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Download,
  Mail,
  UserPlus,
  Check,
  X,
  MoreHorizontal,
  CheckCircle2,
  Circle,
  Filter,
  SortAsc,
  SortDesc,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useEventManagement } from '../EventManagementLayout';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/useMobile';

interface Attendee {
  id: string;
  user_id: string;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  guest_name: string | null;
  response_note: string | null;
  source: string | null;
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
  } | null;
  ticket_type?: {
    id: string;
    name: string;
  } | null;
}

type SortField = 'created_at' | 'full_name' | 'checked_in';
type SortOrder = 'asc' | 'desc';

const AttendeeManagement: React.FC = () => {
  const { event } = useEventManagement();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checkedInFilter, setCheckedInFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(null);

  // Add attendee form state
  const [newAttendeeName, setNewAttendeeName] = useState('');
  const [newAttendeeEmail, setNewAttendeeEmail] = useState('');
  const [newAttendeeNote, setNewAttendeeNote] = useState('');
  const [checkInImmediately, setCheckInImmediately] = useState(true);

  // Fetch attendees
  const { data: attendees = [], isLoading, refetch } = useQuery({
    queryKey: ['event-management-attendees', event.id],
    queryFn: async (): Promise<Attendee[]> => {
      const { data: attendeeData, error } = await supabase
        .from('event_attendees')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!attendeeData || attendeeData.length === 0) return [];

      // Fetch profiles
      const userIds = attendeeData.map(a => a.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return attendeeData.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
      })) as Attendee[];
    },
    enabled: !!event.id,
  });

  // Filter and sort attendees
  const filteredAttendees = useMemo(() => {
    let result = [...attendees];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a => {
        const name = a.profile?.full_name?.toLowerCase() || a.guest_name?.toLowerCase() || '';
        const username = a.profile?.username?.toLowerCase() || '';
        return name.includes(query) || username.includes(query);
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(a => a.status === statusFilter);
    }

    // Checked-in filter
    if (checkedInFilter === 'checked_in') {
      result = result.filter(a => a.checked_in);
    } else if (checkedInFilter === 'not_checked_in') {
      result = result.filter(a => !a.checked_in);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'full_name':
          const nameA = a.profile?.full_name || a.guest_name || '';
          const nameB = b.profile?.full_name || b.guest_name || '';
          comparison = nameA.localeCompare(nameB);
          break;
        case 'checked_in':
          comparison = (a.checked_in ? 1 : 0) - (b.checked_in ? 1 : 0);
          break;
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [attendees, searchQuery, statusFilter, checkedInFilter, sortField, sortOrder]);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .eq('id', attendeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-management-attendees', event.id] });
      toast({ title: 'Checked in', description: 'Attendee has been checked in.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to check in attendee.', variant: 'destructive' });
    },
  });

  // Undo check-in mutation
  const undoCheckInMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({ checked_in: false, checked_in_at: null })
        .eq('id', attendeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-management-attendees', event.id] });
      toast({ title: 'Check-in undone', description: 'Attendee check-in has been reversed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to undo check-in.', variant: 'destructive' });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ attendeeId, status }: { attendeeId: string; status: string }) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({ status: status as 'going' | 'maybe' | 'not_going' | 'pending' | 'waitlist' })
        .eq('id', attendeeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-management-attendees', event.id] });
      toast({ title: 'Status updated', description: 'Attendee status has been updated.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' });
    },
  });

  // Add walk-up attendee mutation
  const addAttendeeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: event.id,
          user_id: null,
          guest_name: newAttendeeName,
          status: 'going',
          source: 'walk-up',
          response_note: newAttendeeNote || null,
          checked_in: checkInImmediately,
          checked_in_at: checkInImmediately ? new Date().toISOString() : null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-management-attendees', event.id] });
      toast({ title: 'Attendee added', description: 'Walk-up attendee has been added.' });
      setShowAddModal(false);
      setNewAttendeeName('');
      setNewAttendeeEmail('');
      setNewAttendeeNote('');
      setCheckInImmediately(true);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add attendee.', variant: 'destructive' });
    },
  });

  // Bulk check-in mutation
  const bulkCheckInMutation = useMutation({
    mutationFn: async (attendeeIds: string[]) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .in('id', attendeeIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-management-attendees', event.id] });
      toast({ title: 'Bulk check-in', description: `${selectedAttendees.size} attendees checked in.` });
      setSelectedAttendees(new Set());
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to check in attendees.', variant: 'destructive' });
    },
  });

  // Select handlers
  const handleSelectAll = () => {
    if (selectedAttendees.size === filteredAttendees.length) {
      setSelectedAttendees(new Set());
    } else {
      setSelectedAttendees(new Set(filteredAttendees.map(a => a.id)));
    }
  };

  const handleSelectAttendee = (id: string) => {
    const newSelected = new Set(selectedAttendees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAttendees(newSelected);
  };

  // Export to CSV
  const handleExport = () => {
    const csvContent = [
      ['Name', 'Username', 'Status', 'Checked In', 'Registered Date', 'Source', 'Notes'],
      ...filteredAttendees.map(a => [
        a.profile?.full_name || a.guest_name || 'Unknown',
        a.profile?.username || 'N/A',
        a.status,
        a.checked_in ? 'Yes' : 'No',
        format(new Date(a.created_at), 'yyyy-MM-dd HH:mm'),
        a.source || 'Direct',
        a.response_note || '',
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-attendees-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({ title: 'Export complete', description: 'Attendee list has been downloaded.' });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      going: 'default',
      maybe: 'secondary',
      pending: 'outline',
      waitlist: 'outline',
      not_going: 'secondary',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  // Stats
  const stats = {
    total: attendees.length,
    going: attendees.filter(a => a.status === 'going').length,
    pending: attendees.filter(a => a.status === 'pending').length,
    checkedIn: attendees.filter(a => a.checked_in).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Attendees</h1>
          <p className="text-muted-foreground">Manage your event attendees</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Attendee
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-dna-success">{stats.going}</p>
            <p className="text-sm text-muted-foreground">Confirmed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-dna-warning">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-dna-info">{stats.checkedIn}</p>
            <p className="text-sm text-muted-foreground">Checked In</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="going">Going</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="waitlist">Waitlist</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={checkedInFilter} onValueChange={setCheckedInFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Check-in" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="not_checked_in">Not Checked In</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAttendees.size > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedAttendees.size} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => bulkCheckInMutation.mutate(Array.from(selectedAttendees))}
                  disabled={bulkCheckInMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Check In All
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedAttendees(new Set())}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendee List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' || checkedInFilter !== 'all'
                  ? 'No attendees match your filters'
                  : 'No attendees yet'}
              </p>
            </div>
          ) : isMobile ? (
            // Mobile: Card list
            <div className="divide-y">
              {filteredAttendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className={`p-4 ${attendee.checked_in ? 'bg-dna-success/10 dark:bg-dna-success/20' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedAttendees.has(attendee.id)}
                      onCheckedChange={() => handleSelectAttendee(attendee.id)}
                    />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={attendee.profile?.avatar_url || ''} />
                      <AvatarFallback>
                        {(attendee.profile?.full_name || attendee.guest_name)?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {attendee.profile?.full_name || attendee.guest_name || 'Unknown'}
                      </p>
                      {attendee.profile?.username && (
                        <p className="text-sm text-muted-foreground">@{attendee.profile.username}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(attendee.status)}
                        {attendee.checked_in && (
                          <Badge variant="outline" className="text-dna-success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {attendee.checked_in ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => undoCheckInMutation.mutate(attendee.id)}
                        >
                          Undo
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => checkInMutation.mutate(attendee.id)}
                        >
                          Check In
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Desktop: Table
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedAttendees.size === filteredAttendees.length && filteredAttendees.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Checked In</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendees.map((attendee) => (
                  <TableRow
                    key={attendee.id}
                    className={attendee.checked_in ? 'bg-dna-success/50 dark:bg-dna-success/10' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedAttendees.has(attendee.id)}
                        onCheckedChange={() => handleSelectAttendee(attendee.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={attendee.profile?.avatar_url || ''} />
                          <AvatarFallback className="text-xs">
                            {(attendee.profile?.full_name || attendee.guest_name)?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {attendee.profile?.full_name || attendee.guest_name || 'Unknown'}
                          </p>
                          {attendee.profile?.username && (
                            <p className="text-sm text-muted-foreground">@{attendee.profile.username}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(attendee.status)}</TableCell>
                    <TableCell>
                      {attendee.checked_in ? (
                        <div className="flex items-center text-dna-success">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Yes
                        </div>
                      ) : (
                        <div className="flex items-center text-muted-foreground">
                          <Circle className="h-4 w-4 mr-1" />
                          No
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(attendee.created_at), 'MMM d, h:mm a')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {attendee.source || 'Direct'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {attendee.checked_in ? (
                            <DropdownMenuItem onClick={() => undoCheckInMutation.mutate(attendee.id)}>
                              Undo Check-In
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => checkInMutation.mutate(attendee.id)}>
                              Check In
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {attendee.status === 'pending' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({ attendeeId: attendee.id, status: 'going' })}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => updateStatusMutation.mutate({ attendeeId: attendee.id, status: 'cancelled' })}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Decline
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAttendee(attendee);
                              setShowDetailModal(true);
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Attendee Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Walk-up Attendee</DialogTitle>
            <DialogDescription>
              Manually add someone to the event (e.g., walk-up, comp, speaker's guest)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={newAttendeeName}
                onChange={(e) => setNewAttendeeName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                type="email"
                value={newAttendeeEmail}
                onChange={(e) => setNewAttendeeEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={newAttendeeNote}
                onChange={(e) => setNewAttendeeNote(e.target.value)}
                placeholder="e.g., Comp - speaker's guest"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="check-in"
                checked={checkInImmediately}
                onCheckedChange={(checked) => setCheckInImmediately(checked as boolean)}
              />
              <Label htmlFor="check-in" className="text-sm">
                Check in immediately
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => addAttendeeMutation.mutate()}
              disabled={!newAttendeeName.trim() || addAttendeeMutation.isPending}
            >
              {addAttendeeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Attendee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Attendee Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attendee Details</DialogTitle>
          </DialogHeader>
          {selectedAttendee && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedAttendee.profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {(selectedAttendee.profile?.full_name || selectedAttendee.guest_name)?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">
                    {selectedAttendee.profile?.full_name || selectedAttendee.guest_name || 'Unknown'}
                  </p>
                  {selectedAttendee.profile?.username && (
                    <p className="text-muted-foreground">@{selectedAttendee.profile.username}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedAttendee.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Checked In</p>
                  <p className="mt-1 font-medium">
                    {selectedAttendee.checked_in ? (
                      <span className="text-dna-success">Yes</span>
                    ) : (
                      'No'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Registered</p>
                  <p className="mt-1">{format(new Date(selectedAttendee.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p className="mt-1">{selectedAttendee.source || 'Direct'}</p>
                </div>
              </div>
              {selectedAttendee.response_note && (
                <div>
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p className="mt-1">{selectedAttendee.response_note}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendeeManagement;
