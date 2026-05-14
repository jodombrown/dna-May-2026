import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Camera, Loader2, Search, Users, X } from 'lucide-react';
import { connectionService } from '@/services/connectionService';
import { groupMessageService } from '@/services/groupMessageService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMobile } from '@/hooks/useMobile';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { ConnectionProfile } from '@/types/connections';

interface CreateGroupDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: (conversationId: string) => void;
}

export function CreateGroupDrawer({
  open,
  onOpenChange,
  onGroupCreated,
}: CreateGroupDrawerProps) {
  const { user } = useAuth();
  const { isMobile } = useMobile();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [groupName, setGroupName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['connections-for-group', searchTerm],
    queryFn: () => connectionService.getConnections(searchTerm || undefined),
    enabled: open,
  });

  const filteredConnections = useMemo(() => {
    if (!connections) return [];
    return connections;
  }, [connections]);

  const toggleSelection = useCallback((userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type.toLowerCase())) {
      toast.error('Please choose a JPG, PNG, or WebP image');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadGroupAvatar = async (uid: string): Promise<string | null> => {
    if (!avatarFile) return null;
    setUploadingAvatar(true);
    try {
      const clean = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
      const path = `${uid}/groups/${Date.now()}_${clean}`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { cacheControl: '3600', upsert: false, contentType: avatarFile.type });
      if (error) throw error;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      return data.publicUrl;
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCreate = async () => {
    if (!user?.id) {
      toast.error('You must be signed in');
      return;
    }
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedIds.size < 2) {
      toast.error('Select at least 2 members to create a group');
      return;
    }
    if (selectedIds.size > 49) {
      toast.error('Groups can have up to 50 members (including you)');
      return;
    }

    setIsCreating(true);
    try {
      const conversationId = await groupMessageService.createGroupConversation({
        title: groupName.trim(),
        participantIds: Array.from(selectedIds),
      });

      // Upload avatar (best-effort) and persist via updateGroupInfo
      let avatarUrl: string | null = null;
      try {
        avatarUrl = await uploadGroupAvatar(user.id);
        if (avatarUrl) {
          await groupMessageService.updateGroupInfo(conversationId, { avatarUrl });
        }
      } catch (err) {
        // Non-fatal: group is created without an avatar
        console.warn('[CreateGroupDrawer] avatar upload failed', err);
      }

      // System message: "X created the group 'Y'"
      try {
        const creatorName =
          (user.user_metadata as { full_name?: string } | undefined)?.full_name || 'Someone';
        await groupMessageService.sendSystemMessage(
          conversationId,
          `${creatorName} created the group "${groupName.trim()}"`,
        );
      } catch (err) {
        console.warn('[CreateGroupDrawer] system message failed', err);
      }

      toast.success(`Group "${groupName.trim()}" created`);
      onGroupCreated?.(conversationId);
      handleClose();
      navigate(`/dna/messages/group/${conversationId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create group';
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSearchTerm('');
    setSelectedIds(new Set());
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <label
          htmlFor="group-avatar-input"
          className="relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border hover:ring-primary"
          aria-label="Upload group photo"
        >
          {avatarPreview ? (
            <img src={avatarPreview} alt="Group preview" className="h-full w-full object-cover" />
          ) : (
            <Camera className="h-6 w-6 text-muted-foreground" />
          )}
          <input
            id="group-avatar-input"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={isCreating || uploadingAvatar}
          />
        </label>
        <div className="flex-1 space-y-1">
          <label className="text-sm font-medium">Group Name</label>
          <Input
            placeholder="e.g. Lagos Tech Founders"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            maxLength={100}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Add Members (from connections)</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filteredConnections
            .filter((c) => selectedIds.has(c.id))
            .map((c) => (
              <Badge
                key={c.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {c.full_name}
                <button
                  onClick={() => toggleSelection(c.id)}
                  className="ml-0.5 rounded-full hover:bg-muted p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
        </div>
      )}

      <ScrollArea className="h-[300px] border rounded-md">
        {connectionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredConnections.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            {searchTerm ? 'No connections found' : 'No connections yet'}
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredConnections.map((connection) => (
              <ConnectionRow
                key={connection.id}
                connection={connection}
                isSelected={selectedIds.has(connection.id)}
                onToggle={() => toggleSelection(connection.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-muted-foreground">
          {selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''} selected
        </span>
        <Button
          onClick={handleCreate}
          disabled={isCreating || !groupName.trim() || selectedIds.size < 2}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Users className="h-4 w-4 mr-2" />
          )}
          Create Group
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Create Group Conversation</DrawerTitle>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[440px]">
        <SheetHeader>
          <SheetTitle>Create Group Conversation</SheetTitle>
        </SheetHeader>
        {content}
      </SheetContent>
    </Sheet>
  );
}

function ConnectionRow({
  connection,
  isSelected,
  onToggle,
}: {
  connection: ConnectionProfile;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-muted/50 transition-colors"
    >
      <Checkbox checked={isSelected} className="pointer-events-none" />
      <Avatar className="h-9 w-9">
        <AvatarImage src={connection.avatar_url} />
        <AvatarFallback className="text-sm">
          {connection.full_name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium truncate">{connection.full_name}</p>
        {connection.location && (
          <p className="text-xs text-muted-foreground truncate">
            {connection.location}
          </p>
        )}
      </div>
    </button>
  );
}
