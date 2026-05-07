import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GroupCard } from '@/components/groups/GroupCard';
import { CreateGroupDialog } from '@/components/groups/CreateGroupDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { GroupListItem } from '@/types/groups';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type GroupFilter = 'all' | 'my_groups' | 'popular' | 'recommended';

export default function GroupsPage() {
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

  // Real-time subscription scoped to the current user's group memberships.
  // Previously this subscribed to a shared `groups_updates` channel that
  // (a) collided with GroupsBrowse and (b) was unfiltered, causing every
  // group action by any user to invalidate this query for every session.
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`groups-page-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`,
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Groups</h1>
            <p className="text-muted-foreground mt-1">
              Connect with communities that share your interests
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
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
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="culture">Culture & Arts</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="health">Health & Wellness</SelectItem>
                <SelectItem value="social">Social</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="regional">Regional</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
          <div className="text-center py-16 bg-muted/30 rounded-lg">
            <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No groups found' : 'No groups yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? 'Try a different search term'
                : activeTab === 'my_groups'
                ? "You haven't joined any groups yet"
                : 'Be the first to create a community!'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-[hsl(151,75%,50%)] hover:bg-[hsl(151,75%,40%)] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            )}
          </div>
        )}
      </div>

      <CreateGroupDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        currentUserId={user?.id || ''}
        onSuccess={(slug) => {
          refetch();
          navigate(`/dna/convene/groups/${slug}`);
        }}
      />
    </div>
  );
}
