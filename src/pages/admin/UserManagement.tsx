import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, User, Mail, MapPin, Calendar, Shield, CheckCircle, XCircle, AlertTriangle, Edit, Trash2, Key, LogOut } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type AppRole = 'admin' | 'moderator' | 'user';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  location: string | null;
  headline: string | null;
  avatar_url: string | null;
  created_at: string;
  verified: boolean | null;
  onboarding_completed_at: string | null;
}

export default function UserManagement() {
  const { user: adminUser } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    username: '',
    headline: '',
    location: '',
  });
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [processing, setProcessing] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search Required',
        description: 'Please enter a search term',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Search profiles by email, name, or username via admin RPC (sensitive cols are revoked from direct SELECT)
      const { data: profiles, error } = await (supabase.rpc as any)('admin_search_profiles', {
        p_query: searchQuery,
        p_limit: 50,
      });

      if (error) throw error;
      setSearchResults(profiles || []);

      if (!profiles || profiles.length === 0) {
        toast({
          title: 'No Results',
          description: 'No users found matching your search',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserDetails = async (userId: string) => {
    try {
      // Fetch user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      setUserRoles((roles?.map(r => r.role).filter(r => r !== null) as AppRole[]) || []);
    } catch (error) {
      // Error loading user details
    }
  };

  const handleViewUser = async (user: UserProfile) => {
    setSelectedUser(user);
    await loadUserDetails(user.id);
    setShowUserDialog(true);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;
    setEditForm({
      full_name: selectedUser.full_name || '',
      username: selectedUser.username || '',
      headline: selectedUser.headline || '',
      location: selectedUser.location || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(editForm)
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Log admin action
      await supabase.from('admin_activity_log').insert({
        admin_id: adminUser!.id,
        action: 'user_profile_updated',
        entity_type: 'user',
        entity_id: selectedUser.id,
        details: { updates: editForm },
      });

      toast({
        title: 'Success',
        description: 'User profile updated successfully',
      });

      // Refresh search results
      handleSearch();
      setShowEditDialog(false);
      setShowUserDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user profile',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleVerification = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const newStatus = !selectedUser.verified;
      const { error } = await supabase
        .from('profiles')
        .update({ verified: newStatus })
        .eq('id', selectedUser.id);

      if (error) throw error;

      await supabase.from('admin_activity_log').insert({
        admin_id: adminUser!.id,
        action: newStatus ? 'user_verified' : 'user_unverified',
        entity_type: 'user',
        entity_id: selectedUser.id,
        details: { previous_status: selectedUser.verified, new_status: newStatus },
      });

      toast({
        title: 'Success',
        description: `User ${newStatus ? 'verified' : 'unverified'} successfully`,
      });

      handleSearch();
      setShowUserDialog(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update verification status',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManageRoles = () => {
    setShowRoleDialog(true);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    setProcessing(true);
    try {
      // Check if role already exists
      if (userRoles.includes(selectedRole)) {
        toast({
          title: 'Role Exists',
          description: 'User already has this role',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: selectedUser.id, role: selectedRole }]);

      if (error) throw error;

      await supabase.from('admin_activity_log').insert({
        admin_id: adminUser!.id,
        action: 'role_assigned',
        entity_type: 'user',
        entity_id: selectedUser.id,
        details: { role: selectedRole },
      });

      toast({
        title: 'Success',
        description: `Role ${selectedRole} assigned successfully`,
      });

      await loadUserDetails(selectedUser.id);
      setSelectedRole('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign role',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveRole = async (role: AppRole) => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id)
        .eq('role', role);

      if (error) throw error;

      await supabase.from('admin_activity_log').insert({
        admin_id: adminUser!.id,
        action: 'role_removed',
        entity_type: 'user',
        entity_id: selectedUser.id,
        details: { role },
      });

      toast({
        title: 'Success',
        description: `Role ${role} removed successfully`,
      });

      await loadUserDetails(selectedUser.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove role',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getRoleBadge = (role: AppRole) => {
    const colors: Record<AppRole, string> = {
      admin: 'bg-red-500 text-white',
      moderator: 'bg-blue-500 text-white',
      user: 'bg-neutral-500 text-white',
    };
    return <Badge className={colors[role] || 'bg-neutral-500 text-white'}>{role}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-muted-foreground">
          Search, view, and manage user accounts and permissions
        </p>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.full_name || 'No name'}</p>
                        {user.verified && (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                        {user.username && (
                          <span>@{user.username}</span>
                        )}
                        {user.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {user.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => handleViewUser(user)}>
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-start gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 text-primary" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold">{selectedUser.full_name || 'No name'}</h3>
                    {selectedUser.verified && (
                      <Badge variant="default" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{selectedUser.headline || 'No headline'}</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-foreground">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Username</label>
                  <p className="text-foreground">{selectedUser.username || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Location</label>
                  <p className="text-foreground">{selectedUser.location || 'Not set'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Joined</label>
                  <p className="text-foreground">
                    {formatDistanceToNow(new Date(selectedUser.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-foreground text-xs font-mono">{selectedUser.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Onboarding</label>
                  <p className="text-foreground">
                    {selectedUser.onboarding_completed_at ? 'Completed' : 'Not completed'}
                  </p>
                </div>
              </div>

              {/* Roles */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Roles</label>
                <div className="flex flex-wrap gap-2">
                  {userRoles.length > 0 ? (
                    userRoles.map(role => getRoleBadge(role))
                  ) : (
                    <p className="text-muted-foreground text-sm">No roles assigned</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handleEditUser}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" onClick={handleToggleVerification} disabled={processing}>
                  {selectedUser.verified ? (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Remove Verification
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Verify User
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleManageRoles}>
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Roles
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Profile</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Full Name</label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Username</label>
              <Input
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Headline</label>
              <Input
                value={editForm.headline}
                onChange={(e) => setEditForm({ ...editForm, headline: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Location</label>
              <Input
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Roles Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage User Roles</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Roles */}
            <div>
              <label className="text-sm font-medium mb-2 block">Current Roles</label>
              <div className="flex flex-wrap gap-2">
                {userRoles.length > 0 ? (
                  userRoles.map(role => (
                    <div key={role} className="flex items-center gap-2">
                      {getRoleBadge(role)}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveRole(role)}
                        disabled={processing}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No roles assigned</p>
                )}
              </div>
            </div>

            {/* Assign New Role */}
            <div>
              <label className="text-sm font-medium mb-2 block">Assign New Role</label>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole | '')}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAssignRole} disabled={!selectedRole || processing}>
                  Assign
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
