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
  Users,
  CheckSquare,
  Calendar,
  Eye,
  Mail,
  Archive,
  Star,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  AlertTriangle,
  Activity,
  Pause,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';

interface SpaceWithDetails {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  status: string;
  tags: string[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  creator_name: string | null;
  creator_email: string | null;
  member_count: number;
  task_count: number;
  completed_task_count: number;
  health_score: 'healthy' | 'stalling' | 'at-risk' | 'inactive';
  last_activity: string | null;
}

type SortField = 'created_at' | 'member_count' | 'health_score' | 'last_activity';
type SortDirection = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'paused' | 'completed' | 'archived';
type HealthFilter = 'all' | 'healthy' | 'stalling' | 'at-risk' | 'inactive';

const ITEMS_PER_PAGE = 25;

export default function SpaceManagement() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();

  const [spaces, setSpaces] = useState<SpaceWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedSpace, setSelectedSpace] = useState<SpaceWithDetails | null>(null);
  const [showSpaceDialog, setShowSpaceDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiveNote, setArchiveNote] = useState('');
  const [processing, setProcessing] = useState(false);

  // Calculate health score based on activity
  const calculateHealthScore = (
    lastActivity: string | null,
    taskCount: number,
    completedTaskCount: number,
    status: string
  ): 'healthy' | 'stalling' | 'at-risk' | 'inactive' => {
    if (status === 'archived') return 'inactive';
    if (!lastActivity) return 'inactive';

    const daysSinceActivity = differenceInDays(new Date(), new Date(lastActivity));
    const completionRate = taskCount > 0 ? completedTaskCount / taskCount : 0;

    if (daysSinceActivity <= 7 && completionRate >= 0.3) return 'healthy';
    if (daysSinceActivity <= 14) return 'stalling';
    if (daysSinceActivity <= 30) return 'at-risk';
    return 'inactive';
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const fetchSpaces = async () => {
    try {
      setLoading(true);

      // Fetch all spaces with creator info
      const { data: spacesData, error: spacesError } = await (supabase as any)
        .from('collaboration_spaces')
        .select(`
          id,
          title,
          description,
          visibility,
          status,
          tags,
          image_url,
          created_at,
          updated_at,
          created_by,
          creator:profiles!collaboration_spaces_created_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (spacesError) throw spacesError;

      // Get member counts
      const { data: memberCounts } = await (supabase as any)
        .from('collaboration_memberships')
        .select('space_id')
        .eq('status', 'approved');

      // Get task counts
      const { data: taskCounts } = await (supabase as any)
        .from('tasks')
        .select('space_id, status');

      // Build member count map
      const memberCountMap: Record<string, number> = {};
      memberCounts?.forEach((m: any) => {
        memberCountMap[m.space_id] = (memberCountMap[m.space_id] || 0) + 1;
      });

      // Build task count maps
      const taskCountMap: Record<string, number> = {};
      const completedTaskCountMap: Record<string, number> = {};
      taskCounts?.forEach((t: any) => {
        taskCountMap[t.space_id] = (taskCountMap[t.space_id] || 0) + 1;
        if (t.status === 'done') {
          completedTaskCountMap[t.space_id] = (completedTaskCountMap[t.space_id] || 0) + 1;
        }
      });

      const formattedSpaces: SpaceWithDetails[] = (spacesData || []).map((space: any) => {
        const memberCount = memberCountMap[space.id] || 0;
        const taskCount = taskCountMap[space.id] || 0;
        const completedTaskCount = completedTaskCountMap[space.id] || 0;
        const lastActivity = space.updated_at;

        return {
          id: space.id,
          title: space.title,
          description: space.description,
          visibility: space.visibility,
          status: space.status,
          tags: space.tags || [],
          image_url: space.image_url,
          created_at: space.created_at,
          updated_at: space.updated_at,
          created_by: space.created_by,
          creator_name: space.creator?.full_name || 'Unknown',
          creator_email: space.creator?.email || '',
          member_count: memberCount,
          task_count: taskCount,
          completed_task_count: completedTaskCount,
          health_score: calculateHealthScore(lastActivity, taskCount, completedTaskCount, space.status),
          last_activity: lastActivity
        };
      });

      setSpaces(formattedSpaces);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch spaces',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort spaces
  const filteredAndSortedSpaces = useMemo(() => {
    let result = [...spaces];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        space =>
          space.title.toLowerCase().includes(query) ||
          space.creator_name?.toLowerCase().includes(query) ||
          space.creator_email?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(space => space.status === statusFilter);
    }

    // Apply health filter
    if (healthFilter !== 'all') {
      result = result.filter(space => space.health_score === healthFilter);
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'member_count':
          comparison = a.member_count - b.member_count;
          break;
        case 'health_score':
          const healthOrder = { healthy: 0, stalling: 1, 'at-risk': 2, inactive: 3 };
          comparison = healthOrder[a.health_score] - healthOrder[b.health_score];
          break;
        case 'last_activity':
          const aTime = a.last_activity ? new Date(a.last_activity).getTime() : 0;
          const bTime = b.last_activity ? new Date(b.last_activity).getTime() : 0;
          comparison = aTime - bTime;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [spaces, searchQuery, statusFilter, healthFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedSpaces.length / ITEMS_PER_PAGE);
  const paginatedSpaces = filteredAndSortedSpaces.slice(
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

  const handleViewSpace = (space: SpaceWithDetails) => {
    setSelectedSpace(space);
    setShowSpaceDialog(true);
  };

  const handleContactCreator = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleArchiveSpace = async () => {
    if (!selectedSpace || !adminUser) return;

    setProcessing(true);
    try {
      const { error } = await (supabase as any)
        .from('collaboration_spaces')
        .update({ status: 'archived' })
        .eq('id', selectedSpace.id);

      if (error) throw error;

      // Log admin action
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'space_archived',
        entity_type: 'collaboration_space',
        entity_id: selectedSpace.id,
        details: { note: archiveNote, space_title: selectedSpace.title },
      });

      toast({
        title: 'Success',
        description: 'Space archived successfully',
      });

      setShowArchiveDialog(false);
      setShowSpaceDialog(false);
      setArchiveNote('');
      fetchSpaces();
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

  const handleFeatureSpace = async (space: SpaceWithDetails) => {
    if (!adminUser) return;

    setProcessing(true);
    try {
      // For now, we'll log the feature action - could be expanded to a featured_spaces table
      await (supabase as any).from('admin_activity_log').insert({
        admin_id: adminUser.id,
        action: 'space_featured',
        entity_type: 'collaboration_space',
        entity_id: space.id,
        details: { space_title: space.title },
      });

      toast({
        title: 'Success',
        description: 'Space has been featured',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to feature space',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Space Name', 'Creator', 'Status', 'Members', 'Tasks', 'Health Score', 'Created'];
    const rows = filteredAndSortedSpaces.map(space => [
      space.title,
      space.creator_name || '',
      space.status,
      space.member_count.toString(),
      space.task_count.toString(),
      space.health_score,
      format(new Date(space.created_at), 'yyyy-MM-dd')
    ]);

    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spaces-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500"><Activity className="h-3 w-3 mr-1" />Active</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'archived':
        return <Badge className="bg-neutral-500/10 text-neutral-600 border-neutral-500"><Archive className="h-3 w-3 mr-1" />Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getHealthBadge = (health: string) => {
    switch (health) {
      case 'healthy':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500">Healthy</Badge>;
      case 'stalling':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500">Stalling</Badge>;
      case 'at-risk':
        return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500"><AlertTriangle className="h-3 w-3 mr-1" />At-Risk</Badge>;
      case 'inactive':
        return <Badge className="bg-neutral-500/10 text-neutral-600 border-neutral-500"><XCircle className="h-3 w-3 mr-1" />Inactive</Badge>;
      default:
        return <Badge variant="outline">{health}</Badge>;
    }
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
        <h1 className="text-3xl font-bold mb-2">Space Management</h1>
        <p className="text-muted-foreground">
          View and manage all collaboration spaces across the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{spaces.length}</div>
            <p className="text-sm text-muted-foreground">Total Spaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {spaces.filter(s => s.status === 'active').length}
            </div>
            <p className="text-sm text-muted-foreground">Active Spaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {spaces.filter(s => s.health_score === 'at-risk').length}
            </div>
            <p className="text-sm text-muted-foreground">At-Risk Spaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {spaces.filter(s => s.status === 'completed').length}
            </div>
            <p className="text-sm text-muted-foreground">Completed Projects</p>
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
                  placeholder="Search by space name or creator..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={healthFilter} onValueChange={(v) => { setHealthFilter(v as HealthFilter); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Health" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Health</SelectItem>
                <SelectItem value="healthy">Healthy</SelectItem>
                <SelectItem value="stalling">Stalling</SelectItem>
                <SelectItem value="at-risk">At-Risk</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spaces Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Spaces ({filteredAndSortedSpaces.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Space Name</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort('member_count')}
                    >
                      Members
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead>Tasks</TableHead>
                  <TableHead>
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort('health_score')}
                    >
                      Health
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
                {paginatedSpaces.map((space) => (
                  <TableRow key={space.id}>
                    <TableCell>
                      <div className="font-medium">{space.title}</div>
                      {space.visibility === 'private' && (
                        <span className="text-xs text-muted-foreground">Private</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{space.creator_name}</div>
                      <div className="text-xs text-muted-foreground">{space.creator_email}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(space.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {space.member_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                        {space.completed_task_count}/{space.task_count}
                      </div>
                    </TableCell>
                    <TableCell>{getHealthBadge(space.health_score)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(space.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewSpace(space)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleContactCreator(space.creator_email || '')}
                          disabled={!space.creator_email}
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
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedSpaces.length)} of{' '}
                {filteredAndSortedSpaces.length} spaces
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

          {paginatedSpaces.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No spaces found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Space Details Dialog */}
      <Dialog open={showSpaceDialog} onOpenChange={setShowSpaceDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Space Details</DialogTitle>
          </DialogHeader>

          {selectedSpace && (
            <div className="space-y-6">
              {/* Space Info */}
              <div className="flex items-start gap-4">
                {selectedSpace.image_url ? (
                  <img
                    src={selectedSpace.image_url}
                    alt=""
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{selectedSpace.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    {selectedSpace.description || 'No description'}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {getStatusBadge(selectedSpace.status)}
                    {getHealthBadge(selectedSpace.health_score)}
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Creator</label>
                  <p className="text-foreground">{selectedSpace.creator_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedSpace.creator_email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-foreground">
                    {format(new Date(selectedSpace.created_at), 'PPP')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Members</label>
                  <p className="text-foreground">{selectedSpace.member_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tasks</label>
                  <p className="text-foreground">
                    {selectedSpace.completed_task_count} / {selectedSpace.task_count} completed
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Visibility</label>
                  <p className="text-foreground capitalize">{selectedSpace.visibility}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Activity</label>
                  <p className="text-foreground">
                    {selectedSpace.last_activity
                      ? formatDistanceToNow(new Date(selectedSpace.last_activity), { addSuffix: true })
                      : 'Never'}
                  </p>
                </div>
              </div>

              {/* Tags */}
              {selectedSpace.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpace.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => window.open(`/dna/collaborate/spaces/${selectedSpace.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Space
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleContactCreator(selectedSpace.creator_email || '')}
                  disabled={!selectedSpace.creator_email}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Creator
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFeatureSpace(selectedSpace)}
                  disabled={processing}
                >
                  <Star className="h-4 w-4 mr-2" />
                  Feature Space
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={selectedSpace.status === 'archived'}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Space
                </Button>
              </div>
            </div>
          )}
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
              Are you sure you want to archive "{selectedSpace?.title}"? This will hide the space
              from regular users.
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">Admin Note (optional)</label>
              <Textarea
                value={archiveNote}
                onChange={(e) => setArchiveNote(e.target.value)}
                placeholder="Reason for archiving..."
                rows={3}
              />
            </div>
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
