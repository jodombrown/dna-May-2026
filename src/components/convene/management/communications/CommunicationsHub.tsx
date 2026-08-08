import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  AlertCircle,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
  Building2,
  UserRound,
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
import { useEventManagement } from '../EventManagementContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BlastSegment {
  type?: string;
  status?: string;
  partyId?: string;
  role?: string;
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

// Relationship categories a Party can hold against one event. Kept separate
// from event_roles (platform access/permissions for staff) — team_member here
// describes a relationship, not a login grant.
const PARTY_CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sponsor', label: 'Sponsor' },
  { id: 'partner', label: 'Partner' },
  { id: 'vendor', label: 'Vendor' },
  { id: 'exhibitor', label: 'Exhibitor' },
  { id: 'volunteer', label: 'Volunteer' },
  { id: 'team_member', label: 'Team member' },
];

const roleLabel = (role: string) => PARTY_CATEGORIES.find((c) => c.id === role)?.label ?? role;

interface Party {
  id: string;
  kind: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
}

interface EngagementRow {
  id: string;
  party_id: string;
  created_at: string;
  parties: Party | null;
  event_engagement_roles: { role: string }[];
}

interface CrossEventEngagement {
  id: string;
  event_id: string;
  events: { id: string; title: string; slug: string | null; start_time: string | null } | null;
  event_engagement_roles: { role: string }[];
}

// Pack 07's filter-chip grammar (see ConveneCategoryChips.tsx /
// ConnectFilterChips.tsx): narrows the corpus in place, local state, not a
// route change. Reused verbatim here rather than introducing a new pattern.
const PartyCategoryChips: React.FC<{
  activeCategory: string;
  onSelect: (id: string) => void;
  counts: Record<string, number>;
}> = ({ activeCategory, onSelect, counts }) => (
  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
    {PARTY_CATEGORIES.map((cat) => {
      const isActive = activeCategory === cat.id;
      const count = cat.id === 'all'
        ? Object.values(counts).reduce((sum, c) => sum + c, 0)
        : counts[cat.id] || 0;

      return (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0',
            'border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isActive
              ? 'bg-[hsl(var(--module-convene))] text-white border-[hsl(var(--module-convene))] shadow-sm'
              : 'bg-background text-foreground border-border hover:border-[hsl(var(--module-convene)/0.4)] hover:bg-[hsl(var(--module-convene)/0.06)]',
          )}
        >
          {cat.label}
          {count > 0 && (
            <span
              className={cn(
                'text-[10px] font-semibold ml-0.5',
                isActive ? 'text-white/70' : 'text-muted-foreground',
              )}
            >
              {count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

const CommunicationsHub: React.FC = () => {
  const { event } = useEventManagement();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Tab state
  const [activeTab, setActiveTab] = useState('compose');

  // Party list state
  const [activeCategory, setActiveCategory] = useState('all');
  const [partySearch, setPartySearch] = useState('');
  const [matchedPartyId, setMatchedPartyId] = useState<string | null>(null);
  const [newPartyKind, setNewPartyKind] = useState<'person' | 'organization'>('organization');
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const selectedPartyId = searchParams.get('party');

  useEffect(() => {
    setHistoryExpanded(false);
  }, [selectedPartyId]);

  const handleSelectParty = (partyId: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (next.get('party') === partyId) {
        next.delete('party');
      } else {
        next.set('party', partyId);
      }
      return next;
    });
  };

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

  // Fetch every party engaged on this event, with roles. Filtered to the
  // active category client-side so the same fetch also drives chip counts.
  const { data: allEngagements = [], isLoading: partiesLoading } = useQuery({
    queryKey: ['event-party-engagements', event.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_engagements')
        .select('id, party_id, created_at, parties(id, kind, name, email, phone, notes), event_engagement_roles(role)')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as EngagementRow[];
    },
    enabled: !!event.id,
  });

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const row of allEngagements) {
      for (const r of row.event_engagement_roles) {
        counts[r.role] = (counts[r.role] || 0) + 1;
      }
    }
    return counts;
  }, [allEngagements]);

  const partyEngagements = useMemo(() => (
    activeCategory === 'all'
      ? allEngagements
      : allEngagements.filter((row) => row.event_engagement_roles.some((r) => r.role === activeCategory))
  ), [allEngagements, activeCategory]);

  // Live search over parties this organizer can already see (own or
  // previously engaged), so "Search or add" can link instead of duplicate.
  const { data: partyMatches = [] } = useQuery({
    queryKey: ['party-search', partySearch],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('id, kind, name, email, phone, notes')
        .ilike('name', `%${partySearch.trim()}%`)
        .limit(6);
      if (error) throw error;
      return (data || []) as Party[];
    },
    enabled: partySearch.trim().length > 1,
  });

  // Selected party's own record, for the disclosure header even if it isn't
  // in the currently filtered list (e.g. a stale/shared ?party= link).
  const { data: selectedPartyDetail } = useQuery({
    queryKey: ['party-detail', selectedPartyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parties')
        .select('id, kind, name, email, phone, notes')
        .eq('id', selectedPartyId as string)
        .single();
      if (error) throw error;
      return data as Party;
    },
    enabled: !!selectedPartyId,
  });

  const selectedParty = useMemo(() => (
    allEngagements.find((row) => row.party_id === selectedPartyId)?.parties ?? selectedPartyDetail ?? null
  ), [allEngagements, selectedPartyId, selectedPartyDetail]);

  // Cross-event history: every engagement this party has, across ALL events,
  // not just this one — the point of the disclosure.
  const { data: partyHistory = [], isLoading: partyHistoryLoading } = useQuery({
    queryKey: ['party-cross-event-history', selectedPartyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_engagements')
        .select('id, event_id, events(id, title, slug, start_time), event_engagement_roles(role)')
        .eq('party_id', selectedPartyId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CrossEventEngagement[];
    },
    enabled: !!selectedPartyId && historyExpanded,
  });

  // Add a new party (or link an existing one found via search) to this
  // event, in the currently active category.
  const addOrLinkPartyMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('You must be signed in.');
      const name = partySearch.trim();
      if (!name) throw new Error('Enter a name to add.');
      if (activeCategory === 'all') throw new Error('Choose a category above first.');

      let partyId = matchedPartyId;
      if (!partyId) {
        const { data: newParty, error: partyErr } = await supabase
          .from('parties')
          .insert({ name, kind: newPartyKind, created_by: user.id })
          .select('id')
          .single();
        if (partyErr) throw partyErr;
        partyId = newParty.id;
      }

      const { data: engagement, error: engagementErr } = await supabase
        .from('event_engagements')
        .upsert(
          { event_id: event.id, party_id: partyId, created_by: user.id },
          { onConflict: 'event_id,party_id' },
        )
        .select('id')
        .single();
      if (engagementErr) throw engagementErr;

      const { error: roleErr } = await supabase
        .from('event_engagement_roles')
        .upsert(
          { event_engagement_id: engagement.id, role: activeCategory },
          { onConflict: 'event_engagement_id,role' },
        );
      if (roleErr) throw roleErr;

      return partyId as string;
    },
    onSuccess: (partyId) => {
      queryClient.invalidateQueries({ queryKey: ['event-party-engagements', event.id] });
      setPartySearch('');
      setMatchedPartyId(null);
      setNewPartyKind('organization');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('party', partyId);
        return next;
      });
      toast({ title: 'Added', description: 'Party added to this event.' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message || 'Failed to add party.', variant: 'destructive' });
    },
  });

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

  // The Compose tab's audience: a selected Party takes priority, then an
  // active (non-"All") category, falling back to the original attendee
  // SEGMENT_OPTIONS behavior untouched when nothing is selected.
  const audienceMode: 'party' | 'role' | 'default' =
    selectedPartyId ? 'party' : activeCategory !== 'all' ? 'role' : 'default';

  const audienceRecipientCount =
    audienceMode === 'party'
      ? (selectedParty?.email ? 1 : 0)
      : audienceMode === 'role'
        ? partyEngagements.filter((row) => row.parties?.email).length
        : (segmentCounts[emailSegment as keyof typeof segmentCounts] || 0);

  // Send email blast mutation
  const sendBlastMutation = useMutation({
    mutationFn: async () => {
      const segment: BlastSegment | null =
        audienceMode === 'party' ? { type: 'party', partyId: selectedPartyId as string }
        : audienceMode === 'role' ? { type: 'role', role: activeCategory }
        : (emailSegment === 'all' ? null : { type: emailSegment });

      const blastData = {
        event_id: event.id,
        subject: emailSubject.trim(),
        body_markdown: emailBody.trim(),
        segment,
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

  const notifSegmentCount = segmentCounts[notifSegment as keyof typeof segmentCounts] || 0;
  const nonDnaMemberCount = (segmentCounts.all || 0) - (segmentCounts.dna_members || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Communications</h1>
        <p className="text-muted-foreground">Manage relationships and send updates to attendees</p>
      </div>

      {/* Party / Role list — primary view */}
      <div className="space-y-3">
        <h2 className="text-h3 font-semibold">Parties</h2>
        <PartyCategoryChips activeCategory={activeCategory} onSelect={setActiveCategory} counts={roleCounts} />

        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={partySearch}
                onChange={(e) => {
                  setPartySearch(e.target.value);
                  setMatchedPartyId(null);
                }}
                placeholder="Search or add a person or organization"
                className="pl-9"
              />
            </div>
            {!matchedPartyId && partySearch.trim().length > 0 && (
              <div className="flex rounded-md border border-border overflow-hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setNewPartyKind('organization')}
                  className={cn(
                    'px-3 text-xs font-medium',
                    newPartyKind === 'organization' ? 'bg-muted text-foreground' : 'text-muted-foreground',
                  )}
                >
                  Org
                </button>
                <button
                  type="button"
                  onClick={() => setNewPartyKind('person')}
                  className={cn(
                    'px-3 text-xs font-medium border-l border-border',
                    newPartyKind === 'person' ? 'bg-muted text-foreground' : 'text-muted-foreground',
                  )}
                >
                  Person
                </button>
              </div>
            )}
            <Button
              onClick={() => addOrLinkPartyMutation.mutate()}
              disabled={!partySearch.trim() || activeCategory === 'all' || addOrLinkPartyMutation.isPending}
            >
              {addOrLinkPartyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>

          {activeCategory === 'all' && partySearch.trim() && (
            <p className="text-xs text-muted-foreground mt-1">Choose a category above to add "{partySearch.trim()}".</p>
          )}

          {partySearch.trim().length > 1 && partyMatches.length > 0 && (
            <Card className="absolute z-10 mt-1 w-full p-1">
              {partyMatches.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setPartySearch(m.name);
                    setMatchedPartyId(m.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-muted/60 flex items-center justify-between"
                >
                  <span>{m.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">{m.kind}</span>
                </button>
              ))}
            </Card>
          )}
        </div>

        {partiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : partyEngagements.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No parties yet in this category.</p>
        ) : (
          <div className="rounded-lg border border-border divide-y divide-border">
            {partyEngagements.map((row) => {
              const isSelected = selectedPartyId === row.party_id;
              return (
                <div key={row.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectParty(row.party_id)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {row.parties?.kind === 'person' ? (
                        <UserRound className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{row.parties?.name}</p>
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {row.event_engagement_roles.map((r) => (
                            <Badge key={r.role} variant="outline" className="text-[10px]">
                              {roleLabel(r.role)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    {isSelected ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                  </button>

                  {isSelected && (
                    <div className="px-4 pb-4 pt-1 bg-muted/20 space-y-2 text-sm">
                      <button
                        type="button"
                        onClick={() => setHistoryExpanded((v) => !v)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        {historyExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        {selectedParty?.name} · {partyHistory.length} event{partyHistory.length === 1 ? '' : 's'}
                      </button>

                      {historyExpanded && (
                        partyHistoryLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <ul className="space-y-1 pl-5">
                            {partyHistory.map((h) => (
                              <li key={h.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{h.events?.title ?? 'Untitled event'}</span>
                                <span>
                                  {h.events?.start_time ? format(new Date(h.events.start_time), 'MMM d, yyyy') : '—'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )
                      )}

                      {selectedParty?.email && (
                        <p className="text-xs text-muted-foreground">{selectedParty.email}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Separator />

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
              {/* Audience */}
              {audienceMode === 'default' ? (
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
              ) : (
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Card className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {audienceMode === 'party' ? selectedParty?.name : `${roleLabel(activeCategory)} (this event)`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {audienceMode === 'party' ? 'Selected from the Party list' : 'Every engaged party in this category'}
                      </p>
                    </div>
                    <Badge variant="outline">{audienceRecipientCount}</Badge>
                  </Card>
                  <p className="text-xs text-muted-foreground">
                    Clear the {audienceMode === 'party' ? 'party selection' : 'category filter'} above to email attendees instead.
                  </p>
                </div>
              )}

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
                  Will be sent to {audienceRecipientCount} recipient{audienceRecipientCount === 1 ? '' : 's'}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => sendBlastMutation.mutate()}
                    disabled={
                      !emailSubject.trim() ||
                      !emailBody.trim() ||
                      sendBlastMutation.isPending ||
                      (scheduleType === 'later' && !scheduledFor) ||
                      (audienceMode !== 'default' && audienceRecipientCount === 0)
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
                <div className="flex items-start gap-3 p-3 bg-dna-warning/10 dark:bg-dna-warning/20 rounded-lg border border-dna-warning/30 dark:border-dna-warning">
                  <AlertCircle className="h-5 w-5 text-dna-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-dna-warning">
                      {nonDnaMemberCount} attendee{nonDnaMemberCount !== 1 ? 's' : ''} won't receive this
                    </p>
                    <p className="text-body text-dna-warning">
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
