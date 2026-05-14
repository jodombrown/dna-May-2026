import { useState } from 'react';
import { Hash, Plus, Archive, RotateCcw, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { useHashtagOwnership } from '@/hooks/useHashtagOwnership';

export default function MyHashtagsSettings() {
  const {
    limits,
    activeHashtags,
    archivedHashtags,
    pendingRequests,
    pendingCount,
    canCreateMore,
    availableSlots,
    isLoading,
    createHashtag,
    archiveHashtag,
    reactivateHashtag,
    approveRequest,
    denyRequest,
    isCreating,
    isArchiving,
    isReactivating,
    isReviewing
  } = useHashtagOwnership();

  const [newTag, setNewTag] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleCreate = async () => {
    if (!newTag.trim()) return;

    const result = await createHashtag(newTag.trim(), newDescription.trim() || undefined);
    if (result.success) {
      setNewTag('');
      setNewDescription('');
      setCreateDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <SettingsLayout title="My Hashtags" description="Create and manage your personal hashtags">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout title="My Hashtags" description="Create and manage your personal hashtags">
      <div className="space-y-6">
        {/* Header with limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              My Hashtags
            </CardTitle>
            <CardDescription>
              Create and manage your personal hashtags. You can own up to 5 hashtags.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex gap-6">
                <div>
                  <p className="text-h2 font-serif">{limits?.active_count || 0}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-h2 font-serif">{limits?.archived_count || 0}</p>
                  <p className="text-sm text-muted-foreground">Archived</p>
                </div>
                <div>
                  <p className="text-h2 font-serif">{availableSlots}</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </div>
              </div>

              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button disabled={!canCreateMore}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Hashtag
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Personal Hashtag</DialogTitle>
                    <DialogDescription>
                      Create a hashtag that you own. Others will need your approval to use it.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">Hashtag Name</label>
                      <div className="flex items-center mt-1">
                        <span className="text-muted-foreground mr-1">#</span>
                        <Input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                          placeholder="YourHashtag"
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description (optional)</label>
                      <Textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="What is this hashtag about?"
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!newTag.trim() || isCreating}>
                      {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Create
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for hashtags and requests */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({activeHashtags.length})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archivedHashtags.length})</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Hashtags */}
          <TabsContent value="active" className="space-y-4">
            {activeHashtags.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Hash className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't created any hashtags yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setCreateDialogOpen(true)}
                    disabled={!canCreateMore}
                  >
                    Create your first hashtag
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeHashtags.map((hashtag) => (
                <Card key={hashtag.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">#{hashtag.tag}</h3>
                        {hashtag.description && (
                          <p className="text-sm text-muted-foreground mt-1">{hashtag.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{hashtag.usage_count} uses</span>
                          <span>{hashtag.follower_count} followers</span>
                          {hashtag.pending_requests > 0 && (
                            <span className="text-orange-500">{hashtag.pending_requests} pending</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archiveHashtag(hashtag.id)}
                        disabled={isArchiving}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Archived Hashtags */}
          <TabsContent value="archived" className="space-y-4">
            {archivedHashtags.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No archived hashtags</p>
                </CardContent>
              </Card>
            ) : (
              archivedHashtags.map((hashtag) => (
                <Card key={hashtag.id} className="opacity-75">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">#{hashtag.tag}</h3>
                        <Badge variant="secondary" className="mt-1">Archived</Badge>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{hashtag.usage_count} uses</span>
                          <span>{hashtag.follower_count} followers</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reactivateHashtag(hashtag.id)}
                        disabled={!canCreateMore || isReactivating}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.request_id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={request.requester_avatar || undefined} />
                        <AvatarFallback>{request.requester_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p>
                          <span className="font-medium">{request.requester_name}</span>
                          {' wants to use '}
                          <span className="font-medium text-primary">#{request.hashtag_tag}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          "{request.post_content}"
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => denyRequest(request.request_id)}
                          disabled={isReviewing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => approveRequest(request.request_id)}
                          disabled={isReviewing}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
}
