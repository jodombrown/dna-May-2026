import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, Search, UserCheck, Users, CheckCircle2, Circle, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DetailViewLayout from '@/layouts/DetailViewLayout';
import Scanner from '@/components/events/checkin/Scanner';

interface AttendeeWithProfile {
  id: string;
  user_id: string;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    email?: string;
  } | null;
}

const EventCheckIn = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('scanner');

  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery({
    queryKey: ['event-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, organizer_id, start_time, end_time')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch all attendees with their profiles
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery({
    queryKey: ['event-checkin-attendees', id],
    queryFn: async () => {
      // First, get attendees
      const { data: attendeeData, error: attendeeError } = await supabase
        .from('event_attendees')
        .select('id, user_id, status, checked_in, checked_in_at, created_at')
        .eq('event_id', id)
        .in('status', ['going', 'maybe', 'pending', 'waitlist'])
        .order('checked_in', { ascending: false })
        .order('created_at', { ascending: true });

      if (attendeeError) throw attendeeError;
      if (!attendeeData || attendeeData.length === 0) return [];

      // Then, get profiles for all attendees
      const userIds = attendeeData.map(a => a.user_id);
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine attendee data with profiles
      return attendeeData.map(a => ({
        ...a,
        profile: profileMap.get(a.user_id) || null,
      })) as AttendeeWithProfile[];
    },
    enabled: !!id,
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq('id', attendeeId)
        .eq('event_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-checkin-attendees', id] });
      toast({
        title: 'Checked In',
        description: 'Attendee has been checked in successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to check in attendee.',
        variant: 'destructive',
      });
    },
  });

  // Undo check-in mutation
  const undoCheckInMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({
          checked_in: false,
          checked_in_at: null,
        })
        .eq('id', attendeeId)
        .eq('event_id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-checkin-attendees', id] });
      toast({
        title: 'Check-in Reversed',
        description: 'Attendee check-in has been undone.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to undo check-in.',
        variant: 'destructive',
      });
    },
  });

  const handleQrCheckIn = (result: { registration_id: string; checkin_id: string | null }) => {
    queryClient.invalidateQueries({ queryKey: ['event-checkin-attendees', id] });
  };

  // Check if user is the organizer
  const isOrganizer = user?.id === event?.organizer_id;

  // Calculate check-in stats
  const goingAttendees = attendees.filter(a => a.status === 'going');
  const checkedInCount = attendees.filter(a => a.checked_in).length;
  const totalGoingCount = goingAttendees.length;

  // Filter attendees by search query
  const filteredAttendees = attendees.filter(a => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = a.profile?.full_name?.toLowerCase() || '';
    const username = a.profile?.username?.toLowerCase() || '';
    return name.includes(query) || username.includes(query);
  });

  if (eventLoading) {
    return (
      <DetailViewLayout
        title="Loading..."
        backPath={`/dna/convene/events/${id}`}
        backLabel="Back to Event"
      >
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DetailViewLayout>
    );
  }

  if (!event) {
    return (
      <DetailViewLayout
        title="Event Not Found"
        backPath="/dna/convene/events"
        backLabel="Back to Events"
      >
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Event not found</p>
              <Button
                variant="link"
                onClick={() => navigate('/dna/convene/events')}
                className="mt-4"
              >
                Back to events
              </Button>
            </CardContent>
          </Card>
        </div>
      </DetailViewLayout>
    );
  }

  if (!isOrganizer) {
    return (
      <DetailViewLayout
        title="Access Denied"
        backPath={`/dna/convene/events/${id}`}
        backLabel="Back to Event"
      >
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Only the event organizer can access check-in.</p>
              <Button
                variant="link"
                onClick={() => navigate(`/dna/convene/events/${id}`)}
                className="mt-4"
              >
                Back to event
              </Button>
            </CardContent>
          </Card>
        </div>
      </DetailViewLayout>
    );
  }

  return (
    <DetailViewLayout
      title={`Check-in: ${event.title}`}
      backPath={`/dna/convene/events/${id}`}
      backLabel="Back to Event"
      breadcrumbs={[
        { label: 'Home', path: '/dna/feed' },
        { label: 'Convene', path: '/dna/convene/events' },
        { label: event.title, path: `/dna/convene/events/${id}` },
        { label: 'Check-in' }
      ]}
    >
      <div className="container max-w-4xl mx-auto px-4 py-8">
        {/* Stats Header */}
        <Card className="mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Check-in Progress</p>
                  <p className="text-h2 font-serif">
                    {checkedInCount} / {totalGoingCount}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      checked in
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Show-up Rate</p>
                <p className="text-h2 font-serif">
                  {totalGoingCount > 0
                    ? Math.round((checkedInCount / totalGoingCount) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Scanner
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Attendee List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner">
            <Card>
              <CardHeader>
                <CardTitle>Scan QR Code</CardTitle>
                <CardDescription>
                  Scan attendee QR codes for quick check-in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Scanner eventId={id!} onCheckIn={handleQrCheckIn} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardHeader>
                <CardTitle>Attendee List</CardTitle>
                <CardDescription>
                  Search and manually check in attendees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Attendee List */}
                {attendeesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAttendees.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'No attendees found matching your search.' : 'No registered attendees yet.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAttendees.map((attendee) => (
                      <div
                        key={attendee.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          attendee.checked_in
                            ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900'
                            : 'bg-background'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {attendee.checked_in ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground" />
                          )}
                          <Avatar>
                            <AvatarImage src={attendee.profile?.avatar_url || ''} />
                            <AvatarFallback>
                              {attendee.profile?.full_name?.[0] || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {attendee.profile?.full_name || 'Unknown'}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                @{attendee.profile?.username || 'unknown'}
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {attendee.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {attendee.checked_in ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => undoCheckInMutation.mutate(attendee.id)}
                              disabled={undoCheckInMutation.isPending}
                            >
                              Undo
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => checkInMutation.mutate(attendee.id)}
                              disabled={checkInMutation.isPending}
                            >
                              {checkInMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Check In'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DetailViewLayout>
  );
};

export default EventCheckIn;
