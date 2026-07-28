import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BrowserMultiFormatReader } from '@zxing/library';
import {
  QrCode,
  Search,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Camera,
  CameraOff,
  Loader2,
  Vibrate
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useEventManagement } from '../EventManagementLayout';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendeeWithProfile {
  id: string;
  user_id: string;
  status: string;
  checked_in: boolean;
  checked_in_at: string | null;
  created_at: string;
  guest_name: string | null;
  profile: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

type ScanState = 'ready' | 'processing' | 'success' | 'already_checked_in' | 'error';

interface ScanResult {
  state: ScanState;
  attendee?: AttendeeWithProfile;
  message?: string;
}

const CheckInDashboard: React.FC = () => {
  const { event } = useEventManagement();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Scanner state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reader] = useState(() => new BrowserMultiFormatReader());
  const [scannerActive, setScannerActive] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [scanResult, setScanResult] = useState<ScanResult>({ state: 'ready' });
  const [lastScannedToken, setLastScannedToken] = useState<string>('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Walk-up state
  const [showWalkUpModal, setShowWalkUpModal] = useState(false);
  const [walkUpName, setWalkUpName] = useState('');
  const [walkUpEmail, setWalkUpEmail] = useState('');
  const [walkUpPhone, setWalkUpPhone] = useState('');
  const [walkUpNotes, setWalkUpNotes] = useState('');
  const [walkUpCheckIn, setWalkUpCheckIn] = useState(true);

  // Tab state
  const [activeTab, setActiveTab] = useState('scanner');

  // Fetch stats
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['checkin-stats', event.id],
    queryFn: async () => {
      const { data: attendees } = await supabase
        .from('event_attendees')
        .select('checked_in, status')
        .eq('event_id', event.id)
        .in('status', ['going', 'maybe', 'pending', 'waitlist']);

      const total = attendees?.filter(a => a.status === 'going').length || 0;
      const checkedIn = attendees?.filter(a => a.checked_in).length || 0;

      return { total, checkedIn };
    },
    enabled: !!event.id,
  });

  // Fetch attendees for search
  const { data: attendees = [], isLoading: attendeesLoading } = useQuery({
    queryKey: ['checkin-attendees', event.id],
    queryFn: async (): Promise<AttendeeWithProfile[]> => {
      const { data: attendeeData } = await supabase
        .from('event_attendees')
        .select('id, user_id, status, checked_in, checked_in_at, created_at, guest_name')
        .eq('event_id', event.id)
        .in('status', ['going', 'maybe', 'pending', 'waitlist'])
        .order('checked_in', { ascending: false })
        .order('created_at', { ascending: true });

      if (!attendeeData || attendeeData.length === 0) return [];

      const userIds = attendeeData.map(a => a.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return attendeeData.map(a => ({
        ...a,
        profile: a.user_id ? profileMap.get(a.user_id) || null : null,
      })) as AttendeeWithProfile[];
    },
    enabled: !!event.id,
    refetchInterval: 5000,
  });

  // Fetch recent check-ins
  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ['recent-checkins', event.id],
    queryFn: async () => {
      const { data: checkIns } = await supabase
        .from('event_attendees')
        .select('id, user_id, checked_in_at, guest_name')
        .eq('event_id', event.id)
        .eq('checked_in', true)
        .order('checked_in_at', { ascending: false })
        .limit(5);

      if (!checkIns || checkIns.length === 0) return [];

      const userIds = checkIns.map(c => c.user_id).filter(Boolean);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return checkIns.map(c => ({
        ...c,
        profile: c.user_id ? profileMap.get(c.user_id) || null : null,
      }));
    },
    enabled: !!event.id,
    refetchInterval: 3000,
  });

  // Initialize camera devices - request permission first to get labeled devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request camera permission first so we get labeled device list
        await navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
          stream.getTracks().forEach(t => t.stop());
        });
        const deviceList = await navigator.mediaDevices.enumerateDevices();
        const cameras = deviceList.filter(d => d.kind === 'videoinput');
        setDevices(cameras);
        if (cameras.length > 0 && !selectedDevice) {
          const backCamera = cameras.find(d => d.label.toLowerCase().includes('back'));
          setSelectedDevice(backCamera?.deviceId || cameras[0].deviceId);
        }
      } catch (err) {
        // Fallback: try enumerating without permission
        try {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const cameras = deviceList.filter(d => d.kind === 'videoinput');
          setDevices(cameras);
          if (cameras.length > 0 && !selectedDevice) {
            setSelectedDevice(cameras[0].deviceId);
          }
        } catch {}
      }
    };
    getDevices();
  }, []);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (attendeeId: string) => {
      const { error } = await supabase
        .from('event_attendees')
        .update({ checked_in: true, checked_in_at: new Date().toISOString() })
        .eq('id', attendeeId)
        .eq('event_id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-attendees', event.id] });
      queryClient.invalidateQueries({ queryKey: ['recent-checkins', event.id] });
      refetchStats();
      toast({ title: 'Checked In', description: 'Attendee has been checked in successfully.' });
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
        .eq('id', attendeeId)
        .eq('event_id', event.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-attendees', event.id] });
      queryClient.invalidateQueries({ queryKey: ['recent-checkins', event.id] });
      refetchStats();
      toast({ title: 'Check-in Undone', description: 'Attendee check-in has been reversed.' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to undo check-in.', variant: 'destructive' });
    },
  });

  // Walk-up registration mutation
  const walkUpMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: event.id,
          user_id: null,
          guest_name: walkUpName,
          status: 'going',
          source: 'walk-up',
          response_note: walkUpNotes || null,
          checked_in: walkUpCheckIn,
          checked_in_at: walkUpCheckIn ? new Date().toISOString() : null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkin-attendees', event.id] });
      queryClient.invalidateQueries({ queryKey: ['recent-checkins', event.id] });
      refetchStats();
      toast({ title: 'Walk-up Added', description: `${walkUpName} has been added${walkUpCheckIn ? ' and checked in' : ''}.` });
      setShowWalkUpModal(false);
      setWalkUpName('');
      setWalkUpEmail('');
      setWalkUpPhone('');
      setWalkUpNotes('');
      setWalkUpCheckIn(true);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add walk-up attendee.', variant: 'destructive' });
    },
  });

  // Start scanner
  const startScanner = async () => {
    if (!videoRef.current || !selectedDevice) return;

    setScannerActive(true);
    setScanResult({ state: 'ready' });

    try {
      await reader.decodeFromVideoDevice(selectedDevice, videoRef.current, async (result, error) => {
        if (result) {
          const text = result.getText();

          // Prevent duplicate scans
          if (text === lastScannedToken) return;
          setLastScannedToken(text);

          setScanResult({ state: 'processing' });

          try {
            // Parse QR code - expected format: JSON with token
            const parsed = JSON.parse(text);
            const token = parsed?.token;

            if (!token) {
              setScanResult({ state: 'error', message: 'Invalid QR code format' });
              return;
            }

            // Call RPC to check in by token
            const { data, error: rpcError } = await supabase.rpc('rpc_check_in_by_token', {
              p_event: event.id,
              p_token: token,
            });

            if (rpcError) {
              if (rpcError.message.includes('Already checked in')) {
                setScanResult({ state: 'already_checked_in', message: 'Already checked in' });
                vibrate([100, 50, 100]);
              } else {
                setScanResult({ state: 'error', message: rpcError.message });
                vibrate([200, 100, 200]);
              }
            } else {
              setScanResult({ state: 'success', message: 'Checked in successfully!' });
              vibrate([100]);
              refetchStats();
              queryClient.invalidateQueries({ queryKey: ['checkin-attendees', event.id] });
              queryClient.invalidateQueries({ queryKey: ['recent-checkins', event.id] });
            }

            // Auto-reset after 2 seconds
            setTimeout(() => {
              setScanResult({ state: 'ready' });
              setLastScannedToken('');
            }, 2000);
          } catch (e) {
            setScanResult({ state: 'error', message: 'Invalid QR code' });
            vibrate([200, 100, 200]);
            setTimeout(() => {
              setScanResult({ state: 'ready' });
              setLastScannedToken('');
            }, 2000);
          }
        }
      });
    } catch (err) {
      console.error('Scanner error:', err);
      setScannerActive(false);
    }
  };

  // Stop scanner
  const stopScanner = () => {
    try {
      reader.reset();
    } catch {}
    setScannerActive(false);
    setScanResult({ state: 'ready' });
  };

  // Vibration feedback
  const vibrate = (pattern: number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Filter attendees by search
  const filteredAttendees = attendees.filter(a => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const name = a.profile?.full_name?.toLowerCase() || a.guest_name?.toLowerCase() || '';
    const username = a.profile?.username?.toLowerCase() || '';
    return name.includes(query) || username.includes(query);
  });

  const checkInPercentage = stats && stats.total > 0
    ? Math.round((stats.checkedIn / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Check-In</h1>
        <p className="text-muted-foreground">Scan QR codes or search to check in attendees</p>
      </div>

      {/* Stats Bar */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-in Progress</p>
                <p className="text-3xl font-bold">
                  {stats?.checkedIn || 0} / {stats?.total || 0}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Show-up Rate</p>
              <p className="text-3xl font-bold">{checkInPercentage}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          size="lg"
          className="h-20 text-lg"
          onClick={() => {
            setActiveTab('scanner');
            if (!scannerActive) startScanner();
          }}
        >
          <Camera className="h-6 w-6 mr-3" />
          Scan QR
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-20 text-lg"
          onClick={() => {
            setActiveTab('search');
            // Focus the search input after tab switch
            setTimeout(() => {
              const input = document.getElementById('checkin-search-input');
              input?.focus();
            }, 100);
          }}
        >
          <Search className="h-6 w-6 mr-3" />
          Find Attendee
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="scanner">
            <QrCode className="h-4 w-4 mr-2" />
            QR Scanner
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Manual Search
          </TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scan QR Code</CardTitle>
              <CardDescription>Point camera at attendee's QR code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Camera Selection */}
              {devices.length > 1 && (
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map(device => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || 'Camera'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Scanner Controls */}
              <div className="flex gap-2">
                {!scannerActive ? (
                  <Button onClick={startScanner} className="flex-1">
                    <Camera className="h-4 w-4 mr-2" />
                    Start Scanner
                  </Button>
                ) : (
                  <Button variant="outline" onClick={stopScanner} className="flex-1">
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Scanner
                  </Button>
                )}
              </div>

              {/* Video Feed with Result Overlay */}
              <div className="relative">
                <video
                  ref={videoRef}
                  className={cn(
                    'w-full aspect-[4/3] rounded-lg border bg-black',
                    !scannerActive && 'hidden'
                  )}
                  muted
                  playsInline
                />

                {/* Scan Result Overlay */}
                {scannerActive && scanResult.state !== 'ready' && (
                  <div
                    className={cn(
                      'absolute inset-0 flex flex-col items-center justify-center rounded-lg transition-colors',
                      scanResult.state === 'processing' && 'bg-dna-info/80',
                      scanResult.state === 'success' && 'bg-dna-success/80',
                      scanResult.state === 'already_checked_in' && 'bg-dna-warning/80',
                      scanResult.state === 'error' && 'bg-destructive/80'
                    )}
                  >
                    {scanResult.state === 'processing' && (
                      <Loader2 className="h-16 w-16 text-white animate-spin" />
                    )}
                    {scanResult.state === 'success' && (
                      <CheckCircle2 className="h-16 w-16 text-white" />
                    )}
                    {scanResult.state === 'already_checked_in' && (
                      <AlertCircle className="h-16 w-16 text-white" />
                    )}
                    {scanResult.state === 'error' && (
                      <XCircle className="h-16 w-16 text-white" />
                    )}
                    <p className="text-white text-xl font-semibold mt-4">
                      {scanResult.message}
                    </p>
                  </div>
                )}

                {/* Placeholder when scanner is off */}
                {!scannerActive && (
                  <div className="w-full aspect-[4/3] rounded-lg border bg-muted flex flex-col items-center justify-center">
                    <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Click "Start Scanner" to begin</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Attendees</CardTitle>
              <CardDescription>Find and check in attendees by name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="checkin-search-input"
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              {/* Walk-up Button */}
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowWalkUpModal(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Walk-up Registration
              </Button>

              {/* Attendee List */}
              {attendeesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAttendees.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? 'No attendees found' : 'No registered attendees'}
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {filteredAttendees.map((attendee) => (
                    <div
                      key={attendee.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border',
                        attendee.checked_in
                          ? 'bg-dna-success/10 dark:bg-dna-success/20 border-dna-success/30 dark:border-dna-success'
                          : 'bg-background'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {attendee.checked_in ? (
                          <CheckCircle2 className="h-5 w-5 text-dna-success flex-shrink-0" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                        )}
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={attendee.profile?.avatar_url || ''} />
                          <AvatarFallback>
                            {(attendee.profile?.full_name || attendee.guest_name)?.[0] || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {attendee.profile?.full_name || attendee.guest_name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2">
                            {attendee.profile?.username && (
                              <span className="text-sm text-muted-foreground">
                                @{attendee.profile.username}
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs capitalize">
                              {attendee.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div>
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

      {/* Recent Check-ins */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Check-ins</CardTitle>
        </CardHeader>
        <CardContent>
          {recentCheckIns.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No check-ins yet</p>
          ) : (
            <div className="space-y-3">
              {recentCheckIns.map((checkIn: AttendeeWithProfile) => (
                <div key={checkIn.id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={checkIn.profile?.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {(checkIn.profile?.full_name || checkIn.guest_name)?.[0] || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {checkIn.profile?.full_name || checkIn.guest_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(checkIn.checked_in_at), { addSuffix: true })}
                    </p>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-dna-success" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Walk-up Modal */}
      <Dialog open={showWalkUpModal} onOpenChange={setShowWalkUpModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Walk-up Registration</DialogTitle>
            <DialogDescription>
              Quickly add and check in walk-up attendees
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="walkup-name">Name *</Label>
              <Input
                id="walkup-name"
                value={walkUpName}
                onChange={(e) => setWalkUpName(e.target.value)}
                placeholder="Full name"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkup-email">Email (optional)</Label>
              <Input
                id="walkup-email"
                type="email"
                value={walkUpEmail}
                onChange={(e) => setWalkUpEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkup-phone">Phone (optional)</Label>
              <Input
                id="walkup-phone"
                type="tel"
                value={walkUpPhone}
                onChange={(e) => setWalkUpPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walkup-notes">Notes (optional)</Label>
              <Textarea
                id="walkup-notes"
                value={walkUpNotes}
                onChange={(e) => setWalkUpNotes(e.target.value)}
                placeholder="e.g., Comp - speaker's guest"
                rows={2}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="walkup-checkin"
                checked={walkUpCheckIn}
                onCheckedChange={(checked) => setWalkUpCheckIn(checked as boolean)}
              />
              <Label htmlFor="walkup-checkin" className="text-sm">
                Check in immediately
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWalkUpModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => walkUpMutation.mutate()}
              disabled={!walkUpName.trim() || walkUpMutation.isPending}
            >
              {walkUpMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Add & {walkUpCheckIn ? 'Check In' : 'Register'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CheckInDashboard;
