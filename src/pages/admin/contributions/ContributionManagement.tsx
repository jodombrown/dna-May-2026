import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Search,
  HandHeart,
  Eye,
  Mail,
  XCircle,
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  DollarSign,
  Lightbulb,
  Clock,
  Network,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface NeedWithDetails {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  target_amount: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  space_id: string;
  space_title: string;
  creator_name: string | null;
  creator_email: string | null;
  offer_count: number;
}

type SortField = 'created_at' | 'offer_count' | 'status';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'open' | 'in_progress' | 'fulfilled' | 'closed';
type TypeFilter = 'all' | 'funding' | 'skills' | 'time' | 'access' | 'resources';

const ITEMS_PER_PAGE = 25;

const TYPE_ICONS: Record<string, React.ReactNode> = {
  funding: <DollarSign className="h-4 w-4" />,
  skills: <Lightbulb className="h-4 w-4" />,
  time: <Clock className="h-4 w-4" />,
  access: <Network className="h-4 w-4" />,
  resources: <Package className="h-4 w-4" />
};

export default function ContributionManagement() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [needs, setNeeds] = useState<NeedWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedNeed, setSelectedNeed] = useState<NeedWithDetails | null>(null);
  const [showNeedDialog, setShowNeedDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchNeeds();
  }, []);

  const fetchNeeds = async () => {
    try {
      setLoading(true);

      // Fetch all needs with creator and space info
      const { data: needsData, error: needsError } = await (supabase as any)
        .from('contribution_needs')
        .select(`
          id,
          title,
          description,
          type,
          status,
          priority,
          target_amount,
          currency,
          created_at,
          updated_at,
          created_by,
          space_id,
          space:spaces!contribution_needs_space_id_fkey(name),
          creator:profiles!contribution_needs_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (needsError) throw needsError;

      // Get offer counts
      const { data: offerCounts } = await (supabase as any)
        .from('contribution_offers')
        .select('need_id');

      // Build offer count map
      const offerCountMap: Record<string, number> = {};
      offerCounts?.forEach((o: any) => {
        offerCountMap[o.need_id] = (offerCountMap[o.need_id] || 0) + 1;
      });

      const formattedNeeds: NeedWithDetails[] = (needsData || []).map((need: any) => ({
        id: need.id,
        title: need.title,
        description: need.description,
        type: need.type,
        status: need.status,
        priority: need.priority,
        target_amount: need.target_amount,
        currency: need.currency,
        created_at: need.created_at,
        updated_at: need.updated_at,
        created_by: need.created_by,
        space_id: need.space_id,
        space_title: need.space?.name || 'Unknown Space',
        creator_name: need.creator?.full_name || 'Unknown',
        creator_email: need.creator?.email || '',
        offer_count: offerCountMap[need.id] || 0
      }));

      setNeeds(formattedNeeds);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch contribution needs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort needs
  const filteredAndSortedNeeds = useMemo(() => {
    let result = [...needs];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        need =>
          need.title.toLowerCase().includes(query) ||
          need.creator_name?.toLowerCase().includes(query) ||
          need.space_title.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(need => need.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(need => need.type === typeFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'offer_count':
          comparison = a.offer_count - b.offer_count;
          break;
        case 'status':
          const statusOrder = { open: 0, in_progress: 1, fulfilled: 2, closed: 3 };
          comparison = (statusOrder[a.status as keyof typeof statusOrder] || 0) -
                      (statusOrder[b.status as keyof typeof statusOrder] || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [needs, searchQuery, statusFilter, typeFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedNeeds.length / ITEMS_PER_PAGE);
  const paginatedNeeds = filteredAndSortedNeeds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleViewNeed = (need: NeedWithDetails) => {
    setSelectedNeed(need);
    setShowNeedDialog(true);
  };

  const handleContactCreator = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleCloseNeed = async () => {
    if (!selectedNeed || !adminUser) return;

    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from('contribution_needs')
        .update({ status: 'closed' })
        .eq('id', selectedNeed.id);

      if (error) throw error;

      // Log admin action
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'need_closed',
        entity_type: 'contribution_need',
        entity_id: selectedNeed.id,
        details: { note: closeNote, need_title: selectedNeed.title },
      });

      toast({
        title: 'Success',
        description: 'Opportunity closed successfully',
      });

      setShowCloseDialog(false);
      setShowNeedDialog(false);
      setCloseNote('');
      fetchNeeds();
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

  const handleFeatureNeed = async (need: NeedWithDetails) => {
    if (!adminUser) return;

    setProcessing(true);
    try {
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'need_featured',
        entity_type: 'contribution_need',
        entity_id: need.id,
        details: { need_title: need.title },
      });

      toast({
        title: 'Success',
        description: 'Opportunity has been featured',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to feature opportunity',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Creator', 'Space', 'Type', 'Status', 'Offers', 'Created'];
    const rows = filteredAndSortedNeeds.map(need => [
      need.title,
      need.creator_name || '',
      need.space_title,
      need.type,
      need.status,
      need.offer_count.toString(),
      format(new Date(need.created_at), 'yyyy-MM-dd')
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contributions-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500"><AlertCircle className="h-3 w-3 mr-1" />Open</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'fulfilled':
        return <Badge className="bg-copper-500/10 text-copper-600 border-copper-500"><CheckCircle className="h-3 w-3 mr-1" />Fulfilled</Badge>;
      case 'closed':
        return <Badge className="bg-neutral-500/10 text-neutral-600 border-neutral-500"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      funding: 'bg-emerald-500/10 text-emerald-600 border-emerald-500',
      skills: 'bg-blue-500/10 text-blue-600 border-blue-500',
      time: 'bg-orange-500/10 text-orange-600 border-orange-500',
      access: 'bg-copper-500/10 text-copper-600 border-copper-500',
      resources: 'bg-copper-500/10 text-copper-600 border-copper-500'
    };
    return (
      <Badge className={colors[type] || 'bg-neutral-500/10 text-neutral-600 border-neutral-500'}>
        {TYPE_ICONS[type]}
        <span className="ml-1 capitalize">{type}</span>
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
        <h1 className="text-3xl font-bold mb-2">Contribution Management</h1>
        <p className="text-muted-foreground">
          View and manage all contribution opportunities across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{needs.length}</div>
            <p className="text-sm text-muted-foreground">Total Opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {needs.filter(n => n.status === 'open').length}
            </div>
            <p className="text-sm text-muted-foreground">Open Opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-copper-600">
              {needs.filter(n => n.status === 'fulfilled').length}
            </div>
            <p className="text-sm text-muted-foreground">Fulfilled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {needs.reduce((sum, n) => sum + n.offer_count, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Offers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, creator, or space..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as StatusFilter); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v as TypeFilter); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="funding">Funding</SelectItem>
                <SelectItem value="skills">Skills</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="access">Access</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Needs Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Opportunities ({filteredAndSortedNeeds.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort('offer_count')}
                    >
                      Offers
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort('created_at')}
                    >
                      Created
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedNeeds.map((need) => (
                  <TableRow key={need.id}>
                    <TableCell>
                      <div className="font-medium">{need.title}</div>
                      <div className="text-xs text-muted-foreground">{need.space_title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{need.creator_name}</div>
                      <div className="text-xs text-muted-foreground">{need.creator_email}</div>
                    </TableCell>
                    <TableCell>{getTypeBadge(need.type)}</TableCell>
                    <TableCell>{getStatusBadge(need.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <HandHeart className="h-4 w-4 text-muted-foreground" />
                        {need.offer_count}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(need.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewNeed(need)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContactCreator(need.creator_email || '')}
                          disabled={!need.creator_email}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedNeeds.length)} of{' '}
                {filteredAndSortedNeeds.length} opportunities
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {paginatedNeeds.length === 0 && (
            <div className="text-center py-12">
              <HandHeart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No opportunities found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Need Details Dialog */}
      <Dialog open={showNeedDialog} onOpenChange={setShowNeedDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Opportunity Details</DialogTitle>
          </DialogHeader>

          {selectedNeed && (
            <div className="space-y-6">
              {/* Need Info */}
              <div className="flex items-start gap-4">
                <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                  {TYPE_ICONS[selectedNeed.type] || <HandHeart className="h-8 w-8 text-primary" />}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedNeed.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedNeed.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {getTypeBadge(selectedNeed.type)}
                    {getStatusBadge(selectedNeed.status)}
                    {selectedNeed.priority === 'high' && (
                      <Badge className="bg-red-500/10 text-red-600 border-red-500">High Priority</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creator</label>
                  <p className="text-foreground">{selectedNeed.creator_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedNeed.creator_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Space</label>
                  <p className="text-foreground">{selectedNeed.space_title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-foreground">
                    {format(new Date(selectedNeed.created_at), 'PPP')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Offers Received</label>
                  <p className="text-foreground">{selectedNeed.offer_count}</p>
                </div>
                {selectedNeed.target_amount && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Target Amount</label>
                    <p className="text-foreground">
                      {selectedNeed.currency} {selectedNeed.target_amount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/dna/contribute/needs/${selectedNeed.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Opportunity
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleContactCreator(selectedNeed.creator_email || '')}
                  disabled={!selectedNeed.creator_email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Creator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFeatureNeed(selectedNeed)}
                  disabled={processing}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Feature
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowCloseDialog(true)}
                  disabled={selectedNeed.status === 'closed'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Close Opportunity
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <Dialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Opportunity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to close "{selectedNeed?.title}"? This will remove it from
              active listings.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Admin Note (optional)</label>
              <Textarea
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="Reason for closing..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleCloseNeed} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Close Opportunity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
