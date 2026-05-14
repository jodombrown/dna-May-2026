import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GroupCard } from '@/components/groups/GroupCard';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GroupListItem } from '@/types/groups';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus, Search, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LayoutController from '@/components/LayoutController';
import { LeftNav } from '@/components/layout/columns/LeftNav';
import { RightWidgets } from '@/components/layout/columns/RightWidgets';
import { CulturalPattern } from '@/components/shared/CulturalPattern';

type GroupFilter = 'all' | 'my_groups' | 'popular' | 'recommended';

export default function GroupsBrowse() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<GroupFilter>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: groups, refetch, isLoading } = useQuery({
    queryKey: ['groups', user?.id, activeTab, categoryFilter],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase.rpc('get_groups', {
        p_user_id: user.id,
        p_filter: activeTab,
        p_category: categoryFilter === 'all' ? null : categoryFilter,
        p_search: null,
        p_limit: 50,
        p_offset: 0,
      });

      if (error) throw error;
      return (data || []) as GroupListItem[];
    },
    enabled: !!user,
  });

  // Real-time subscription scoped to public groups only. Browse is a
  // discovery surface for non-members, so private/secret group changes
  // are intentionally excluded. Previously this subscribed to a shared
  // `groups_updates` channel that collided with GroupsPage and fired
  // for every group action across the platform.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`groups-browse-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'groups',
          filter: `privacy=eq.public`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const filteredGroups = groups?.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <LayoutController
      leftColumn={<LeftNav />}
      centerColumn={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 relative overflow-hidden rounded-xl p-6">
            <CulturalPattern pattern="ndebele" opacity={0.05} />
            <div className="relative z-10">
              <h1 className="text-h1 font-serif">Groups</h1>
              <p className="text-muted-foreground mt-1">
                Connect with communities that share your interests
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/dna/convene')}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Events
              </Button>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as GroupFilter)}
            >
              <TabsList>
                <TabsTrigger value="all">All Groups</TabsTrigger>
                <TabsTrigger value="my_groups">My Groups</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="recommended">Recommended</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Social">Social</SelectItem>
                  <SelectItem value="Cultural">Cultural</SelectItem>
                  <SelectItem value="Tech">Tech</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Arts">Arts</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Groups Grid */}
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading groups...
            </div>
          ) : filteredGroups && filteredGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <GroupCard key={group.group_id} group={group} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? 'No groups found' : 'No groups yet'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Try adjusting your search or filters' 
                  : activeTab === 'my_groups'
                  ? "You haven't joined any groups yet"
                  : 'Be the first to create a group'}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              )}
            </div>
          )}

          {/* Create Group Dialog */}
          {user && (
            <CreateGroupDialog
              isOpen={showCreateDialog}
              onClose={() => setShowCreateDialog(false)}
              onSuccess={(slug) => {
                setShowCreateDialog(false);
                navigate(`/dna/convene/groups/${slug}`);
              }}
              currentUserId={user.id}
            />
          )}
        </div>
      }
      rightColumn={<RightWidgets variant="convene" />}
    />
  );
}
